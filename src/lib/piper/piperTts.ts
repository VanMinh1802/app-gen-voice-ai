import {
  TtsSession,
  type InferenceConfig,
  type VoiceId,
} from "@mintplex-labs/piper-tts-web";
import { decodeWav } from "@/lib/audio/wav";

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

  const { float32 } = decodeWav(await audioBlob.arrayBuffer());
  return float32;
}

export async function getAvailableVoices() {
  const { voices } = await import("@mintplex-labs/piper-tts-web");
  return voices();
}

export async function terminate() {
  if (ttsSession) {
    ttsSession = null;
  }
}
