import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { config } from "@/config";
import type {
  TtsSettings,
  TtsStatus,
  TtsHistoryItem,
  PlaybackStatus,
} from "./types";
import {
  saveHistoryItem,
  getHistory as getHistoryFromDB,
  deleteHistoryItem as deleteFromDB,
  clearHistory as clearFromDB,
  clearUserHistory,
  getStorageUsage,
  getStorageQuota,
  isIndexedDBAvailable,
} from "@/lib/storage/history";
import { revokeBlobUrl } from "@/lib/storage/blobUrl";
import { logger } from "@/lib/logger";

/** Session-only storage for inputText — survives tab-switching / navigation but clears on browser close */
function createSessionStorage() {
  return {
    getItem: (name: string): string | null => {
      if (typeof sessionStorage === "undefined") return null;
      return sessionStorage.getItem(name);
    },
    setItem: (name: string, value: string): void => {
      if (typeof sessionStorage === "undefined") return;
      sessionStorage.setItem(name, value);
    },
    removeItem: (name: string): void => {
      if (typeof sessionStorage === "undefined") return;
      sessionStorage.removeItem(name);
    },
  };
}

const HISTORY_STORAGE_KEY = "tts-history-migrated";
const LS_HISTORY_KEY = config.storage.historyKey;

/** Storage usage info for the user */
export interface StorageInfo {
  historyBytes: number;
  historyCount: number;
  totalUsedBytes: number;
  totalAvailableBytes: number;
  usagePercent: number;
}

/** Streaming-specific state to manage chunk playback separately from status */
export type StreamingState = "idle" | "buffering" | "playing";

interface TtsState {
  settings: TtsSettings;
  status: TtsStatus;
  /** Separate playback status from generation status — used by AudioPlayer to distinguish "generating" vs "playing" */
  playbackStatus: PlaybackStatus;
  progress: number;
  currentAudio: Blob | null;
  currentAudioUrl: string | null;
  nowPlaying: TtsHistoryItem | null;
  /** Preview item — isolated from main nowPlaying so preview doesn't disrupt main playback */
  previewItem: TtsHistoryItem | null;
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
  /** Input text persisted in sessionStorage — survives tab-switching / navigation but clears on browser close */
  inputText: string;
  /** ID of the last history item that was successfully saved to IndexedDB */
  lastSavedHistoryId: string | null;
  /** Current user ID for isolating history per user */
  currentUserId: string | null;
  /** Storage usage information */
  storageInfo: StorageInfo;

