"use client";

import { useCallback } from "react";
import { useTtsStore } from "../store";
import { config } from "@/config";

interface HistoryPanelProps {
  onRefill: (text: string) => void;
}

export function HistoryPanel({ onRefill }: HistoryPanelProps) {
  const { history, removeFromHistory, clearHistory, setCurrentAudio, setStatus } = useTtsStore();

  const handlePlay = useCallback(
    (audioUrl: string) => {
      setCurrentAudio(null, audioUrl);
      setStatus("playing");
    },
    [setCurrentAudio, setStatus]
  );

  const handleRefill = useCallback(
    (text: string) => {
      onRefill(text);
    },
    [onRefill]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeFromHistory(id);
    },
    [removeFromHistory]
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVoiceName = (voiceId: string) => {
    const voice = config.voices.find((v) => v.id === voiceId);
    return voice?.name || voiceId;
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-4 text-muted-foreground"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <h3 className="text-lg font-medium mb-2">No History Yet</h3>
        <p className="text-muted-foreground">
          Generated speech will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          History ({history.length}/{config.tts.historyLimit})
        </h2>
        <button
          onClick={clearHistory}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span className="font-medium">{getVoiceName(item.voice)}</span>
                  <span>•</span>
                  <span>{item.speed}x</span>
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <p className="text-sm line-clamp-2">{item.text || "(No text)"}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlay(item.audioUrl)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  aria-label="Play"
                >
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
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>

                {item.text && (
                  <button
                    onClick={() => handleRefill(item.text)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-input hover:bg-accent transition-colors"
                    aria-label="Refill"
                    title="Load text back"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-input hover:bg-accent hover:text-red-500 transition-colors"
                  aria-label="Delete"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
