import type { VoiceId } from "@/config";

export interface TtsRequest {
  text: string;
  model: string;
  voice?: string;
  speed?: number;
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
  normalizeText: boolean;
}

export type TtsStatus = "idle" | "loading" | "generating" | "playing" | "error";

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
  type: "generate" | "loadModel" | "terminate";
  payload?: TtsRequest;
}

export interface TtsWorkerProgress {
  type: "progress";
  progress: number;
}

export interface TtsWorkerComplete {
  type: "complete";
  audio: ArrayBuffer;
  duration: number;
}

export interface TtsWorkerError {
  type: "error";
  error: string;
}

export type TtsWorkerOutgoingMessage =
  | TtsWorkerProgress
  | TtsWorkerComplete
  | TtsWorkerError;
