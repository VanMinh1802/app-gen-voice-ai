/**
 * R2-aware Piper TTS loader.
 * Loads models from R2 with IndexedDB caching for offline reuse.
 */

import { loadCustomPiper, type PiperCustomSession, type PiperVoiceConfig } from "./piperCustom";
import {
  saveModelToCache,
  loadModelFromCache,
  isModelCached,
  isIndexedDBAvailable,
} from "@/lib/storage/modelCache";

export interface LoadModelOptions {
  voiceId: string;
  baseUrl?: string;
  onProgress?: (progress: number) => void;
}

const DEFAULT_BASE_URL = "/api/models";

/**
 * Load Piper model with R2 + IndexedDB caching.
 * 1. Check IndexedDB cache first
 * 2. If not cached, download from R2 via API
 * 3. Cache the model in IndexedDB
 * 4. Load the model
 */
export async function loadPiperWithCache(
  options: LoadModelOptions
): Promise<{ session: PiperCustomSession; fromCache: boolean }> {
  const { voiceId, baseUrl = DEFAULT_BASE_URL, onProgress } = options;

  onProgress?.(0);

  // Step 1: Try to load from IndexedDB cache
  if (isIndexedDBAvailable()) {
    const cached = await loadModelFromCache(voiceId);
    if (cached) {
      console.log(`[piperR2] Loading ${voiceId} from IndexedDB cache`);
      const session = await loadFromArrayBuffer(voiceId, cached.model, cached.config);
      onProgress?.(100);
      return { session, fromCache: true };
    }
  }

  console.log(`[piperR2] ${voiceId} not in cache, downloading from R2...`);
  onProgress?.(10);

  // Step 2: Download from R2
  const modelUrl = `${baseUrl}/${voiceId}/model.onnx`;
  const configUrl = `${baseUrl}/${voiceId}/model.onnx.json`;

  onProgress?.(20);

  const [modelRes, configRes] = await Promise.all([
    fetch(modelUrl),
    fetch(configUrl),
  ]);

  if (!modelRes.ok) {
    throw new Error(`Failed to download model: ${modelRes.status} ${modelUrl}`);
  }
  if (!configRes.ok) {
    throw new Error(`Failed to download config: ${configRes.status} ${configUrl}`);
  }

  onProgress?.(50);

  // Read model as ArrayBuffer
  const modelBuffer = await modelRes.arrayBuffer();
  const configText = await configRes.text();

  if (/^\s*Entry not found\s*$/i.test(configText) || /^\s*<!DOCTYPE/i.test(configText)) {
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
      await saveModelToCache(voiceId, modelBuffer, voiceConfig);
      console.log(`[piperR2] Cached ${voiceId} in IndexedDB`);
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
  config: PiperVoiceConfig
): Promise<PiperCustomSession> {
  const ort = await import("onnxruntime-web");

  const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
    executionProviders: ["wasm"],
  });

  const sampleRate = config.audio?.sample_rate ?? 22050;
  const noiseScale = config.inference?.noise_scale ?? 0.667;
  const lengthScaleDefault = config.inference?.length_scale ?? 1.0;
  const noiseW = config.inference?.noise_w ?? 0.8;
  const espeakVoice = config.espeak?.voice ?? "vi";
  const phonemeType = config.phoneme_type;

  function toId(value: number | number[] | undefined): number {
    if (value === undefined) return 0;
    return Array.isArray(value) ? value[0] ?? 0 : value;
  }

  async function runPiperPhonemize(text: string): Promise<number[] | null> {
    const timeoutMs = 15000;
    try {
      const phonemizeChunkUrl =
        "https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.4/dist/piper-o91UDS6e.js";
      const mod = await import(/* webpackIgnore: true */ phonemizeChunkUrl);
      const createPiperPhonemize =
        typeof mod.default === "function"
          ? mod.default
          : (mod as { createPiperPhonemize?: (opts: unknown) => Promise<unknown> }).createPiperPhonemize;
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
            if (Array.isArray(parsed.phoneme_ids)) resolvePhonemeIds(parsed.phoneme_ids);
          } catch {
            // ignore
          }
        },
        printErr() {
          // ignore
        },
        locateFile(url: string) {
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

  async function predict(
    text: string,
    options?: { speakerId?: number; lengthScale?: number }
  ): Promise<Float32Array> {
    const trimmed = text.trim();
    if (!trimmed) return new Float32Array(0);

    const lengthScale = 1 / (options?.lengthScale ?? lengthScaleDefault);
    const speakerId = options?.speakerId ?? 0;

    let phonemeIds: number[];

    if (phonemeType === "text") {
      const normalized = trimmed.normalize("NFD");
      phonemeIds = phonemesToIds([Array.from(normalized)], config.phoneme_id_map);
    } else if (phonemeType === "espeak") {
      const { normalizeVietnamese } = await import("@/lib/text-processing/vietnameseNormalizer");
      const preprocessed = normalizeVietnamese(trimmed);
      const wasmIds = await runPiperPhonemize(preprocessed);
      if (wasmIds && wasmIds.length > 0) {
        phonemeIds = wasmIds;
      } else {
        const normalized = preprocessed.normalize("NFD").toLowerCase();
        phonemeIds = phonemesToIds([Array.from(normalized)], config.phoneme_id_map);
      }
    } else {
      const normalized = trimmed.normalize("NFD");
      phonemeIds = phonemesToIds([Array.from(normalized)], config.phoneme_id_map);
    }

    const Tensor = ort.Tensor;
    const input = new Tensor(
      "int64",
      new BigInt64Array(phonemeIds.map((id) => BigInt(id))),
      [1, phonemeIds.length]
    );
    const input_lengths = new Tensor("int64", BigInt64Array.from([BigInt(phonemeIds.length)]), [1]);
    const scales = new Tensor(
      "float32",
      Float32Array.from([noiseScale, lengthScale, noiseW]),
      [3]
    );

    const inputs: Record<string, InstanceType<typeof Tensor>> = {
      input,
      input_lengths,
      scales,
    };

    if (config.num_speakers && config.num_speakers > 1 && config.speaker_id_map) {
      const sid = config.speaker_id_map[speakerId] ?? 0;
      inputs["sid"] = new Tensor("int64", BigInt64Array.from([BigInt(sid)]), [1]);
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
  idMap: Record<string, number | number[]>
): number[] {
  const BOS = "^";
  const EOS = "$";
  const PAD = "_";
  const ids: number[] = [];

  function toIdValue(value: number | number[] | undefined): number {
    if (value === undefined) return 0;
    return Array.isArray(value) ? value[0] ?? 0 : value;
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
 * Get sample audio URL for voice preview.
 */
export function getVoiceSampleUrl(voiceId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  if (baseUrl) {
    return `${baseUrl}/vi/${voiceId}/sample.wav`;
  }
  return `/api/models/${voiceId}/sample.wav`;
}