  setSettings: (settings: Partial<TtsSettings>) => void;
  setStatus: (status: TtsStatus) => void;
  setPlaybackStatus: (status: PlaybackStatus) => void;
  setProgress: (progress: number) => void;
  setCurrentAudio: (audio: Blob | null, url: string | null) => void;
  setNowPlaying: (item: TtsHistoryItem | null) => void;
  setPreviewItem: (item: TtsHistoryItem | null) => void;
  setStreamingState: (state: StreamingState) => void;
  setStreamingProgress: (currentTime: number, duration: number) => void;
  pauseStreaming: () => void;
  resumeStreaming: () => void;
  setPausedStreaming: (paused: boolean) => void;
  setInputText: (text: string) => void;
  clearInputText: () => void;
  setCurrentUserId: (userId: string | null) => void;
  addToHistory: (item: TtsHistoryItem, audioBlob: Blob) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  loadStorageInfo: () => Promise<void>;
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

/**
 * Blob URLs stored on history items must stay valid until the row is removed.
 * Never revoke a URL that still appears in `history[].audioUrl` — e.g. switching
 * the footer player from track A to B would otherwise invalidate A's URL while
 * the list still shows A (GET blob:… → net::ERR_FILE_NOT_FOUND).
 */
function isBlobUrlRetainedByHistory(
  url: string | null | undefined,
  history: TtsHistoryItem[],
): boolean {
  if (!url) return false;
  return history.some((h) => h.audioUrl === url);
}

const initialStorageInfo: StorageInfo = {
  historyBytes: 0,
  historyCount: 0,
  totalUsedBytes: 0,
  totalAvailableBytes: 0,
  usagePercent: 0,
};

const initialState = {
  settings: defaultSettings,
  status: "idle" as TtsStatus,
  playbackStatus: "idle" as PlaybackStatus,
  progress: 0,
  currentAudio: null,
  currentAudioUrl: null,
  nowPlaying: null as TtsHistoryItem | null,
  previewItem: null as TtsHistoryItem | null,
  history: [] as TtsHistoryItem[],
  error: null,
  isHistoryLoaded: false,
  streamingState: "idle" as StreamingState,
  streamingCurrentTime: 0,
  streamingDuration: 0,
  pausedStreaming: false,
  inputText: "",
  lastSavedHistoryId: null as string | null,
  currentUserId: null as string | null,
  storageInfo: initialStorageInfo,
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
      logger.debug(
        "Cleared legacy localStorage history (audio blobs were not stored; only new generations will appear in history).",
      );
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

      setStatus: (status) =>
        set({ status, error: status === "idle" ? null : undefined }),

      setPlaybackStatus: (playbackStatus) => set({ playbackStatus }),

      setProgress: (progress) => set({ progress }),

      setCurrentAudio: (audio, url) => {
        const state = get();
        const oldUrl = state.currentAudioUrl;
        if (
          oldUrl &&
          oldUrl !== url &&
          !isBlobUrlRetainedByHistory(oldUrl, state.history)
        ) {
          revokeBlobUrl(oldUrl);
        }

        set({
          currentAudio: audio,
          currentAudioUrl: url,
        });
      },

      setNowPlaying: (item) => set({ nowPlaying: item }),

      setPreviewItem: (item) => set({ previewItem: item }),

      setStreamingState: (state) => set({ streamingState: state }),

      setStreamingProgress: (currentTime, duration) =>
        set({ streamingCurrentTime: currentTime, streamingDuration: duration }),

      pauseStreaming: () => set({ pausedStreaming: true }),
      resumeStreaming: () => set({ pausedStreaming: false }),
      setPausedStreaming: (paused) => set({ pausedStreaming: paused }),
      setInputText: (text: string) => set({ inputText: text }),
      clearInputText: () => set({ inputText: "" }),

      setCurrentUserId: (userId) => set({ currentUserId: userId }),

      addToHistory: async (item, audioBlob) => {
        const state = get();
        const newHistory = [item, ...state.history].slice(
          0,
          config.tts.historyLimit,
        );
        set({ history: newHistory });

        const userId = state.currentUserId;

        if (isIndexedDBAvailable()) {
          try {
            // If user is logged in, save with userId; otherwise save without userId
            await saveHistoryItem(item, audioBlob, userId || "anonymous");
            // Mark this item as saved only after IndexedDB save completes
            set({ lastSavedHistoryId: item.id });
            // Refresh storage info after save
            get().loadStorageInfo();
          } catch (e) {
            logger.error("Failed to save history to IndexedDB:", e);
            // Even if save fails, mark as saved to avoid infinite "Đang lưu..." state
            set({ lastSavedHistoryId: item.id });
          }
        } else {
          // If IndexedDB is not available, mark as saved immediately (in-memory only)
          set({ lastSavedHistoryId: item.id });
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
            // Refresh storage info after delete
            get().loadStorageInfo();
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

        set({
          history: [],
          nowPlaying: null,
          currentAudio: null,
          currentAudioUrl: null,
        });

        if (isIndexedDBAvailable()) {
          try {
            if (state.currentUserId) {
              // Only clear current user's history
              await clearUserHistory(state.currentUserId);
            } else {
              // Clear all if no user (legacy data)
              await clearFromDB();
            }
            // Reset storage info
            set({ storageInfo: initialStorageInfo });
          } catch (e) {
            logger.error("Failed to clear history in IndexedDB:", e);
          }
        }
      },

      loadStorageInfo: async () => {
        const state = get();
        const userId = state.currentUserId;

        if (!isIndexedDBAvailable()) {
          return;
        }

        try {
          // Get user-specific storage usage (pass null to count all if no user)
          const usage = await getStorageUsage(userId);
          // Get browser storage quota (for reference only)
          const quota = await getStorageQuota();

          // Calculate history usage percent based on history limit, not browser quota
          const historyUsagePercent =
            config.tts.historyLimit > 0
              ? (state.history.length / config.tts.historyLimit) * 100
              : 0;

          set({
            storageInfo: {
              historyBytes: usage.totalBytes,
              historyCount: state.history.length, // Use actual history length from store
              totalUsedBytes: quota?.used || 0,
              totalAvailableBytes: quota?.available || 0,
              usagePercent: historyUsagePercent, // Use history-based percentage, not browser quota
            },
          });
        } catch (e) {
          logger.error("Failed to load storage info:", e);
        }
      },

      setError: (error) => set({ error, status: "error" }),

      reset: () => {
        const state = get();
        const { currentAudioUrl, nowPlaying, history } = state;
        if (
          currentAudioUrl &&
          !isBlobUrlRetainedByHistory(currentAudioUrl, history)
        ) {
          revokeBlobUrl(currentAudioUrl);
        }
        const npUrl = nowPlaying?.audioUrl;
        if (npUrl && !isBlobUrlRetainedByHistory(npUrl, history)) {
          revokeBlobUrl(npUrl);
        }

        set({
          status: "idle",
          playbackStatus: "idle",
          progress: 0,
          currentAudio: null,
          currentAudioUrl: null,
          nowPlaying: null,
          previewItem: null,
          error: null,
          streamingState: "idle",
          streamingCurrentTime: 0,
          streamingDuration: 0,
          pausedStreaming: false,
          lastSavedHistoryId: null,
        });
      },

      loadHistory: async () => {
        const state = get();
        const userId = state.currentUserId;

        if (!isIndexedDBAvailable()) {
          set({ isHistoryLoaded: true });
          return;
        }

        try {
          // Load history for specific user if logged in, otherwise load all (legacy/anonymous)
          const dbItems = await getHistoryFromDB(
            config.tts.historyLimit,
            userId || undefined,
          );

          if (dbItems.length > 0) {
            set({ history: dbItems, isHistoryLoaded: true });
            // Load storage info after history
            get().loadStorageInfo();
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
      storage: createJSONStorage(() => createSessionStorage()),
      partialize: (state) => ({
        settings: state.settings,
        inputText: state.inputText,
      }),
    },
  ),
);
