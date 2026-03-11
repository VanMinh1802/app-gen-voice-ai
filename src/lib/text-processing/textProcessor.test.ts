import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isTextValid,
  sanitizeText,
  countWords,
  estimateDuration,
} from "@/lib/text-processing/textProcessor";

describe("textProcessor", () => {
  describe("isTextValid", () => {
    it("returns invalid for empty string", () => {
      const result = isTextValid("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Text cannot be empty");
    });

    it("returns invalid for whitespace-only string", () => {
      const result = isTextValid("   ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Text cannot be empty");
    });

    it("returns invalid for text exceeding max length", () => {
      const longText = "a".repeat(5001);
      const result = isTextValid(longText);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Text exceeds maximum length of 5000 characters",
      );
    });

    it("returns valid for text within max length", () => {
      const result = isTextValid("Hello world");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("uses custom max length when provided", () => {
      const text = "a".repeat(101);
      const result = isTextValid(text, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        "Text exceeds maximum length of 100 characters",
      );
    });

    it("returns valid for text at exact max length", () => {
      const text = "a".repeat(5000);
      const result = isTextValid(text);
      expect(result.isValid).toBe(true);
    });
  });

  describe("sanitizeText", () => {
    it("removes control characters", () => {
      const result = sanitizeText("Hello\x00\x1FWorld");
      expect(result).toBe("HelloWorld");
    });

    it("trims whitespace", () => {
      const result = sanitizeText("  Hello World  ");
      expect(result).toBe("Hello World");
    });

    it("truncates text exceeding max length", () => {
      const longText = "a".repeat(6000);
      const result = sanitizeText(longText);
      expect(result.length).toBe(5000);
    });

    it("preserves normal text", () => {
      const result = sanitizeText("Hello World");
      expect(result).toBe("Hello World");
    });

    it("removes newlines and tabs (control characters)", () => {
      const result = sanitizeText("Hello\n\tWorld");
      expect(result).toBe("HelloWorld");
    });
  });

  describe("countWords", () => {
    it("counts words correctly", () => {
      expect(countWords("Hello World")).toBe(2);
    });

    it("counts multiple spaces as single separator", () => {
      expect(countWords("Hello    World")).toBe(2);
    });

    it("returns 0 for empty string", () => {
      expect(countWords("")).toBe(0);
    });

    it("returns 0 for whitespace-only string", () => {
      expect(countWords("   ")).toBe(0);
    });

    it("counts Vietnamese text correctly", () => {
      expect(countWords("Xin chào thế giới")).toBe(4);
    });

    it("handles text with punctuation", () => {
      expect(countWords("Hello, world!")).toBe(2);
    });
  });

  describe("estimateDuration", () => {
    it("estimates duration at default rate", () => {
      const duration = estimateDuration("Hello world");
      expect(duration).toBeCloseTo(0.8, 1);
    });

    it("estimates duration at custom words per minute", () => {
      const duration = estimateDuration("Hello world", 100);
      expect(duration).toBeCloseTo(1.2, 1);
    });

    it("returns 0 for empty text", () => {
      const duration = estimateDuration("");
      expect(duration).toBe(0);
    });

    it("calculates correctly for longer text", () => {
      const text = "One two three four five six seven eight nine ten";
      const duration = estimateDuration(text, 60);
      expect(duration).toBe(10);
    });
  });
});
