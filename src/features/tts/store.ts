import { create } from "zustand";
import { persist } from "zustand/middleware";
import { config } from "@/config";
import type { TtsSettings, TtsStatus, TtsHistoryItem } from "./types";
import {
  saveHistoryItem,
  getHistory as getHistoryFromDB,
  deleteHistoryItem as deleteFromDB,
  clearHistory as clearFromDB,
  isIndexedDBAvailable,
} from "@/lib/storage/history";
import { revokeBlobUrl } from "@/lib/storage/blobUrl";
import { logger } from "@/lib/logger";

const HISTORY_STORAGE_KEY = "tts-history-migrated";
const LS_HISTORY_KEY = config.storage.historyKey;

/** Streaming-specific state to manage chunk playback separately from status */
export type StreamingState = "idle" | "buffering" | "playing";

interface TtsState {
  settings: TtsSettings;
  status: TtsStatus;
  progress: number;
  currentAudio: Blob | null;
  currentAudioUrl: string | null;
  nowPlaying: TtsHistoryItem | null;
  history: TtsHistoryItem[];
  error: string | null;
  isHistoryLoaded: boolean;
  /** Separate streaming state from generic status */
  streamingState: StreamingState;
  /** Gapless streaming: current playback time and total duration (from Web Audio) */
  streamingCurrentTime: number;
  streamingDuration: number;
  /** Whether gapless streaming playback is paused by the user (stop/resume audio without affecting generation) */
  pausedStreaming: boolean;

  setSettings: (settings: Partial<TtsSettings>) => void;
  setStatus: (status: TtsStatus) => void;
  setProgress: (progress: number) => void;
  setCurrentAudio: (audio: Blob | null, url: string | null) => void;
  setNowPlaying: (item: TtsHistoryItem | null) => void;
  setStreamingState: (state: StreamingState) => void;
  setStreamingProgress: (currentTime: number, duration: number) => void;
  pauseStreaming: () => void;
  resumeStreaming: () => void;
  setPausedStreaming: (paused: boolean) => void;
  addToHistory: (item: TtsHistoryItem, audioBlob: Blob) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
  loadHistory: () => Promise<void>;
}

const defaultSettings: TtsSettings = {
  model: config.tts.defaultModel as TtsSettings["model"],
  voice: config.tts.defaultVoice as TtsSettings["voice"],
  speed: config.tts.defaultSpeed,
  volume: config.tts.defaultVolume,
  pitch: 0,
  normalizeText: true,
};

const initialState = {
  settings: defaultSettings,
  status: "idle" as TtsStatus,
  progress: 0,
  currentAudio: null,
  currentAudioUrl: null,
  nowPlaying: null as TtsHistoryItem | null,
  history: [] as TtsHistoryItem[],
  error: null,
  isHistoryLoaded: false,
  streamingState: "idle" as StreamingState,
  streamingCurrentTime: 0,
  streamingDuration: 0,
  pausedStreaming: false,
};

/** Clears legacy history from localStorage; old items had only blob URLs (no audio blob) so they are not saved to IDB. */
async function migrateLocalStorageHistory(): Promise<TtsHistoryItem[]> {
  const alreadyMigrated = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (alreadyMigrated) {
    return [];
  }

  try {
    const lsHistory = localStorage.getItem(LS_HISTORY_KEY);
    if (!lsHistory) {
      localStorage.setItem(HISTORY_STORAGE_KEY, "true");
      return [];
    }

    const items = JSON.parse(lsHistory) as TtsHistoryItem[];
    localStorage.removeItem(LS_HISTORY_KEY);
    localStorage.setItem(HISTORY_STORAGE_KEY, "true");
    if (items.length > 0) {
      logger.debug("Cleared legacy localStorage history (audio blobs were not stored; only new generations will appear in history).");
    }
    return [];
  } catch (e) {
    logger.error("Migration failed:", e);
    return [];
  }
}

export const useTtsStore = create<TtsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setStatus: (status) => set({ status, error: status === "idle" ? null : undefined }),

      setProgress: (progress) => set({ progress }),

      setCurrentAudio: (audio, url) => {
        const state = get();
        // Revoke old blob URL if exists
        revokeBlobUrl(state.currentAudioUrl);
        
        set({
          currentAudio: audio,
          currentAudioUrl: url,
        });
      },

      setNowPlaying: (item) => set({ nowPlaying: item }),

      setStreamingState: (state) => set({ streamingState: state }),

      setStreamingProgress: (currentTime, duration) =>
        set({ streamingCurrentTime: currentTime, streamingDuration: duration }),

      pauseStreaming: () => set({ pausedStreaming: true }),
      resumeStreaming: () => set({ pausedStreaming: false }),
      setPausedStreaming: (paused) => set({ pausedStreaming: paused }),

      addToHistory: async (item, audioBlob) => {
        const state = get();
        const newHistory = [item, ...state.history].slice(0, config.tts.historyLimit);
        set({ history: newHistory });

        if (isIndexedDBAvailable()) {
          try {
            await saveHistoryItem(item, audioBlob);
          } catch (e) {
            logger.error("Failed to save history to IndexedDB:", e);
          }
        }
      },

      removeFromHistory: async (id) => {
        const state = get();
        const itemToRemove = state.history.find((item) => item.id === id);
        
        // Revoke blob URL if it's not currently playing
        if (itemToRemove && itemToRemove.id !== state.nowPlaying?.id) {
          revokeBlobUrl(itemToRemove.audioUrl);
        }

        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
          nowPlaying: state.nowPlaying?.id === id ? null : state.nowPlaying,
        }));

        if (isIndexedDBAvailable()) {
          try {
            await deleteFromDB(id);
          } catch (e) {
            logger.error("Failed to delete history from IndexedDB:", e);
          }
        }
      },

      clearHistory: async () => {
        const state = get();
        // Revoke all blob URLs in history
        state.history.forEach((item) => revokeBlobUrl(item.audioUrl));
        revokeBlobUrl(state.currentAudioUrl);
        revokeBlobUrl(state.nowPlaying?.audioUrl);
        
        set({ history: [], nowPlaying: null, currentAudio: null, currentAudioUrl: null });

        if (isIndexedDBAvailable()) {
          try {
            await clearFromDB();
          } catch (e) {
            logger.error("Failed to clear history in IndexedDB:", e);
          }
        }
      },

      setError: (error) => set({ error, status: "error" }),

      reset: () => {
        const state = get();
        // Revoke blob URLs before resetting
        revokeBlobUrl(state.currentAudioUrl);
        revokeBlobUrl(state.nowPlaying?.audioUrl);

        set({
          status: "idle",
          progress: 0,
          currentAudio: null,
          currentAudioUrl: null,
          nowPlaying: null,
          error: null,
          streamingState: "idle",
          streamingCurrentTime: 0,
          streamingDuration: 0,
          pausedStreaming: false,
        });
      },

      loadHistory: async () => {
        if (!isIndexedDBAvailable()) {
          set({ isHistoryLoaded: true });
          return;
        }

        try {
          const dbItems = await getHistoryFromDB(config.tts.historyLimit);

          if (dbItems.length > 0) {
            set({ history: dbItems, isHistoryLoaded: true });
            return;
          }

          const migratedItems = await migrateLocalStorageHistory();
          if (migratedItems.length > 0) {
            set({ history: migratedItems, isHistoryLoaded: true });
          } else {
            set({ isHistoryLoaded: true });
          }
        } catch (e) {
          logger.error("Failed to load history:", e);
          set({ isHistoryLoaded: true });
        }
      },
    }),
    {
      name: config.storage.settingsKey,
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
