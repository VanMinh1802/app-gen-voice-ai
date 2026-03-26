/**
 * Shared IndexedDB availability check.
 * Used by both history and modelCache storage modules.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}
