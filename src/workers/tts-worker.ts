import { TtsSession, type VoiceId } from "@mintplex-labs/piper-tts-web";
import type {
  TtsWorkerMessage,
  TtsWorkerOutgoingMessage,
  TtsRequest,
} from "@/features/tts/types";
import { CUSTOM_MODEL_PREFIX, config } from "@/config";
import type { PiperCustomSession } from "@/lib/piper/piperCustom";
import { loadCustomPiper } from "@/lib/piper/piperCustom";

/** Prefer same-origin /onnx/ so .mjs is served with correct MIME (avoids blob fetch issues in worker). */
const ONNX_WASM_BASE =
  typeof location !== "undefined"
    ? `${location.origin}/onnx/`
    : "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/";
const PIPER_WASM_BASE = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";

const WASM_PATHS = {
  onnxWasm: ONNX_WASM_BASE,
  piperData: `${PIPER_WASM_BASE}.data`,
  piperWasm: `${PIPER_WASM_BASE}.wasm`,
};

let ttsSession: TtsSession | null = null;
let customSession: PiperCustomSession | null = null;
let customSessionVoiceId: string | null = null;

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
  const baseUrl =
    typeof location !== "undefined"
      ? `${location.origin}${config.tts.customModelBaseUrl}`
      : config.tts.customModelBaseUrl;
  const piperPhonemizePaths = {
    piperWasm: WASM_PATHS.piperWasm,
    piperData: WASM_PATHS.piperData,
  };
  customSession = await loadCustomPiper(baseUrl, modelName, ONNX_WASM_BASE, piperPhonemizePaths);
  customSessionVoiceId = voiceId;
  return customSession;
}

function sendProgress(progress: number) {
  const message: TtsWorkerOutgoingMessage = { type: "progress", progress };
  self.postMessage(message);
}

function sendComplete(audio: Float32Array, sampleRate: number = 24000) {
  const wavBuffer = float32ToWav(audio, sampleRate);
  const duration = audio.length / sampleRate;

  const message: TtsWorkerOutgoingMessage = {
    type: "complete",
    audio: wavBuffer,
    duration,
  };
  self.postMessage(message, { transfer: [wavBuffer] });
}

function sendError(error: string) {
  const message: TtsWorkerOutgoingMessage = { type: "error", error };
  self.postMessage(message);
}

function float32ToWav(float32Array: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = float32Array.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  const dataView = new DataView(buffer, 44);
  for (let i = 0; i < int16Array.length; i++) {
    dataView.setInt16(i * 2, int16Array[i], true);
  }

  return buffer;
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

        const { text, voice, speed = 1.0 } = payload as TtsRequest;
        const effectiveVoice = voice || "vi_VN-vais1000-medium";

        if (!text) {
          sendError("No text provided");
          return;
        }

        sendProgress(10);

        if (isCustomVoice(effectiveVoice)) {
          const custom = await initCustomSession(effectiveVoice);
          sendProgress(40);
          const lengthScale = 1 / speed;
          const float32Audio = await custom.predict(text, { lengthScale });
          sendProgress(95);
          sendComplete(float32Audio, custom.sampleRate);
        } else {
          const session = await initSession(effectiveVoice);
          sendProgress(40);
          const audioBlob = await session.predict(text);
          sendProgress(95);
          const float32Audio = await blobToFloat32Array(audioBlob);
          sendComplete(float32Audio, 24000);
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

      case "terminate": {
        ttsSession = null;
        customSession = null;
        customSessionVoiceId = null;
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

async function blobToFloat32Array(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return wavToFloat32(arrayBuffer);
}

function wavToFloat32(wavBuffer: ArrayBuffer): Float32Array {
  const view = new DataView(wavBuffer);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (riff !== "RIFF") {
    throw new Error("Invalid WAV file: missing RIFF header");
  }

  let offset = 12;
  let dataOffset = 0;
  let dataSize = 0;
  let sampleRate = 24000;
  let numChannels = 1;

  while (offset < wavBuffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "fmt ") {
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (dataOffset === 0) {
    throw new Error("Invalid WAV file: no data chunk found");
  }

  const bytesPerSample = 2;
  const numSamples = Math.floor(dataSize / (numChannels * bytesPerSample));
  const float32Array = new Float32Array(numSamples);

  const dataView = new DataView(wavBuffer, dataOffset, dataSize);

  for (let i = 0; i < numSamples; i++) {
    const sample = dataView.getInt16(i * 2, true);
    float32Array[i] = sample / 32768;
  }

  if (numChannels > 1) {
    const mono = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        sum += float32Array[i * numChannels + ch];
      }
      mono[i] = sum / numChannels;
    }
    return mono;
  }

  return float32Array;
}

// Báo cho main thread biết worker đã sẵn sàng nhận lệnh (script đã chạy xong)
self.postMessage({ type: "workerReady" } as TtsWorkerOutgoingMessage);

export {};
