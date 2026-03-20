"use client";

import { useState, useEffect, useCallback } from "react";

export type Locale = "vi" | "en" | "auto";

const STORAGE_KEY = "tts-locale";
const BROWSER_LOCALE_KEY = "tts-browser-locale";

function detectBrowserLocale(): "vi" | "en" {
  if (typeof navigator === "undefined") return "vi";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("vi")) return "vi";
  if (lang.startsWith("en")) return "en";
  return "vi";
}

function getStoredLocale(): Locale {
  if (typeof localStorage === "undefined") return "auto";
  return (localStorage.getItem(STORAGE_KEY) as Locale) || "auto";
}

function getEffectiveLocale(locale: Locale): "vi" | "en" {
  if (locale === "auto") {
    const browserLocale = localStorage.getItem(BROWSER_LOCALE_KEY) as
      | "vi"
      | "en"
      | null;
    if (browserLocale) return browserLocale;
    const detected = detectBrowserLocale();
    localStorage.setItem(BROWSER_LOCALE_KEY, detected);
    return detected;
  }
  return locale;
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("auto");
  const [effectiveLocale, setEffectiveLocale] = useState<"vi" | "en">("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    setEffectiveLocale(getEffectiveLocale(stored));
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    setEffectiveLocale(getEffectiveLocale(newLocale));
  }, []);

  const t = useCallback(
    <K extends string>(key: K): string => {
      const translations: Record<string, Record<"vi" | "en", string>> = {
        appTitle: {
          vi: "Chuyển văn bản thành giọng nói",
          en: "Text to Speech",
        },
        appDescription: {
          vi: "Chuyển văn bản thành giọng nói bằng Piper TTS - Chạy trên trình duyệt, bảo mật",
          en: "Convert text to speech using Piper TTS - Browser-based, privacy-focused",
        },
        generate: {
          vi: "Tạo",
          en: "Generate",
        },
        history: {
          vi: "Lịch sử",
          en: "History",
        },
        settings: {
          vi: "Cài đặt",
          en: "Settings",
        },
        voice: {
          vi: "Giọng nói",
          en: "Voice",
        },
        voiceModel: {
          vi: "Giọng nói / Model",
          en: "Voice / Model",
        },
        text: {
          vi: "Văn bản",
          en: "Text",
        },
        enterText: {
          vi: "Nhập văn bản bạn muốn chuyển thành giọng nói...",
          en: "Enter the text you want to convert to speech...",
        },
        speed: {
          vi: "Tốc độ",
          en: "Speed",
        },
        normalizeText: {
          vi: "Chuẩn hóa văn bản (số, ngày, giờ...)",
          en: "Normalize text (numbers, dates, time...)",
        },
        generating: {
          vi: "Đang tạo...",
          en: "Generating...",
        },
        playing: {
          vi: "Đang phát...",
          en: "Playing...",
        },
        ready: {
          vi: "Sẵn sàng",
          en: "Ready",
        },
        initializing: {
          vi: "Đang khởi động...",
          en: "Initializing...",
        },
        textTooLong: {
          vi: "Văn bản vượt quá giới hạn",
          en: "Text exceeds limit",
        },
        voiceSelection: {
          vi: "Chọn giọng nói",
          en: "Voice Selection",
        },
        languageFilter: {
          vi: "Lọc theo ngôn ngữ",
          en: "Filter by language",
        },
        allLanguages: {
          vi: "Tất cả",
          en: "All",
        },
        vietnamese: {
          vi: "Tiếng Việt",
          en: "Vietnamese",
        },
        english: {
          vi: "Tiếng Anh",
          en: "English",
        },
        noHistory: {
          vi: "Chưa có lịch sử",
          en: "No history yet",
        },
        clearHistory: {
          vi: "Xóa lịch sử",
          en: "Clear history",
        },
        speedControl: {
          vi: "Tốc độ",
          en: "Speed",
        },
        slower: {
          vi: "Chậm hơn",
          en: "Slower",
        },
        faster: {
          vi: "Nhanh hơn",
          en: "Faster",
        },
        volume: {
          vi: "Âm lượng",
          en: "Volume",
        },
        cachedVoices: {
          vi: "Giọng nói đã tải",
          en: "Cached Voices",
        },
        cachedDescription: {
          vi: "Các mô hình giọng nói đã tải sẽ được lưu vào bộ nhớ để tải nhanh hơn.",
          en: "Downloaded voice models are cached locally for faster loading.",
        },
        share: {
          vi: "Chia sẻ",
          en: "Share",
        },
        copied: {
          vi: "Đã sao chép!",
          en: "Copied!",
        },
        copyLink: {
          vi: "Sao chép liên kết",
          en: "Copy link",
        },
        deleteItem: {
          vi: "Xóa",
          en: "Delete",
        },
        useAgain: {
          vi: "Sử dụng lại",
          en: "Use again",
        },
        by: {
          vi: "bởi",
          en: "by",
        },
        noText: {
          vi: "Vui lòng nhập văn bản",
          en: "Please enter text",
        },
        words: {
          vi: "từ",
          en: "words",
        },
        characters: {
          vi: "ký tự",
          en: "chars",
        },
        download: {
          vi: "Tải xuống",
          en: "Download",
        },
        downloadAudio: {
          vi: "Tải âm thanh",
          en: "Download audio",
        },
      };

      return translations[key]?.[effectiveLocale] || key;
    },
    [effectiveLocale],
  );

  return {
    locale,
    setLocale,
    effectiveLocale,
    mounted,
    t,
  };
}
