import { describe, it, expect } from "vitest";
import { config, STREAMING_THRESHOLD_CHARS } from "@/config";

describe("streaming config", () => {
  describe("threshold calculation", () => {
    it("calculates correct threshold from config", () => {
      const expected =
        config.streaming.minChunksForStreaming * config.streaming.charsPerChunk;
      expect(STREAMING_THRESHOLD_CHARS).toBe(expected);
    });

    it("threshold is 1000 chars (2 chunks * 500 chars)", () => {
      expect(STREAMING_THRESHOLD_CHARS).toBe(1000);
    });
  });

  describe("config values", () => {
    it("has minChunksForStreaming of 2", () => {
      expect(config.streaming.minChunksForStreaming).toBe(2);
    });

    it("has charsPerChunk of 500", () => {
      expect(config.streaming.charsPerChunk).toBe(500);
    });

    it("has bufferChunks of 2", () => {
      expect(config.streaming.bufferChunks).toBe(2);
    });
  });
});

describe("shouldStream utility", () => {
  // Threshold is based on total text length, not chunk count
  // Text >= STREAMING_THRESHOLD_CHARS (1000) should stream
  const shouldStream = (textLength: number): boolean => {
    return textLength >= STREAMING_THRESHOLD_CHARS;
  };

  it("returns false for text shorter than threshold (500 chars)", () => {
    expect(shouldStream(500)).toBe(false);
  });

  it("returns false for text at 999 chars", () => {
    expect(shouldStream(999)).toBe(false);
  });

  it("returns true for text at 1000 chars (threshold)", () => {
    expect(shouldStream(1000)).toBe(true);
  });

  it("returns true for text longer than threshold (1500 chars)", () => {
    expect(shouldStream(1500)).toBe(true);
  });

  it("returns true for long text (5000 chars)", () => {
    expect(shouldStream(5000)).toBe(true);
  });

  it("returns false for very short text (1 char)", () => {
    expect(shouldStream(1)).toBe(false);
  });
});

describe("chunk splitting utility", () => {
  // Extract the logic from worker for testing
  const splitIntoChunks = (
    text: string,
    chunkSize: number = config.streaming.charsPerChunk,
  ): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  };

  it("returns single chunk for text <= 500 chars", () => {
    const chunks = splitIntoChunks("a".repeat(500));
    expect(chunks.length).toBe(1);
  });

  it("returns 2 chunks for 501-1000 chars", () => {
    const chunks = splitIntoChunks("a".repeat(501));
    expect(chunks.length).toBe(2);
  });

  it("returns 2 chunks for exactly 1000 chars", () => {
    const chunks = splitIntoChunks("a".repeat(1000));
    expect(chunks.length).toBe(2);
  });

  it("returns 3 chunks for 1001 chars", () => {
    const chunks = splitIntoChunks("a".repeat(1001));
    expect(chunks.length).toBe(3);
  });

  it("returns correct chunks with correct content", () => {
    const text = "abcde";
    const chunks = splitIntoChunks(text, 2);
    expect(chunks).toEqual(["ab", "cd", "e"]);
  });
});
