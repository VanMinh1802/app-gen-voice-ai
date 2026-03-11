import { create } from "zustand";
import { persist } from "zustand/middleware";
import { config } from "@/config";
import type { TtsSettings, TtsStatus, TtsHistoryItem } from "./types";

interface TtsState {
  settings: TtsSettings;
  status: TtsStatus;
  progress: number;
  currentAudio: Blob | null;
  currentAudioUrl: string | null;
  history: TtsHistoryItem[];
  error: string | null;

  setSettings: (settings: Partial<TtsSettings>) => void;
  setStatus: (status: TtsStatus) => void;
  setProgress: (progress: number) => void;
  setCurrentAudio: (audio: Blob | null, url: string | null) => void;
  addToHistory: (item: TtsHistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultSettings: TtsSettings = {
  model: config.tts.defaultModel as TtsSettings["model"],
  voice: config.tts.defaultVoice as TtsSettings["voice"],
  speed: config.tts.defaultSpeed,
  volume: config.tts.defaultVolume,
};

const initialState = {
  settings: defaultSettings,
  status: "idle" as TtsStatus,
  progress: 0,
  currentAudio: null,
  currentAudioUrl: null,
  history: [] as TtsHistoryItem[],
  error: null,
};

export const useTtsStore = create<TtsState>()(
  persist(
    (set) => ({
      ...initialState,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setStatus: (status) => set({ status, error: status === "idle" ? null : undefined }),

      setProgress: (progress) => set({ progress }),

      setCurrentAudio: (audio, url) =>
        set({
          currentAudio: audio,
          currentAudioUrl: url,
        }),

      addToHistory: (item) =>
        set((state) => {
          const newHistory = [item, ...state.history].slice(
            0,
            config.tts.historyLimit
          );
          return { history: newHistory };
        }),

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      clearHistory: () => set({ history: [] }),

      setError: (error) => set({ error, status: "error" }),

      reset: () =>
        set({
          status: "idle",
          progress: 0,
          currentAudio: null,
          currentAudioUrl: null,
          error: null,
        }),
    }),
    {
      name: config.storage.settingsKey,
      partialize: (state) => ({ settings: state.settings, history: state.history }),
    }
  )
);
