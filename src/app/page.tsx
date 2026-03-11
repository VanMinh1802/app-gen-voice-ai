"use client";

import { useState, useCallback, useEffect } from "react";
import {
  TtsGenerator,
  HistoryPanel,
  VoiceSettings,
  AudioPlayer,
} from "@/features/tts/components";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocale } from "@/lib/hooks/useLocale";
import { useTtsStore } from "@/features/tts/store";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    "generate" | "history" | "settings"
  >("generate");
  const [refillText, setRefillText] = useState("");
  const { currentAudioUrl } = useTtsStore();
  const { t, mounted, setLocale, locale } = useLocale();

  const handleRefill = useCallback((text: string) => {
    setRefillText(text);
    setActiveTab("generate");
  }, []);

  const clearRefill = useCallback(() => setRefillText(""), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    if (urlLang && (urlLang === "vi" || urlLang === "en" || urlLang === "auto")) {
      setLocale(urlLang);
    }
  }, [setLocale]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Text to Speech</h1>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-start mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {t("appTitle")}
            </h1>
            <p className="text-muted-foreground">{t("appDescription")}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "vi" | "en" | "auto")}
              className="text-xs px-2 py-1 border rounded-md bg-background"
            >
              <option value="auto">Auto</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md bg-muted p-1">
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                activeTab === "generate"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("generate")}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("history")}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                activeTab === "settings"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("settings")}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeTab === "generate" && (
            <TtsGenerator refillText={refillText} onRefillApplied={clearRefill} />
          )}
          {activeTab === "history" && <HistoryPanel onRefill={handleRefill} />}
          {activeTab === "settings" && <VoiceSettings />}
        </div>

        {currentAudioUrl && (
          <div className="max-w-4xl mx-auto mt-6">
            <AudioPlayer />
          </div>
        )}

        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>Powered by Piper TTS • Runs entirely in your browser</p>
        </footer>
      </div>
    </main>
  );
}
