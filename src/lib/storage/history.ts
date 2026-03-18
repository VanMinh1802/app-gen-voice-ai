import type { TtsHistoryItem } from "@/features/tts/types";

const DB_NAME = "tts-audio-db";
/** Must never decrease: browser rejects open() if version < stored version (e.g. was 3 after presets branch). */
const DB_VERSION = 4;
const STORE_NAME = "audio-history";

/** Record stored in IndexedDB: metadata + audio Blob (blob URLs are not persisted). */
export interface StoredHistoryRecord
  extends Omit<TtsHistoryItem, "audioUrl"> {
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

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

/**
 * Saves a history item with its audio Blob to IndexedDB.
 * Blob URLs are not stored; only the Blob is persisted so playback works after reload.
 */
export async function saveHistoryItem(
  item: TtsHistoryItem,
  audioBlob: Blob
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
 * Only records that have an `audio` Blob are returned (legacy records without audio are skipped).
 */
export async function getHistory(limit?: number): Promise<TtsHistoryItem[]> {
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

export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}
