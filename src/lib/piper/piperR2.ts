/**
 * R2-aware Piper TTS loader.
 * Loads models from R2 with IndexedDB caching for offline reuse.
 */

/** CDN base cho Piper phonemizer WASM (.wasm / .data) — tránh request relative → localhost 404 */
const PIPER_PHONEMIZE_CDN =
  "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";

import {
  loadCustomPiper,
  type PiperCustomSession,
  type PiperVoiceConfig,
} from "./piperCustom";
import {
  saveModelToCache,
  loadModelFromCache,
  isModelCached,
  getCachedVersion,
  isIndexedDBAvailable,
} from "@/lib/storage/modelCache";
import { getR2PublicUrl } from "@/lib/config/r2Config";
import { getR2FolderForVoice, getModelFileName } from "@/config";

export interface LoadModelOptions {
  voiceId: string;
  baseUrl?: string;
  onProgress?: (progress: number) => void;
}

const DEFAULT_BASE_URL = "/api/models";

/** Version file URL - stored in public folder */
const VERSIONS_URL = "/tts-model/vi/versions.json";

/**
 * Compare two semantic versions. Returns true if cloudVersion > localVersion.
 * Treats undefined/missing as "0.0.0" (legacy cache).
 */
function isNewerVersion(
  cloudVersion: string | undefined,
  localVersion: string | undefined,
): boolean {
  const cloud = (cloudVersion ?? "0.0.0").split(".").map(Number);
  const local = (localVersion ?? "0.0.0").split(".").map(Number);

  for (let i = 0; i < Math.max(cloud.length, local.length); i++) {
    const c = cloud[i] ?? 0;
    const l = local[i] ?? 0;
    if (c > l) return true;
    if (c < l) return false;
  }
  return false;
}

/**
 * Fetch versions.json from server.
 */
async function fetchVersions(): Promise<Record<string, string>> {
  try {
    const res = await fetch(VERSIONS_URL + "?t=" + Date.now());
    if (!res.ok) {
      console.warn(
        "[piperR2] Failed to fetch versions.json, assuming all cached",
      );
      return {};
    }
    return await res.json();
  } catch (error) {
    console.warn("[piperR2] Error fetching versions.json:", error);
    return {};
  }
}

/**
 * Load Piper model with R2 + IndexedDB caching.
 * 1. Fetch versions.json to check for updates
 * 2. Check IndexedDB cache (if not cached or version mismatch, download from R2)
 * 3. Cache the model in IndexedDB with version
 * 4. Load the model
 */
export async function loadPiperWithCache(
  options: LoadModelOptions,
): Promise<{ session: PiperCustomSession; fromCache: boolean }> {
  const { voiceId, baseUrl = DEFAULT_BASE_URL, onProgress } = options;
  const r2Folder = getR2FolderForVoice(voiceId);

  onProgress?.(0);

  // Step 1: Fetch versions.json to check if cache is outdated
  let cloudVersions: Record<string, string> = {};
  if (isIndexedDBAvailable()) {
    cloudVersions = await fetchVersions();
  }

  // Step 2: Try to load from IndexedDB cache
  if (isIndexedDBAvailable()) {
    const cached = await loadModelFromCache(voiceId);
    if (cached) {
      const cloudVersion = cloudVersions[voiceId];

      // Check if cloud has newer version
      if (cloudVersion && isNewerVersion(cloudVersion, cached.version)) {
        console.log(
          `[piperR2] ${voiceId} cache outdated (local: ${cached.version}, cloud: ${cloudVersion}), re-downloading...`,
        );
        const { deleteModelFromCache } =
          await import("@/lib/storage/modelCache");
        await deleteModelFromCache(voiceId);
      } else {
        console.log(
          `[piperR2] Loading ${voiceId} (v${cached.version ?? "?"}) from IndexedDB cache`,
        );
        const session = await loadFromArrayBuffer(
          voiceId,
          cached.model,
          cached.config,
        );
        onProgress?.(100);
        return { session, fromCache: true };
      }
    }
  }

  console.log(`[piperR2] ${voiceId} not in cache, downloading from R2...`);
  onProgress?.(10);

  // Step 2: Download from R2 (file names in R2: {modelFileName}.onnx, {modelFileName}.onnx.json)
  const modelFileName = getModelFileName(voiceId);
  const modelUrl = `${baseUrl}/${r2Folder}/${modelFileName}.onnx`;
  const configUrl = `${baseUrl}/${r2Folder}/${modelFileName}.onnx.json`;

  onProgress?.(20);

  const [modelRes, configRes] = await Promise.all([
    fetch(modelUrl),
    fetch(configUrl),
  ]);

  if (!modelRes.ok) {
    throw new Error(`Failed to download model: ${modelRes.status} ${modelUrl}`);
  }
  if (!configRes.ok) {
    throw new Error(
      `Failed to download config: ${configRes.status} ${configUrl}`,
    );
  }

  onProgress?.(50);

  // Read model as ArrayBuffer
  const modelBuffer = await modelRes.arrayBuffer();
  const configText = await configRes.text();

  if (
    /^\s*Entry not found\s*$/i.test(configText) ||
    /^\s*<!DOCTYPE/i.test(configText)
  ) {
    throw new Error("Voice or model config not found in R2");
  }

  let voiceConfig: PiperVoiceConfig;
  try {
    voiceConfig = JSON.parse(configText) as PiperVoiceConfig;
  } catch {
    throw new Error("Invalid voice config format from R2");
  }

  onProgress?.(70);

  // Step 3: Cache in IndexedDB
  if (isIndexedDBAvailable()) {
    try {
      const version = cloudVersions[voiceId] || "1.0.0";
      await saveModelToCache(voiceId, modelBuffer, voiceConfig, version);
      console.log(`[piperR2] Cached ${voiceId} (v${version}) in IndexedDB`);
    } catch (error) {
      console.warn(`[piperR2] Failed to cache ${voiceId}:`, error);
    }
  }

  onProgress?.(80);

  // Step 4: Load model
  const session = await loadFromArrayBuffer(voiceId, modelBuffer, voiceConfig);

  onProgress?.(100);

  return { session, fromCache: false };
}

