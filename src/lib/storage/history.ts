import type { TtsHistoryItem } from "@/features/tts/types";

const DB_NAME = "tts-audio-db";
/** Must never decrease: browser rejects open() if version < stored version */
const DB_VERSION = 6;
const STORE_NAME = "audio-history";

/** Record stored in IndexedDB: metadata + audio Blob + userId (blob URLs are not persisted). */
export interface StoredHistoryRecord extends Omit<TtsHistoryItem, "audioUrl"> {
  /** userId is optional to support legacy records from before migration */
  userId?: string;
  audio: Blob;
}

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      /** Upgrade transaction — MUST NOT call database.transaction() during onupgradeneeded */
      const upgradeTx = (event.target as IDBOpenDBRequest).transaction;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
        objectStore.createIndex("userId", "userId", { unique: false });
      } else {
        // Migration: add userId index if it doesn't exist (use upgrade transaction only)
        if (upgradeTx) {
          const objectStore = upgradeTx.objectStore(STORE_NAME);
          if (!objectStore.indexNames.contains("userId")) {
            objectStore.createIndex("userId", "userId", { unique: false });
          }
        }
      }
    };
  });
}

/**
 * Saves a history item with its audio Blob to IndexedDB.
 * Blob URLs are not stored; only the Blob is persisted so playback works after reload.
 * Requires userId to isolate history per user.
 */
export async function saveHistoryItem(
  item: TtsHistoryItem,
  audioBlob: Blob,
  userId: string,
): Promise<void> {
  const database = await openDB();
  const record: StoredHistoryRecord = {
    id: item.id,
    text: item.text,
    model: item.model,
    voice: item.voice,
    speed: item.speed,
    duration: item.duration,
    createdAt: item.createdAt,
    userId,
    audio: audioBlob,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Loads history from IndexedDB and returns items with fresh blob URLs.
 * Only records that have an `audio` Blob and matching userId are returned.
 */
export async function getHistory(
  limit?: number,
  userId?: string,
): Promise<TtsHistoryItem[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("createdAt");
    const request = index.openCursor(null, "prev");

    const items: TtsHistoryItem[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      const record = cursor?.value as StoredHistoryRecord | undefined;

      if (cursor && record) {
        // Filter by userId if provided (for multi-user support)
        if (userId && record.userId !== userId) {
          if (!limit || items.length < limit) {
            cursor.continue();
          } else {
            resolve(items);
          }
          return;
        }

        if (record.audio instanceof Blob) {
          const audioUrl = URL.createObjectURL(record.audio);
          items.push({
            id: record.id,
            text: record.text,
            model: record.model,
            voice: record.voice,
            speed: record.speed,
            duration: record.duration,
            createdAt: record.createdAt,
            audioUrl,
          });
        }
        if (!limit || items.length < limit) {
          cursor.continue();
        } else {
          resolve(items);
        }
      } else {
        resolve(items);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets storage usage information for a specific user.
 * Returns total size in bytes and item count.
 */
export async function getStorageUsage(
  userId: string | null,
): Promise<{ totalBytes: number; itemCount: number }> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    let totalBytes = 0;
    let itemCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      const record = cursor?.value as StoredHistoryRecord | undefined;

      if (cursor && record) {
        // Handle records without userId (legacy data from before migration)
        const recordUserId = record.userId || "anonymous";

        // If userId is null (not logged in), count all anonymous/legacy records
        // If userId is provided, only count matching records OR records without userId (legacy)
        const shouldCount =
          userId === null
            ? recordUserId === "anonymous" || !record.userId // Count anonymous/legacy when not logged in
            : recordUserId === userId || !record.userId; // Count matching userId OR legacy (no userId) when logged in

        if (shouldCount) {
          itemCount++;
          // Estimate audio blob size
          if (record.audio instanceof Blob) {
            totalBytes += record.audio.size;
          } else {
            // Fallback: estimate ~10KB per minute of audio (WAV format)
            const estimatedBytesPerSecond = 16000; // ~16KB/s for 16kHz WAV
            totalBytes += (record.duration || 0) * estimatedBytesPerSecond;
          }
          // Estimate text size (UTF-16 char = 2 bytes)
          totalBytes += (record.text?.length || 0) * 2;
          // Estimate metadata overhead (~200 bytes per record)
          totalBytes += 200;
        }
        cursor.continue();
      } else {
        resolve({ totalBytes, itemCount });
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Gets storage usage across ALL users (for admin/debugging).
 */
export async function getTotalStorageUsage(): Promise<{
  totalBytes: number;
  itemCount: number;
  byUser: Record<string, { bytes: number; count: number }>;
}> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();

    let totalBytes = 0;
    let itemCount = 0;
    const byUser: Record<string, { bytes: number; count: number }> = {};

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      const record = cursor?.value as StoredHistoryRecord | undefined;

      if (cursor && record) {
        itemCount++;
        const recordBytes = record.audio.size + record.text.length * 2 + 200;
        totalBytes += recordBytes;

        const userId = record.userId || "anonymous";
        if (!byUser[userId]) {
          byUser[userId] = { bytes: 0, count: 0 };
        }
        byUser[userId].bytes += recordBytes;
        byUser[userId].count++;

        cursor.continue();
      } else {
        resolve({ totalBytes, itemCount, byUser });
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clears history for a specific user.
 * Does NOT affect other users' history.
 */
export async function clearUserHistory(userId: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("userId");
    const request = index.openCursor(IDBKeyRange.only(userId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Clears ALL history (for admin/debugging).
 */
export async function clearHistory(): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export { isIndexedDBAvailable } from "@/lib/storage/indexedDb";

/**
 * Estimates available storage quota using Navigator.storage.estimate()
 * Returns null if the API is not available.
 */
export async function getStorageQuota(): Promise<{
  used: number;
  available: number;
  usagePercent: number;
} | null> {
  if (typeof navigator !== "undefined" && "storage" in navigator) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = (estimate.quota || 0) - used;
      const usagePercent = estimate.quota ? (used / estimate.quota) * 100 : 0;
      return { used, available, usagePercent };
    } catch {
      return null;
    }
  }
  return null;
}
