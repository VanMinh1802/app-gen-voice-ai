import {
  TtsSession,
  type InferenceConfig,
  type VoiceId,
} from "@mintplex-labs/piper-tts-web";

export interface PiperTtsOptions {
  voiceId: string;
  speakerId?: number;
  speed?: number;
}

let ttsSession: TtsSession | null = null;

export async function initTtsSession(voiceId: string): Promise<TtsSession> {
  if (ttsSession && ttsSession.voiceId === voiceId && ttsSession.ready) {
    return ttsSession;
  }

  if (ttsSession) {
    await ttsSession.ready;
  }

  ttsSession = await TtsSession.create({ voiceId: voiceId as VoiceId });
  await ttsSession.init();
  return ttsSession;
}

export async function synthesize(
  text: string,
  options: PiperTtsOptions,
  onProgress?: (progress: number) => void,
): Promise<Float32Array> {
  const session = await initTtsSession(options.voiceId);

  const config: InferenceConfig = {
    text,
    voiceId: options.voiceId as VoiceId,
  };

  const audioBlob = await session.predict(text);

  if (onProgress) {
    onProgress(100);
  }

  return blobToFloat32Array(audioBlob);
}

export async function getAvailableVoices() {
  const { voices } = await import("@mintplex-labs/piper-tts-web");
  return voices();
}

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
    view.getUint8(3),
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
      view.getUint8(offset + 3),
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

export async function terminate() {
  if (ttsSession) {
    ttsSession = null;
  }
}
