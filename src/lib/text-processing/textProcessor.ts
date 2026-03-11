import { config } from "@/config";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function isTextValid(
  text: string,
  maxLength?: number,
): ValidationResult {
  const max = maxLength || config.tts.maxTextLength;

  if (!text || !text.trim()) {
    return {
      isValid: false,
      error: "Text cannot be empty",
    };
  }

  if (text.length > max) {
    return {
      isValid: false,
      error: `Text exceeds maximum length of ${max} characters`,
    };
  }

  return { isValid: true };
}

export function sanitizeText(text: string): string {
  return text
    .slice(0, config.tts.maxTextLength)
    .replace(/[\u0000-\u001F]/g, "")
    .trim();
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function estimateDuration(text: string, wordsPerMinute = 150): number {
  const wordCount = countWords(text);
  return (wordCount / wordsPerMinute) * 60;
}
