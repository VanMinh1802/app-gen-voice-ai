"use client";

import { useCallback, useState } from "react";
import { useTtsStore } from "../store";
import { config } from "@/config";

export function VoiceSettings() {
  const { settings, setSettings } = useTtsStore();
  const [cachedVoices, setCachedVoices] = useState<string[]>([]);

  const handleVoiceSelect = useCallback(
    (voiceId: string) => {
      setSettings({
        voice: voiceId as typeof settings.voice,
        model: voiceId as typeof settings.model,
      });
    },
    [setSettings, settings]
  );

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setSettings({ speed });
    },
    [setSettings]
  );

  const handleVolumeChange = useCallback(
    (volume: number) => {
      setSettings({ volume });
    },
    [setSettings]
  );

  const handleClearCache = useCallback(async (voiceId: string) => {
    setCachedVoices((prev) => prev.filter((v) => v !== voiceId));
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Voice Selection</h2>
        <div className="space-y-2">
          {config.voices.map((voice) => (
            <label
              key={voice.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                settings.voice === voice.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="voice"
                value={voice.id}
                checked={settings.voice === voice.id}
                onChange={() => handleVoiceSelect(voice.id)}
                className="sr-only"
              />
              <div className="flex-1">
                <p className="font-medium">{voice.name}</p>
                <p className="text-sm text-muted-foreground">
                  {voice.language.toUpperCase()} • {voice.gender}
                </p>
              </div>
              {settings.voice === voice.id && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Speed</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Speech Rate</span>
            <span className="font-medium">{settings.speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={typeof settings?.speed === "number" ? settings.speed : 1}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5x (Slower)</span>
            <span>2.0x (Faster)</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Volume</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Output Volume</span>
            <span className="font-medium">{Math.round((typeof settings?.volume === "number" ? settings.volume : 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={typeof settings?.volume === "number" ? settings.volume : 1}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cached Voices</h2>
        <p className="text-sm text-muted-foreground">
          Downloaded voice models are cached locally for faster loading.
        </p>

        {cachedVoices.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No voices cached yet. Downloaded voices will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {cachedVoices.map((voiceId) => {
              const voice = config.voices.find((v) => v.id === voiceId);
              return (
                <div
                  key={voiceId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{voice?.name || voiceId}</p>
                    <p className="text-xs text-muted-foreground">Cached locally</p>
                  </div>
                  <button
                    onClick={() => handleClearCache(voiceId)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="pt-4 border-t">
        <h2 className="text-lg font-semibold mb-2">About</h2>
        <p className="text-sm text-muted-foreground">
          This app uses Piper TTS for text-to-speech synthesis. All processing
          happens directly in your browser - no audio is sent to any server.
        </p>
      </section>
    </div>
  );
}
