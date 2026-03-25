"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTtsGenerate } from "../hooks/useTtsGenerate";
import { useTtsStore } from "../store";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import { isTextValid } from "@/lib/text-processing/textProcessor";
import { ShareButton } from "@/components/ShareButton";
import { DemoSamples } from "./DemoSamples";
import { useLocale } from "@/lib/hooks/useLocale";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export interface TtsGeneratorProps {
  /** When set (e.g. from History "load text back"), fill the text area and clear after apply. */
  refillText?: string;
  onRefillApplied?: () => void;
}

export function TtsGenerator({
  refillText,
  onRefillApplied,
}: TtsGeneratorProps = {}) {
  const [text, setText] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const { settings, status, progress, error, generate, isReady } =
    useTtsGenerate();
  const { currentAudio, setSettings } = useTtsStore();
  const { t, mounted } = useLocale();

  const [textError, setTextError] = useState<string | null>(null);

  // Text statistics
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [text]);

  // Download audio handler
  const handleDownload = useCallback(() => {
    if (!currentAudio) return;
    const url = URL.createObjectURL(currentAudio);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tts-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentAudio]);

  const allVoices = useMemo(() => {
    const custom = config.customModels.map((m) => ({
      id: `${CUSTOM_MODEL_PREFIX}${m.id}` as const,
      name: m.name,
      language: "vi" as const,
      gender: "female" as const,
    }));
    return custom;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const urlText = params.get("text");
    const urlVoice = params.get("voice");
    const urlSpeed = params.get("speed");
    const urlLang = params.get("lang");

    if (urlText) setText(urlText);
    if (urlVoice) {
      const exists = allVoices.some((v) => v.id === urlVoice);
      if (exists) {
        setSettings({
          voice: urlVoice as typeof settings.voice,
          model: urlVoice as typeof settings.model,
        });
      }
    }
    if (urlSpeed) {
      const speed = parseFloat(urlSpeed);
      if (!isNaN(speed)) setSettings({ speed });
    }
    if (urlLang && (urlLang === "vi" || urlLang === "en")) {
      setLanguageFilter(urlLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, allVoices]);

  useEffect(() => {
    if (refillText != null && refillText !== "") {
      setText(refillText);
      onRefillApplied?.();
    }
  }, [refillText, onRefillApplied]);

  const filteredVoices = useMemo(() => {
    if (languageFilter === "all") return allVoices;
    return allVoices.filter((v) => v.language === languageFilter);
  }, [languageFilter, allVoices]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);

      if (value && !isTextValid(value, config.tts.maxTextLength)) {
        setTextError(
          `Text exceeds maximum length of ${config.tts.maxTextLength} characters`,
        );
      } else {
        setTextError(null);
      }
    },
    [],
  );

  const handleVoiceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const voice = e.target.value as typeof settings.voice;
      setSettings({ voice, model: voice });
    },
    [setSettings, settings],
  );

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const speed = parseFloat(e.target.value);
      setSettings({ speed });
    },
    [setSettings],
  );

  const handleNormalizeToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({ normalizeText: e.target.checked });
    },
    [setSettings],
  );

  const handleGenerate = useCallback(() => {
    if (!text.trim()) return;
    generate(text);
  }, [text, generate]);

  const isGenerating = status === "generating";
  const isPlaying = status === "playing";
  const canGenerate =
    text.trim().length > 0 && !textError && isReady && !isGenerating;

  const getStatusText = () => {
    if (!isReady) return t("initializing");
    if (isGenerating) return `${t("generating")} ${progress}%`;
    if (isPlaying) return t("playing");
    if (error) return error;
    return t("ready");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="languageFilter" className="text-sm font-medium">
            {t("languageFilter") || "Ngôn ngữ"}
          </label>
          <select
            id="languageFilter"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="text-xs px-2 py-1 border rounded-md bg-background"
          >
            <option value="all">{t("allLanguages")}</option>
            <option value="vi">{t("vietnamese")}</option>
            <option value="en">{t("english")}</option>
          </select>
        </div>
        <label htmlFor="voice" className="text-sm font-medium">
          {t("voiceModel")}
        </label>
        <select
          id="voice"
          value={settings?.voice ?? config.tts.defaultVoice}
          onChange={handleVoiceChange}
          disabled={isGenerating}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {filteredVoices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="text" className="text-sm font-medium">
          {t("text")}
        </label>
        <textarea
          id="text"
          value={text ?? ""}
          onChange={handleTextChange}
          placeholder={t("enterText")}
          disabled={isGenerating}
          className={cn(
            "w-full h-40 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50",
            textError && "border-red-500",
          )}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {wordCount} {t("words")} • {text.length} {t("characters")}
          </span>
          <span className={textError ? "text-red-500" : ""}>
            {text.length} / {config.tts.maxTextLength}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="speed" className="text-sm font-medium">
          {t("speed")}:{" "}
          {(typeof settings?.speed === "number" ? settings.speed : 1).toFixed(
            1,
          )}
          x
        </label>
        <input
          id="speed"
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={typeof settings?.speed === "number" ? settings.speed : 1}
          onChange={handleSpeedChange}
          disabled={isGenerating}
          className="w-full accent-primary disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5x</span>
          <span>2.0x</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="normalizeText"
          type="checkbox"
          checked={Boolean(settings?.normalizeText)}
          onChange={handleNormalizeToggle}
          disabled={isGenerating}
          className="w-4 h-4 accent-primary"
        />
        <label
          htmlFor="normalizeText"
          className="text-sm text-muted-foreground"
        >
          {t("normalizeText")}
        </label>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
      )}

      {error && !isGenerating && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? t("generating") : t("generate")}
        </button>
        <ShareButton
          text={text}
          voice={settings?.voice ?? config.tts.defaultVoice}
          speed={typeof settings?.speed === "number" ? settings.speed : 1}
        />
        {currentAudio && (
          <button
            onClick={handleDownload}
            className="py-3 px-4 border border-input rounded-md font-medium hover:bg-accent transition-colors"
            title={t("downloadAudio")}
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      <DemoSamples onSelect={setText} />
    </div>
  );
}
