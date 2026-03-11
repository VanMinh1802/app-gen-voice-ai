import { describe, it, expect } from "vitest";
import {
  normalizeVietnamese,
  numberToWords,
  convertPercentage,
  convertCurrency,
  convertTime,
  convertDate,
  convertRomanNumerals,
  convertStandaloneNumbers,
  convertPhoneNumber,
} from "@/lib/text-processing/vietnameseNormalizer";

describe("vietnameseNormalizer", () => {
  describe("numberToWords", () => {
    it("converts 0", () => {
      expect(numberToWords("0")).toBe("không");
    });

    it("converts single digits", () => {
      expect(numberToWords("5")).toBe("năm");
      expect(numberToWords("9")).toBe("chín");
    });

    it("converts teens (10-19)", () => {
      expect(numberToWords("10")).toBe("mười");
      expect(numberToWords("15")).toBe("mười lăm");
    });

    it("converts tens (20-99)", () => {
      expect(numberToWords("20")).toBe("hai mươi");
      expect(numberToWords("21")).toBe("hai mươi mốt");
      expect(numberToWords("50")).toBe("năm mươi");
    });

    it("converts hundreds", () => {
      expect(numberToWords("100")).toBe("một trăm");
      expect(numberToWords("200")).toBe("hai trăm");
    });

    it("handles negative numbers", () => {
      expect(numberToWords("-5")).toBe("âm năm");
    });
  });

  describe("convertPercentage", () => {
    it("converts percentage", () => {
      expect(convertPercentage("50%")).toBe("năm mươi phần trăm");
      expect(convertPercentage("100%")).toBe("một trăm phần trăm");
    });
  });

  describe("convertCurrency", () => {
    it("converts VND currency", () => {
      expect(convertCurrency("1000 VND")).toBe("một nghìn đồng");
      expect(convertCurrency("50000 VND")).toBe("năm mươi nghìn đồng");
    });

    it("converts USD currency", () => {
      expect(convertCurrency("$100")).toBe("một trăm đô la");
    });
  });

  describe("convertStandaloneNumbers", () => {
    it("converts standalone numbers", () => {
      expect(convertStandaloneNumbers("123")).toBe("một trăm hai mươi ba");
    });
  });

  describe("normalizeVietnamese", () => {
    it("returns empty string for empty input", () => {
      expect(normalizeVietnamese("")).toBe("");
    });

    it("normalizes Vietnamese text with numbers", () => {
      const result = normalizeVietnamese("Tôi có 5 quả táo");
      expect(result).toContain("năm");
    });

    it("normalizes percentages", () => {
      const result = normalizeVietnamese("Tăng 50%");
      expect(result).toContain("năm mươi");
      expect(result).toContain("trăm");
    });

    it("normalizes currency", () => {
      const result = normalizeVietnamese("Giá 100000 VND");
      expect(result).toContain("một trăm nghìn");
      expect(result).toContain("đồng");
    });
  });
});
