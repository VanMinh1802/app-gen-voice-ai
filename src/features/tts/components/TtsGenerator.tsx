"use client";

import { useState, useCallback, useEffect } from "react";
import { useTtsGenerate } from "../hooks/useTtsGenerate";
import { useTtsStore } from "../store";
import { config } from "@/config";
import { isTextValid } from "@/lib/text-processing/textProcessor";
import { AudioPlayer } from "./AudioPlayer";
import { cn } from "@/lib/utils";

export function TtsGenerator() {
  const [text, setText] = useState("");
  const { settings, status, progress, error, generate, isReady } = useTtsGenerate();
  const { setSettings } = useTtsStore();

  const [textError, setTextError] = useState<string | null>(null);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);

      if (value && !isTextValid(value, config.tts.maxTextLength)) {
        setTextError(`Text exceeds maximum length of ${config.tts.maxTextLength} characters`);
      } else {
        setTextError(null);
      }
    },
    []
  );

  const handleVoiceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const voice = e.target.value as (typeof config.voices)[number]["id"];
      setSettings({ voice, model: voice });
    },
    [setSettings]
  );

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const speed = parseFloat(e.target.value);
      setSettings({ speed });
    },
    [setSettings]
  );

  const handleGenerate = useCallback(() => {
    if (!text.trim()) return;
    generate(text);
  }, [text, generate]);

  const isGenerating = status === "generating";
  const isPlaying = status === "playing";
  const canGenerate = text.trim().length > 0 && !textError && isReady && !isGenerating;

  const getStatusText = () => {
    if (!isReady) return "Initializing...";
    if (isGenerating) return `Generating... ${progress}%`;
    if (isPlaying) return "Playing...";
    if (error) return error;
    return "Ready";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="voice" className="text-sm font-medium">
          Voice
        </label>
        <select
          id="voice"
          value={settings.voice}
          onChange={handleVoiceChange}
          disabled={isGenerating}
          className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        >
          {config.voices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="text" className="text-sm font-medium">
          Text to Convert
        </label>
        <textarea
          id="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Enter text to convert to speech..."
          disabled={isGenerating}
          className={cn(
            "w-full h-40 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:opacity-50",
            textError && "border-red-500"
          )}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className={textError ? "text-red-500" : ""}>
            {text.length} / {config.tts.maxTextLength}
          </span>
          {textError && <span className="text-red-500">{textError}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="speed" className="text-sm font-medium">
          Speed: {settings.speed.toFixed(1)}x
        </label>
        <input
          id="speed"
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.speed}
          onChange={handleSpeedChange}
          disabled={isGenerating}
          className="w-full accent-primary disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5x</span>
          <span>2.0x</span>
        </div>
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? "Generating..." : "Generate Speech"}
      </button>

      {(isPlaying || status === "idle") && <AudioPlayer />}
    </div>
  );
}
