"use client";

import { useCallback } from "react";
import { History, Ban, Plus, Download } from "lucide-react";
import { useTtsStore } from "../store";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import type { TtsHistoryItem } from "../types";

interface HistoryPanelProps {
  onRefill: (text: string) => void;
  onCreateNew?: () => void;
}

export function HistoryPanel({ onRefill, onCreateNew }: HistoryPanelProps) {
  const { history, removeFromHistory, clearHistory, setCurrentAudio, setStatus, setNowPlaying } = useTtsStore();

  const handlePlay = useCallback(
    (item: TtsHistoryItem) => {
      setNowPlaying(item);
      setCurrentAudio(null, item.audioUrl);
      setStatus("playing");
    },
    [setNowPlaying, setCurrentAudio, setStatus]
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

  const handleDownload = useCallback(async (item: TtsHistoryItem) => {
    if (!item.audioUrl?.startsWith("blob:")) return;
    try {
      const res = await fetch(item.audioUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `genvoice-${item.id}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  }, []);

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
    if (voiceId.startsWith(CUSTOM_MODEL_PREFIX)) {
      const id = voiceId.slice(CUSTOM_MODEL_PREFIX.length);
      const custom = config.customModels.find((m) => m.id === id);
      return (custom?.name ?? voiceId).replace(" (custom)", "");
    }
    // Custom-only mode: built-in voices removed
    return voiceId;
  };

  if (history.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-700">
          {/* Icon Container with badge */}
          <div className="relative">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
              <History className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-background border-4 border-background rounded-full flex items-center justify-center">
              <Ban className="w-6 h-6 text-red-500" />
            </div>
          </div>

          {/* Text Section */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Chưa có bản ghi nào</h2>
            <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
              Nhập văn bản và bấm Tạo giọng nói để bắt đầu
            </p>
          </div>

          {/* Action Button */}
          {onCreateNew && (
            <button 
              onClick={onCreateNew}
              className="mt-4 px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg transition-all border border-primary/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo bản ghi đầu tiên
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Lịch sử ({history.length}/{config.tts.historyLimit})
        </h2>
        <button
          onClick={clearHistory}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-card p-4 border border-primary/10 rounded-xl hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">{getVoiceName(item.voice)}</span>
                  <span>•</span>
                  <span>{item.speed}x</span>
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{item.text || "(No text)"}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlay(item)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-[#8b5cf6] transition-colors"
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

                <button
                  onClick={() => handleDownload(item)}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-primary/20 text-foreground hover:bg-primary/10 transition-colors"
                  aria-label="Tải xuống"
                  title="Tải xuống"
                >
                  <Download className="w-5 h-5" />
                </button>

                {item.text && (
                  <button
                    onClick={() => handleRefill(item.text)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-primary/20 text-foreground hover:bg-primary/10 transition-colors"
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
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-primary/20 text-foreground hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
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
