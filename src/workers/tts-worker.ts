import { TtsSession, type VoiceId } from "@mintplex-labs/piper-tts-web";
import type {
  TtsWorkerMessage,
  TtsWorkerOutgoingMessage,
  TtsWorkerChunk,
  TtsRequest,
} from "@/features/tts/types";
import { CUSTOM_MODEL_PREFIX, config } from "@/config";
import { R2_PUBLIC_URL } from "@/lib/config/r2Config";
import type { PiperCustomSession } from "@/lib/piper/piperCustom";
import { loadPiperWithCache } from "@/lib/piper/piperR2";
import { pitchShift } from "@/lib/audio/pitchShift";
import { encodeWav, concatFloat32Arrays, decodeWav } from "@/lib/audio/wav";
import { STREAMING_THRESHOLD_CHARS } from "@/config";

/** Prefer same-origin /onnx/ so .mjs is served with correct MIME (avoids blob fetch issues in worker). */
const ONNX_WASM_BASE =
  typeof location !== "undefined"
    ? `${location.origin}/onnx/`
    : "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";
const PIPER_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";

const WASM_PATHS = {
  onnxWasm: ONNX_WASM_BASE,
  piperData: `${PIPER_WASM_BASE}.data`,
  piperWasm: `${PIPER_WASM_BASE}.wasm`,
};

let ttsSession: TtsSession | null = null;
let customSession: PiperCustomSession | null = null;
let customSessionVoiceId: string | null = null;
/** R2 public URL từ main thread (worker bundle có thể không có NEXT_PUBLIC_*) */
let r2PublicUrlFromMain: string = "";

/** Cancel flag for stopping mid-generation */
let isCancelled = false;

function isCustomVoice(voiceId: string): boolean {
  return voiceId.startsWith(CUSTOM_MODEL_PREFIX);
}

function getCustomModelName(voiceId: string): string {
  return voiceId.slice(CUSTOM_MODEL_PREFIX.length);
}

async function initSession(voiceId: string): Promise<TtsSession> {
  if (ttsSession && ttsSession.voiceId === voiceId && ttsSession.ready) {
    return ttsSession;
  }

  if (ttsSession) {
    await ttsSession.ready;
  }

  ttsSession = await TtsSession.create({
    voiceId: voiceId as VoiceId,
    wasmPaths: WASM_PATHS,
  });
  await ttsSession.init();
  return ttsSession;
}

async function initCustomSession(voiceId: string): Promise<PiperCustomSession> {
  if (customSession && customSessionVoiceId === voiceId) {
    return customSession;
  }
  const modelName = getCustomModelName(voiceId);

  const directUrl = R2_PUBLIC_URL || r2PublicUrlFromMain;
  const baseUrl = directUrl
    ? `${directUrl.replace(/\/$/, "")}/vi`
    : typeof location !== "undefined"
      ? `${location.origin}/api/models`
      : "/api/models";

  const { session, fromCache } = await loadPiperWithCache({
    voiceId: modelName,
    baseUrl,
    onProgress: (progress) => {
      const mappedProgress = 10 + (progress * 20) / 100;
      sendProgress(mappedProgress);
    },
  });

  customSession = session;
  customSessionVoiceId = voiceId;
  console.log(
    `[worker] Loaded custom model ${modelName} from ${fromCache ? "cache" : "R2"} (baseUrl: ${baseUrl})`,
  );
  return customSession;
}

function sendProgress(progress: number) {
  const message: TtsWorkerOutgoingMessage = { type: "progress", progress };
  self.postMessage(message);
}

function sendChunk(
  audio: Float32Array,
  index: number,
  sampleRate: number = 24000,
) {
  const wavBuffer = encodeWav(audio, sampleRate);
  const message: TtsWorkerChunk = {
    type: "chunk",
    audio: wavBuffer,
    index,
    isStreaming: true,
  };
  self.postMessage(message, { transfer: [wavBuffer] });
}

function shouldUseStreaming(textLength: number): boolean {
  return textLength >= STREAMING_THRESHOLD_CHARS;
}

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += config.streaming.charsPerChunk) {
    chunks.push(text.slice(i, i + config.streaming.charsPerChunk));
  }
  return chunks;
}

function sendComplete(
  audio: Float32Array,
  sampleRate: number = 24000,
  wasStreaming?: boolean,
) {
  const wavBuffer = encodeWav(audio, sampleRate);
  const duration = audio.length / sampleRate;

  const message: TtsWorkerOutgoingMessage = {
    type: "complete",
    audio: wavBuffer,
    duration,
    wasStreaming,
  };
  self.postMessage(message, { transfer: [wavBuffer] });
}

function sendError(error: string) {
  const message: TtsWorkerOutgoingMessage = { type: "error", error };
  self.postMessage(message);
}

async function blobToFloat32Array(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return decodeWav(arrayBuffer).float32;
}

