"use client";

import { useState, useCallback } from "react";
import {
  TtsGenerator,
  HistoryPanel,
  VoiceSettings,
} from "@/features/tts/components";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    "generate" | "history" | "settings"
  >("generate");
  const [refillText, setRefillText] = useState("");

  const handleRefill = useCallback((text: string) => {
    setRefillText(text);
    setActiveTab("generate");
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Text to Speech
          </h1>
          <p className="text-muted-foreground">
            Convert text to speech using Piper TTS - Browser-based,
            privacy-focused
          </p>
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
              Generate
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                activeTab === "settings"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeTab === "generate" && <TtsGenerator />}
          {activeTab === "history" && <HistoryPanel onRefill={handleRefill} />}
          {activeTab === "settings" && <VoiceSettings />}
        </div>

        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>Powered by Piper TTS • Runs entirely in your browser</p>
        </footer>
      </div>
    </main>
  );
}