/**
 * Load Piper model from ArrayBuffer (cached or fresh).
 */
async function loadFromArrayBuffer(
  voiceId: string,
  modelBuffer: ArrayBuffer,
  config: PiperVoiceConfig,
): Promise<PiperCustomSession> {
  const ort = await import("onnxruntime-web");

  const session = await ort.InferenceSession.create(
    new Uint8Array(modelBuffer),
    {
      executionProviders: ["wasm"],
    },
  );

  const sampleRate = config.audio?.sample_rate ?? 22050;
  const noiseScale = config.inference?.noise_scale ?? 0.667;
  const lengthScaleDefault = config.inference?.length_scale ?? 1.0;
  const noiseW = config.inference?.noise_w ?? 0.8;
  const espeakVoice = config.espeak?.voice ?? "vi";
  const phonemeType = config.phoneme_type;

  function toId(value: number | number[] | undefined): number {
    if (value === undefined) return 0;
    return Array.isArray(value) ? (value[0] ?? 0) : value;
  }

  async function runPiperPhonemize(text: string): Promise<number[] | null> {
    // Increase timeout for long text (2000+ characters can take longer to process)
    const timeoutMs = 60000;
    try {
      const phonemizeChunkUrl =
        "https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.4/dist/piper-o91UDS6e.js";
      const mod = await import(/* webpackIgnore: true */ phonemizeChunkUrl);
      const createPiperPhonemize =
        typeof mod.default === "function"
          ? mod.default
          : (
              mod as {
                createPiperPhonemize?: (opts: unknown) => Promise<unknown>;
              }
            ).createPiperPhonemize;
      if (typeof createPiperPhonemize !== "function") return null;

      let resolvePhonemeIds: (ids: number[]) => void;
      const idsPromise = new Promise<number[]>((resolve) => {
        resolvePhonemeIds = resolve;
      });
      const timeoutPromise = new Promise<number[] | null>((_, reject) => {
        setTimeout(() => reject(new Error("Phonemizer timeout")), timeoutMs);
      });

      const wasmModule = (await createPiperPhonemize({
        print(data: string) {
          try {
            const parsed = JSON.parse(data) as { phoneme_ids?: number[] };
            if (Array.isArray(parsed.phoneme_ids))
              resolvePhonemeIds(parsed.phoneme_ids);
          } catch {
            // ignore
          }
        },
        printErr() {
          // ignore
        },
        locateFile(url: string) {
          if (url.endsWith(".wasm")) return `${PIPER_PHONEMIZE_CDN}.wasm`;
          if (url.endsWith(".data")) return `${PIPER_PHONEMIZE_CDN}.data`;
          return url;
        },
      })) as { callMain: (args: string[]) => void };

      wasmModule.callMain([
        "-l",
        espeakVoice,
        "--input",
        JSON.stringify([{ text }]),
        "--espeak_data",
        "/espeak-ng-data",
      ]);

      return await Promise.race([idsPromise, timeoutPromise]);
    } catch {
      return null;
    }
  }

  /**
   * Split text into chunks (by sentences or paragraphs) for processing.
   * Each chunk is processed separately and concatenated.
   */
  function splitTextIntoChunks(
    text: string,
    maxChunkSize: number = 500,
  ): string[] {
    // Split by common sentence endings first
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        // If a single sentence is longer than maxChunkSize, split it by words
        if (sentence.length > maxChunkSize) {
          const words = sentence.split(/\s+/);
          currentChunk = "";
          for (const word of words) {
            if (currentChunk.length + word.length <= maxChunkSize) {
              currentChunk += word + " ";
            } else {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
              }
              currentChunk = word + " ";
            }
          }
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async function predict(
    text: string,
    options?: {
      speakerId?: number;
      lengthScale?: number;
      onProgress?: (progress: number) => void;
    },
  ): Promise<Float32Array> {
    const trimmed = text.trim();
    if (!trimmed) return new Float32Array(0);

    const lengthScale = 1 / (options?.lengthScale ?? lengthScaleDefault);
    const speakerId = options?.speakerId ?? 0;
    const onProgress = options?.onProgress;

    // Use chunking for long text to avoid memory issues
    const chunks = splitTextIntoChunks(trimmed, 500);

    if (chunks.length === 1) {
      // Single chunk - process normally
      onProgress?.(50); // Starting inference
      return processSingleChunk(chunks[0], lengthScale, speakerId);
    }

    // Multiple chunks - process each and concatenate
    const audioChunks: Float32Array[] = [];
    const totalChunks = chunks.length;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Progress: 40-80% based on chunk progress
      const chunkProgress = 40 + Math.round((i / totalChunks) * 40);
      onProgress?.(chunkProgress);

      const audioChunk = await processSingleChunk(
        chunk,
        lengthScale,
        speakerId,
      );
      audioChunks.push(audioChunk);
    }

    // Concatenate all chunks
    const totalLength = audioChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0,
    );
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    onProgress?.(90); // Almost done
    return result;
  }

  /**
   * Process a single chunk of text through the TTS model.
   */
  async function processSingleChunk(
    textChunk: string,
    lengthScale: number,
    speakerId: number,
  ): Promise<Float32Array> {
    let phonemeIds: number[];

    if (phonemeType === "text") {
      const normalized = textChunk.normalize("NFD");
      phonemeIds = phonemesToIds(
        [Array.from(normalized)],
        config.phoneme_id_map,
      );
    } else if (phonemeType === "espeak") {
      const { normalizeVietnamese } =
        await import("@/lib/text-processing/vietnameseNormalizer");
      const preprocessed = normalizeVietnamese(textChunk);
      const wasmIds = await runPiperPhonemize(preprocessed);
      if (wasmIds && wasmIds.length > 0) {
        phonemeIds = wasmIds;
      } else {
        const normalized = preprocessed.normalize("NFD").toLowerCase();
        phonemeIds = phonemesToIds(
          [Array.from(normalized)],
          config.phoneme_id_map,
        );
      }
    } else {
      const normalized = textChunk.normalize("NFD");
      phonemeIds = phonemesToIds(
        [Array.from(normalized)],
        config.phoneme_id_map,
      );
    }

    const Tensor = ort.Tensor;
    const input = new Tensor(
      "int64",
      new BigInt64Array(phonemeIds.map((id) => BigInt(id))),
      [1, phonemeIds.length],
    );
    const input_lengths = new Tensor(
      "int64",
      BigInt64Array.from([BigInt(phonemeIds.length)]),
      [1],
    );
    const scales = new Tensor(
      "float32",
      Float32Array.from([noiseScale, lengthScale, noiseW]),
      [3],
    );

    const inputs: Record<string, InstanceType<typeof Tensor>> = {
      input,
      input_lengths,
      scales,
    };

    if (
      config.num_speakers &&
      config.num_speakers > 1 &&
      config.speaker_id_map
    ) {
      const sid = config.speaker_id_map[speakerId] ?? 0;
      inputs["sid"] = new Tensor(
        "int64",
        BigInt64Array.from([BigInt(sid)]),
        [1],
      );
    }

    const results = await session.run(inputs);
    const output = results["output"] as { data: Float32Array } | undefined;
    if (!output || !(output.data instanceof Float32Array)) {
      throw new Error("Invalid model output");
    }

    return output.data;
  }

  return {
    predict,
    sampleRate,
  };
}