self.onmessage = async (event: MessageEvent<TtsWorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case "generate": {
        if (!payload) {
          sendError("No payload provided for generate");
          return;
        }

        const { text, voice, speed = 1.0, pitch = 0 } = payload as TtsRequest;
        const effectiveVoice = voice || "vi_VN-vais1000-medium";

        if (!text) {
          sendError("No text provided");
          return;
        }

        sendProgress(10);
        isCancelled = false;

        const useStreaming = shouldUseStreaming(text.length);
        const chunks = splitIntoChunks(text);

        if (
          useStreaming &&
          chunks.length >= config.streaming.minChunksForStreaming
        ) {
          const allAudio: Float32Array[] = [];
          let sampleRate = 24000;

          if (isCustomVoice(effectiveVoice)) {
            const custom = await initCustomSession(effectiveVoice);
            sendProgress(20);
            sampleRate = custom.sampleRate;
            const lengthScale = 1 / speed;

            for (let i = 0; i < chunks.length; i++) {
              if (isCancelled) return;

              const chunkAudio = await custom.predict(chunks[i]!, {
                lengthScale,
              });
              allAudio.push(chunkAudio);

              if (!isCancelled) {
                sendChunk(chunkAudio, i, sampleRate);
                const progress =
                  20 + Math.round(((i + 1) / chunks.length) * 60);
                sendProgress(progress);
              }
            }
          } else {
            const session = await initSession(effectiveVoice);
            sendProgress(20);

            for (let i = 0; i < chunks.length; i++) {
              if (isCancelled) return;

              const audioBlob = await session.predict(chunks[i]!);
              const { float32: chunkAudio } = decodeWav(
                await audioBlob.arrayBuffer(),
              );
              allAudio.push(chunkAudio);

              if (!isCancelled) {
                sendChunk(chunkAudio, i, sampleRate);
                const progress =
                  20 + Math.round(((i + 1) / chunks.length) * 60);
                sendProgress(progress);
              }
            }
          }

          if (isCancelled) return;

          if (pitch !== 0 && Number.isFinite(pitch)) {
            const clampedPitch = Math.max(-12, Math.min(12, pitch));
            for (let i = 0; i < allAudio.length; i++) {
              allAudio[i] = pitchShift(allAudio[i]!, clampedPitch);
            }
          }

          const fullAudio = concatFloat32Arrays(allAudio);
          sendProgress(95);
          sendComplete(fullAudio, sampleRate, true);
        } else {
          let float32Audio: Float32Array;
          let sampleRate: number;

          if (isCustomVoice(effectiveVoice)) {
            const custom = await initCustomSession(effectiveVoice);
            sendProgress(40);
            const lengthScale = 1 / speed;
            float32Audio = await custom.predict(text, {
              lengthScale,
              onProgress: (predictProgress) => {
                const mappedProgress =
                  40 + Math.round((predictProgress * 50) / 100);
                sendProgress(mappedProgress);
              },
            });
            sampleRate = custom.sampleRate;
          } else {
            const session = await initSession(effectiveVoice);
            sendProgress(40);
            const audioBlob = await session.predict(text);
            const result = decodeWav(await audioBlob.arrayBuffer());
            float32Audio = result.float32;
            sampleRate = result.sampleRate;
          }

          if (pitch !== 0 && Number.isFinite(pitch)) {
            const clampedPitch = Math.max(-12, Math.min(12, pitch));
            float32Audio = pitchShift(float32Audio, clampedPitch);
          }

          sendProgress(95);
          sendComplete(float32Audio, sampleRate, false);
        }

        break;
      }

      case "loadModel": {
        if (!payload) {
          sendError("No payload provided for loadModel");
          return;
        }

        const { voice } = payload as TtsRequest;
        const effectiveVoice = voice || "vi_VN-vais1000-medium";

        sendProgress(10);

        if (isCustomVoice(effectiveVoice)) {
          await initCustomSession(effectiveVoice);
        } else {
          await initSession(effectiveVoice);
        }

        sendProgress(100);

        const message: TtsWorkerOutgoingMessage = {
          type: "complete",
          audio: new ArrayBuffer(0),
          duration: 0,
        };
        self.postMessage(message);

        break;
      }

      case "setR2PublicUrl": {
        if (typeof payload === "string" && payload.startsWith("http")) {
          r2PublicUrlFromMain = payload;
        }
        break;
      }

      case "terminate": {
        ttsSession = null;
        customSession = null;
        customSessionVoiceId = null;
        isCancelled = true;
        break;
      }

      default:
        sendError(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Worker error:", errorMessage);
    sendError(errorMessage);
  }
};

// Báo cho main thread biết worker đã sẵn sàng nhận lệnh (script đã chạy xong)
self.postMessage({ type: "workerReady" } as TtsWorkerOutgoingMessage);

export {};
