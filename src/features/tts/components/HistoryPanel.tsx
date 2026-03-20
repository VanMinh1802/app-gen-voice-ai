"use client";

import { useCallback, useState, useEffect } from "react";
import {
  History,
  Ban,
  Plus,
  Download,
  Play,
  Pause,
  Loader2,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  HardDrive,
  Trash,
} from "lucide-react";
import { useTtsStore, type StorageInfo } from "../store";
import { useTts } from "../context/TtsContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import type { TtsHistoryItem } from "../types";
import { logger } from "@/lib/logger";

interface HistoryPanelProps {
  onRefill: (text: string, voice?: string, speed?: number) => void;
  onCreateNew?: () => void;
}

/** Format bytes to human readable string */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Storage Usage Bar Component */
function StorageUsageBar({ storageInfo, historyCount }: { storageInfo: StorageInfo; historyCount: number }) {
  // Calculate percentage based on history limit, not browser quota
  const percent = config.tts.historyLimit > 0
    ? Math.min((historyCount / config.tts.historyLimit) * 100, 100)
    : 0;
  const isHighUsage = percent > 80;
  const isCriticalUsage = percent > 95;

  return (
    <div className="bg-card border border-primary/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            Dung lượng lưu trữ
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-mono",
            isCriticalUsage
              ? "text-red-500"
              : isHighUsage
                ? "text-orange-500"
                : "text-muted-foreground",
          )}
        >
          {formatBytes(storageInfo.historyBytes)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            isCriticalUsage
              ? "bg-red-500"
              : isHighUsage
                ? "bg-orange-500"
                : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Info text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {historyCount} / {config.tts.historyLimit} bản ghi
        </span>
        <span>{percent.toFixed(1)}% đã sử dụng</span>
      </div>

      {/* Warning for high usage */}
      {(isHighUsage || historyCount >= config.tts.historyLimit) && (
        <div className="flex items-start gap-2 p-2.5 bg-orange-500/5 border border-orange-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
            {historyCount >= config.tts.historyLimit
              ? `Đã đạt giới hạn ${config.tts.historyLimit} bản ghi. Xóa bớt bản ghi cũ để tạo mới.`
              : "Dung lượng sắp đầy. Hãy xóa bớt các bản ghi cũ để tiếp tục lưu trữ."}
          </p>
        </div>
      )}
    </div>
  );
}