function phonemesToIds(
  textPhonemes: string[][],
  idMap: Record<string, number | number[]>,
): number[] {
  const BOS = "^";
  const EOS = "$";
  const PAD = "_";
  const ids: number[] = [];

  function toIdValue(value: number | number[] | undefined): number {
    if (value === undefined) return 0;
    return Array.isArray(value) ? (value[0] ?? 0) : value;
  }

  for (const sentence of textPhonemes) {
    ids.push(toIdValue(idMap[BOS]));
    ids.push(toIdValue(idMap[PAD]));
    for (const p of sentence) {
      if (p in idMap) {
        ids.push(toIdValue(idMap[p]));
        ids.push(toIdValue(idMap[PAD]));
      }
    }
    ids.push(toIdValue(idMap[EOS]));
  }

  return ids;
}

/**
 * Check if model is already cached.
 */
export async function isVoiceCached(voiceId: string): Promise<boolean> {
  return isIndexedDBAvailable() ? isModelCached(voiceId) : false;
}

/**
 * Returns the URL for the pre-rendered voice sample (sample.wav) for preview.
 * Uses R2 public URL when configured; otherwise the API proxy.
 * Uses getR2FolderForVoice so voiceId mytam2 → path vi/mytam/ on R2.
 */
export function getVoiceSampleUrl(voiceId: string): string {
  const baseUrl = getR2PublicUrl() || "";
  const r2Folder = getR2FolderForVoice(voiceId);
  if (baseUrl.startsWith("http")) {
    return `${baseUrl.replace(/\/$/, "")}/vi/${r2Folder}/sample.wav`;
  }
  return `/api/models/${voiceId}/sample.wav`;
}
