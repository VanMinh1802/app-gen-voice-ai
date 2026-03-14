/**
 * Model cache for TTS ONNX models stored in IndexedDB.
 * Models are downloaded from R2 and cached locally for offline reuse.
 */

import type { PiperVoiceConfig } from "@/lib/piper/piperCustom";

const DB_NAME = "tts-model-cache";
const DB_VERSION = 1;
const STORE_NAME = "models";

export interface CachedModel {
  voiceId: string;
  model: ArrayBuffer;
  config: PiperVoiceConfig;
  downloadedAt: number;
  size: number;
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
          keyPath: "voiceId",
        });
        objectStore.createIndex("downloadedAt", "downloadedAt", { unique: false });
      }
    };
  });
}

/**
 * Save model and config to IndexedDB cache.
 */
export async function saveModelToCache(
  voiceId: string,
  modelData: ArrayBuffer,
  config: PiperVoiceConfig
): Promise<void> {
  const database = await openDB();
  const record: CachedModel = {
    voiceId,
    model: modelData,
    config,
    downloadedAt: Date.now(),
    size: modelData.byteLength,
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
 * Load model and config from IndexedDB cache.
 * Returns null if not cached.
 */
export async function loadModelFromCache(
  voiceId: string
): Promise<{ model: ArrayBuffer; config: PiperVoiceConfig } | null> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(voiceId);

    request.onsuccess = () => {
      const record = request.result as CachedModel | undefined;
      if (record) {
        resolve({ model: record.model, config: record.config });
      } else {
        resolve(null);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get list of cached voice IDs.
 */
export async function getCachedModels(): Promise<string[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if a model is cached.
 */
export async function isModelCached(voiceId: string): Promise<boolean> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getKey(voiceId);

    request.onsuccess = () => {
      resolve(!!request.result);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a specific model from cache.
 */
export async function deleteModelFromCache(voiceId: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(voiceId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cached models.
 */
export async function clearModelCache(): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get total cache size in bytes.
 */
export async function getCacheSize(): Promise<number> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result as CachedModel[];
      const totalSize = records.reduce((sum, r) => sum + r.size, 0);
      resolve(totalSize);
    };

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
