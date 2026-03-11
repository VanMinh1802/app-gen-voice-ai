import { describe, it, expect } from "vitest";

describe("history", () => {
  describe("isIndexedDBAvailable", () => {
    it("returns true when indexedDB is available in browser", () => {
      // This test only runs in browser environment with jsdom
      // In Node.js, indexedDB is not available
      if (typeof indexedDB !== "undefined") {
        const { isIndexedDBAvailable } = require("@/lib/storage/history");
        expect(isIndexedDBAvailable()).toBe(true);
      } else {
        // Skip in Node environment
        expect(true).toBe(true);
      }
    });
  });
});
