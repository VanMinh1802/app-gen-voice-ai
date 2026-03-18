import { describe, it, expect, beforeEach, vi } from "vitest";
import { createBlobUrl, revokeBlobUrl, revokeAllBlobUrls, isBlobUrl } from "@/lib/storage/blobUrl";

describe("blobUrl manager", () => {
  beforeEach(() => {
    revokeAllBlobUrls();
    vi.clearAllMocks();
  });

  describe("createBlobUrl", () => {
    it("creates a blob URL", () => {
      const blob = new Blob(["test"], { type: "audio/wav" });
      const url = createBlobUrl(blob);
      
      expect(url).toContain("blob:");
      expect(isBlobUrl(url)).toBe(true);
    });
  });

  describe("revokeBlobUrl", () => {
    it("revokes a blob URL", () => {
      const blob = new Blob(["test"], { type: "audio/wav" });
      const url = createBlobUrl(blob);
      
      revokeBlobUrl(url);
      
      expect(isBlobUrl(url)).toBe(false);
    });

    it("handles null URL gracefully", () => {
      expect(() => revokeBlobUrl(null)).not.toThrow();
    });

    it("handles undefined URL gracefully", () => {
      expect(() => revokeBlobUrl(undefined)).not.toThrow();
    });

    it("handles non-blob URL gracefully", () => {
      expect(() => revokeBlobUrl("https://example.com")).not.toThrow();
    });
  });

  describe("revokeAllBlobUrls", () => {
    it("revokes all tracked blob URLs", () => {
      const blob1 = new Blob(["test1"], { type: "audio/wav" });
      const blob2 = new Blob(["test2"], { type: "audio/wav" });
      
      const url1 = createBlobUrl(blob1);
      const url2 = createBlobUrl(blob2);
      
      revokeAllBlobUrls();
      
      expect(isBlobUrl(url1)).toBe(false);
      expect(isBlobUrl(url2)).toBe(false);
    });
  });

  describe("isBlobUrl", () => {
    it("returns true for tracked blob URL", () => {
      const blob = new Blob(["test"], { type: "audio/wav" });
      const url = createBlobUrl(blob);
      
      expect(isBlobUrl(url)).toBe(true);
    });

    it("returns false for non-tracked URL", () => {
      expect(isBlobUrl("blob:http://localhost/123")).toBe(false);
    });

    it("returns false for null/undefined", () => {
      expect(isBlobUrl(null)).toBe(false);
      expect(isBlobUrl(undefined)).toBe(false);
    });
  });
});
