import type { VoiceId } from "@/config";

export interface TtsRequest {
  text: string;
  model: string;
  voice?: string;
  speed?: number;
  /** Pitch in semitones (-12 to +12). Applied as post-processing. */
  pitch?: number;
}

export interface TtsResponse {
  audio: Blob;
  duration: number;
  format: "wav";
}

export interface TtsVoice {
  id: string;
  name: string;
  language: string;
  gender: "male" | "female";
}

export interface TtsModel {
  name: string;
  size: number;
  voices: TtsVoice[];
}

export interface TtsSettings {
  model: VoiceId;
  voice: VoiceId;
  speed: number;
  volume: number;
  pitch: number;
  normalizeText: boolean;
}

export type TtsStatus =
  | "idle"
  | "loading"
  | "generating"
  | "previewing"
  | "playing"
  | "error"
  | "streaming-ended";

/**
 * Separate playback state from TTS generation state.
 * Allows AudioPlayer to distinguish "TTS is generating" vs "audio is playing".
 */
export type PlaybackStatus = "idle" | "playing" | "paused" | "buffering";

export interface TtsHistoryItem {
  id: string;
  text: string;
  model: string;
  voice: string;
  speed: number;
  audioUrl: string;
  duration: number;
  createdAt: number;
}

export interface TtsWorkerMessage {
  type: "generate" | "loadModel" | "terminate" | "setR2PublicUrl";
  payload?: TtsRequest | string;
}

export interface TtsWorkerProgress {
  type: "progress";
  progress: number;
}

export interface TtsWorkerChunk {
  type: "chunk";
  audio: ArrayBuffer;
  index: number;
  isStreaming: boolean;
}

export interface TtsWorkerComplete {
  type: "complete";
  audio: ArrayBuffer;
  duration: number;
  wasStreaming?: boolean;
}

export interface TtsWorkerError {
  type: "error";
  error: string;
}

export interface TtsWorkerReady {
  type: "workerReady";
}

export type TtsWorkerOutgoingMessage =
  | TtsWorkerProgress
  | TtsWorkerChunk
  | TtsWorkerComplete
  | TtsWorkerError
  | TtsWorkerReady;