export function HistoryPanel({ onRefill, onCreateNew }: HistoryPanelProps) {
  const {
    history,
    isHistoryLoaded,
    removeFromHistory,
    clearHistory,
    setCurrentAudio,
    setStatus,
    setPlaybackStatus,
    setNowPlaying,
    nowPlaying,
    storageInfo,
    loadStorageInfo,
  } = useTtsStore();
  const { gaplessPlayer, pauseAudio } = useTts();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load storage info when history changes
  useEffect(() => {
    if (isHistoryLoaded) {
      loadStorageInfo();
    }
  }, [isHistoryLoaded, history.length, loadStorageInfo]);

  const handlePlay = useCallback(
    (item: TtsHistoryItem) => {
      // H-1: Pause any currently playing audio before starting new track
      pauseAudio();
      setNowPlaying(item);
      setCurrentAudio(null, item.audioUrl);
      setStatus("playing");
      setPlaybackStatus("playing");
    },
    [pauseAudio, setNowPlaying, setCurrentAudio, setStatus, setPlaybackStatus],
  );

  const handleRefill = useCallback(
    (text: string, voice?: string, speed?: number) => {
      onRefill(text, voice, speed);
    },
    [onRefill],
  );

  const handleDelete = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const confirmDelete = useCallback(
    (id: string) => {
      // If deleting the currently playing item, stop audio first
      if (nowPlaying?.id === id) {
        pauseAudio();
      }
      removeFromHistory(id);
      setConfirmDeleteId(null);
    },
    [nowPlaying, pauseAudio, removeFromHistory],
  );

  const handleClearHistory = useCallback(() => {
    setConfirmClearAll(true);
  }, []);

  const confirmClearHistory = useCallback(async () => {
    setIsClearing(true);
    pauseAudio();
    await clearHistory();
    setConfirmClearAll(false);
    setIsClearing(false);
  }, [pauseAudio, clearHistory]);

  const handleDownload = useCallback(async (item: TtsHistoryItem) => {
    if (!item.audioUrl?.startsWith("blob:")) return;
    try {
      const res = await fetch(item.audioUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const rawVoiceName = item.voice.startsWith(CUSTOM_MODEL_PREFIX)
        ? item.voice.slice(CUSTOM_MODEL_PREFIX.length)
        : item.voice;
      const voiceName = (
        config.customModels.find((m) => m.id === rawVoiceName)?.name ??
        rawVoiceName
      )
        .replace(" (custom)", "")
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u024F]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32);
      const textSnippet = (item.text ?? "")
        .trim()
        .slice(0, 24)
        .replace(/[^a-z0-9\u00C0-\u024F]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const parts = [voiceName, textSnippet].filter(Boolean);
      link.download =
        parts.length > 0 ? `${parts.join("-")}.wav` : `genvoice-${item.id}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error("Download failed:", e);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
    return voiceId;
  };

  if (!isHistoryLoaded) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-muted/50 rounded-lg animate-pulse" />
        </div>
        {/* Storage skeleton */}
        <div className="bg-card p-4 border border-primary/10 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-muted/50 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card p-4 border border-primary/10 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-bold text-foreground">
              Chưa có bản ghi nào
            </h2>
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
      {/* Storage Usage Bar */}
      <StorageUsageBar storageInfo={storageInfo} historyCount={history.length} />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Lịch sử ({history.length}/{config.tts.historyLimit})
        </h2>
        <div className="flex items-center gap-2">
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-all border border-primary/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo mới
            </button>
          )}
          <button
            onClick={handleClearHistory}
            className="text-xs text-muted-foreground hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/5"
          >
            Xóa tất cả
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {history.map((item) => {
          const isActive = nowPlaying?.id === item.id;
          return (
            <div
              key={item.id}
              className="bg-card p-4 border rounded-xl transition-all hover:border-primary/20"
              style={{
                borderColor: isActive
                  ? "hsl(var(--primary) / 0.35)"
                  : "hsl(var(--primary) / 0.1)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Meta row: voice + speed + duration + streaming badge */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-1.5">
                    {/* H-11: Streaming badge */}
                    {item.id.startsWith("streaming-") ? (
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang tạo...
                      </span>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {getVoiceName(item.voice)}
                      </span>
                    )}
                    {!item.id.startsWith("streaming-") && (
                      <>
                        <span>•</span>
                        <span>{item.speed}x</span>
                      </>
                    )}
                    {item.duration > 0 && !item.id.startsWith("streaming-") && (
                      <>
                        <span>•</span>
                        <span className="tabular-nums">
                          {formatTime(item.duration)}
                        </span>
                      </>
                    )}
                    {item.id.startsWith("streaming-") ? (
                      <>
                        <span>•</span>
                        <span className="text-muted-foreground/60">
                          {formatDate(item.createdAt)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </>
                    )}
                  </div>
                  {/* Text */}
                  <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                    {item.text || "(No text)"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePlay(item)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-full transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                        : "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary)/0.85)]",
                    )}
                    aria-label={isActive ? "Đang phát" : "Phát"}
                    title={isActive ? "Đang phát" : "Phát lại"}
                  >
                    {isActive ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDownload(item)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                    aria-label="Tải xuống"
                    title="Tải xuống"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {item.text && (
                    <button
                      onClick={() =>
                        handleRefill(item.text, item.voice, item.speed)
                      }
                      className="w-10 h-10 flex items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                      aria-label="Điền lại văn bản"
                      title="Điền lại văn bản"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-border/50 text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                    aria-label="Xóa"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* H-8: Confirm dialog for single item delete */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Xóa bản ghi"
        description="Bạn có chắc chắn muốn xóa bản ghi này? Hành động này không thể hoàn tác."
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        destructive
        onConfirm={() => confirmDeleteId && confirmDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* H-8: Confirm dialog for Clear All */}
      <ConfirmDialog
        open={confirmClearAll}
        title="Xóa tất cả lịch sử"
        description={`Bạn có chắc chắn muốn xóa tất cả ${history.length} bản ghi? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa tất cả"
        cancelLabel="Hủy"
        destructive
        onConfirm={confirmClearHistory}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}
