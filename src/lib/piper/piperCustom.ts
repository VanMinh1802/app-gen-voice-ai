/**
 * Custom Piper TTS loader for pre-trained models (.onnx + .onnx.json) served from URL.
 * - phoneme_type "text": normalized NFD characters → phoneme_id_map.
 * - phoneme_type "espeak": Prefer Piper WASM phonemizer (same as built-in voices); fallback: Vietnamese
 *   preprocessing + NFD + lowercase for phoneme_id_map.
 * Reference: nghitts and @mintplex-labs/piper-tts-web.
 */

import { normalizeVietnamese } from "@/lib/text-processing/vietnameseNormalizer";

export interface PiperVoiceConfig {
  phoneme_type: "text" | "espeak";
  espeak?: { voice: string };
  /** Values can be number or number[] (Piper export sometimes uses arrays). */
  phoneme_id_map: Record<string, number | number[]>;
  num_speakers?: number;
  speaker_id_map?: Record<string, number>;
  audio: { sample_rate: number };
  inference?: {
    noise_scale?: number;
    length_scale?: number;
    noise_w?: number;
  };
}

export interface PiperPhonemizePaths {
  piperWasm: string;
  piperData: string;
}

export interface PiperCustomSession {
  predict(text: string, options?: { speakerId?: number; lengthScale?: number }): Promise<Float32Array>;
  sampleRate: number;
}

/**
 * Load model and config from base URL.
 * e.g. baseUrl = "/tts-model/vi", modelName = "ngochuyen"
 * → fetches /tts-model/vi/ngochuyen.onnx and /tts-model/vi/ngochuyen.onnx.json
 * For phoneme_type "espeak", pass piperPhonemizePaths so the Piper WASM phonemizer can be used for correct Vietnamese.
 */
export async function loadCustomPiper(
  baseUrl: string,
  modelName: string,
  wasmBaseUrl?: string,
  piperPhonemizePaths?: PiperPhonemizePaths
): Promise<PiperCustomSession> {
  const ort = await import("onnxruntime-web");

  if (wasmBaseUrl) {
    ort.env.wasm.wasmPaths = wasmBaseUrl;
  }

  const modelUrl = `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(modelName)}.onnx`;
  const configUrl = `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(modelName)}.onnx.json`;

  const [modelRes, configRes] = await Promise.all([fetch(modelUrl), fetch(configUrl)]);
  if (!modelRes.ok) throw new Error(`Failed to load model: ${modelRes.status} ${modelUrl}`);
  if (!configRes.ok) throw new Error(`Failed to load config: ${configRes.status} ${configUrl}`);

  const [modelBuffer, voiceConfig] = await Promise.all([
    modelRes.arrayBuffer(),
    configRes.json() as Promise<PiperVoiceConfig>,
  ]);

  const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
    executionProviders: ["wasm"],
  });

  const sampleRate = voiceConfig.audio?.sample_rate ?? 22050;
  const noiseScale = voiceConfig.inference?.noise_scale ?? 0.667;
  const lengthScaleDefault = voiceConfig.inference?.length_scale ?? 1.0;
  const noiseW = voiceConfig.inference?.noise_w ?? 0.8;

  const espeakVoice = voiceConfig.espeak?.voice ?? "vi";

  /** Resolve phoneme_id_map entry to a single number (supports both number and number[]). */
  function toId(value: number | number[] | undefined): number {
    if (value === undefined) return 0;
    return Array.isArray(value) ? value[0] ?? 0 : value;
  }

  /** Run Piper WASM phonemizer (loaded from CDN); returns phoneme_ids or null if unavailable. */
  async function runPiperPhonemize(text: string): Promise<number[] | null> {
    if (!piperPhonemizePaths) return null;
    const timeoutMs = 15000;
    try {
      const phonemizeChunkUrl =
        "https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.4/dist/piper-o91UDS6e.js";
      const mod = await import(/* webpackIgnore: true */ phonemizeChunkUrl);
      const createPiperPhonemize = typeof mod.default === "function" ? mod.default : (mod as { createPiperPhonemize?: (opts: unknown) => Promise<unknown> }).createPiperPhonemize;
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
          if (url.endsWith(".wasm")) return piperPhonemizePaths.piperWasm;
          if (url.endsWith(".data")) return piperPhonemizePaths.piperData;
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

  async function getPhonemeIds(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) return [];

    if (voiceConfig.phoneme_type === "text") {
      const normalized = trimmed.normalize("NFD");
      return phonemesToIds([Array.from(normalized)]);
    }

    if (voiceConfig.phoneme_type === "espeak") {
      const preprocessed = normalizeVietnamese(trimmed);
      const wasmIds = await runPiperPhonemize(preprocessed);
      if (wasmIds && wasmIds.length > 0) return wasmIds;
      const normalized = preprocessed.normalize("NFD").toLowerCase();
      return phonemesToIds([Array.from(normalized)]);
    }

    const normalized = trimmed.normalize("NFD");
    return phonemesToIds([Array.from(normalized)]);
  }

  function phonemesToIds(textPhonemes: string[][]): number[] {
    const idMap = voiceConfig.phoneme_id_map;
    if (!idMap) throw new Error("phoneme_id_map not found in config");
    const BOS = "^";
    const EOS = "$";
    const PAD = "_";
    const ids: number[] = [];
    for (const sentence of textPhonemes) {
      ids.push(toId(idMap[BOS]));
      ids.push(toId(idMap[PAD]));
      for (const p of sentence) {
        if (p in idMap) {
          ids.push(toId(idMap[p]));
          ids.push(toId(idMap[PAD]));
        }
      }
      ids.push(toId(idMap[EOS]));
    }
    return ids;
  }

  async function predict(
    text: string,
    options?: { speakerId?: number; lengthScale?: number }
  ): Promise<Float32Array> {
    const trimmed = text.trim();
    if (!trimmed) return new Float32Array(0);

    const lengthScale = 1 / (options?.lengthScale ?? lengthScaleDefault);
    const speakerId = options?.speakerId ?? 0;

    const phonemeIds = await getPhonemeIds(trimmed);

    const Tensor = ort.Tensor;
    const inputs: Record<string, InstanceType<typeof Tensor>> = {
      input: new Tensor(
        "int64",
        new BigInt64Array(phonemeIds.map((id) => BigInt(id))),
        [1, phonemeIds.length]
      ),
      input_lengths: new Tensor("int64", BigInt64Array.from([BigInt(phonemeIds.length)]), [1]),
      scales: new Tensor(
        "float32",
        Float32Array.from([noiseScale, lengthScale, noiseW]),
        [3]
      ),
    };

    if (voiceConfig.num_speakers && voiceConfig.num_speakers > 1 && voiceConfig.speaker_id_map) {
      const sid = voiceConfig.speaker_id_map[speakerId] ?? 0;
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
