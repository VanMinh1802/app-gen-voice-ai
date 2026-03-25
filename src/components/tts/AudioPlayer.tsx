"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Mic,
  X,
  Loader2,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTtsStore } from "@/features/tts/store";
import { useTts } from "@/features/tts/context/TtsContext";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";

interface AudioPlayerProps {
  isVisible?: boolean;
  onClose?: () => void;
  /** Desktop: sidebar thu gọn → thanh phát căn theo mép nội dung (không để hở dưới sidebar) */
  sidebarCollapsed?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioPlayer({
  isVisible = true,
  onClose,
  sidebarCollapsed = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const {
    currentAudioUrl,
    status,
    settings,
    setStatus,
    setSettings,
    setCurrentAudio,
    currentAudio,
    nowPlaying,
    history,
    setNowPlaying,
    streamingState,
    setStreamingState,
    streamingCurrentTime,
    streamingDuration,
    pausedStreaming,
    pauseStreaming,
    resumeStreaming,
  } = useTtsStore();
  const { gaplessPlayer } = useTts();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  /** Gapless streaming: use Web Audio progress; otherwise use <audio> element */
  const isGaplessStreaming = streamingDuration > 0;
  const displayCurrentTime = isGaplessStreaming
    ? streamingCurrentTime
    : currentTime;
  const displayDuration = isGaplessStreaming ? streamingDuration : duration;
  const [volume, setVolume] = useState(settings.volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /** Show buffering spinner when non-gapless streaming is buffering */
  const isBuffering = streamingState === "buffering" && streamingDuration === 0;

  /** Whether playback is active (playing + not paused) */
  const isPlaying = status === "playing" && !pausedStreaming;

  const getVoiceName = useCallback((voiceId: string) => {
    if (voiceId.startsWith(CUSTOM_MODEL_PREFIX)) {
      const id = voiceId.slice(CUSTOM_MODEL_PREFIX.length);
      const custom = config.customModels.find((m) => m.id === id);
      return (custom?.name ?? voiceId).replace(" (custom)", "");
    }
    // Custom-only mode: built-in voices removed
    return voiceId;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [isDragging]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  /**
   * Auto-play logic:
   * - Gapless streaming: sound comes from Web Audio, do not play <audio> element
   * - Non-streaming: auto-play when status === "playing"
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudioUrl) return;
    if (streamingDuration > 0) return; // Gapless mode – playback is via Web Audio

    if (status === "playing" && streamingState === "idle") {
      audio.play().catch(() => setStatus("idle"));
    }
  }, [status, currentAudioUrl, setStatus, streamingState, streamingDuration]);

  /**
   * When a chunk ends during non-gapless streaming, notify the hook to queue the next chunk.
   * (Gapless mode uses its own tick — <audio> element's ended event is not relevant.)
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      // Only handle non-gapless streaming; gapless ends via Web Audio tick
      if (streamingDuration > 0) return;
      if (streamingState === "playing" || streamingState === "buffering") {
        setStreamingState("buffering");
        return;
      }
      if (isLooping) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (streamingState === "idle") {
        setStatus("idle");
        setCurrentTime(0);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [
    streamingState,
    streamingDuration,
    isLooping,
    setStatus,
    setStreamingState,
  ]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.speed;
    }
  }, [settings.speed]);

  /**
   * Pause <audio> element when status changes away from "playing" (non-gapless path).
   * The gapless player is paused directly via gaplessPlayer.pause() in this component
   * and from outside via pauseAudio().
   */
  useEffect(() => {
    if (status !== "playing") {
      audioRef.current?.pause();
    }
  }, [status]);

  /** Pause audio when component unmounts (e.g. user navigates away or player is hidden) */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refs captured at effect start
    const gapless = gaplessPlayer.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: ref captured at effect start
    const audioEl = audioRef.current;
    return () => {
      const { streamingDuration } = useTtsStore.getState();
      if (streamingDuration > 0 && gapless) {
        gapless.pause();
      }
      if (audioEl) {
        audioEl.pause();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs captured at effect start above
  }, []);

  // If nowPlaying is missing (e.g. older sessions), try to derive from history by audioUrl.
  useEffect(() => {
    if (!currentAudioUrl) return;
    if (nowPlaying) return;
    const found = history.find((h) => h.audioUrl === currentAudioUrl);
    if (found) setNowPlaying(found);
  }, [currentAudioUrl, nowPlaying, history, setNowPlaying]);

  const togglePlay = useCallback(() => {
    if (streamingDuration > 0) {
      // Gapless streaming: pause / resume — generation keeps running in worker
      if (pausedStreaming) {
        gaplessPlayer.current?.resume();
        resumeStreaming();
        setStatus("playing");
      } else {
        gaplessPlayer.current?.pause();
        pauseStreaming();
      }
      return;
    }

    // Non-gapless: existing behaviour
    if (status === "playing") {
      setStatus("idle");
    } else {
      if (streamingState !== "idle") {
        setStreamingState("playing");
      }
      setStatus("playing");
    }
  }, [
    status,
    setStatus,
    streamingState,
    setStreamingState,
    streamingDuration,
    pausedStreaming,
    pauseStreaming,
    resumeStreaming,
    gaplessPlayer,
  ]);

  /** Keyboard shortcut: Space = toggle play/pause (global, ignores when typing in input/textarea) */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === " " &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !displayDuration) return;
      if (isGaplessStreaming) return; // Gapless: cannot seek
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * displayDuration;
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [displayDuration, isGaplessStreaming],
  );

  const handleSkip = useCallback(
    (seconds: number) => {
      if (isGaplessStreaming) return; // Gapless: cannot seek
      if (audioRef.current) {
        const newTime = Math.max(
          0,
          Math.min(displayDuration, audioRef.current.currentTime + seconds),
        );
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [displayDuration, isGaplessStreaming],
  );

  /** Index of nowPlaying in history, or -1 */
  const currentIndex =
    nowPlaying && history.length > 0
      ? history.findIndex((h) => h.id === nowPlaying.id)
      : -1;

  const handlePreviousTrack = useCallback(() => {
    if (history.length === 0) {
      handleSkip(-10);
      return;
    }
    if (currentIndex > 0) {
      const prev = history[currentIndex - 1]!;
      setNowPlaying(prev);
      setCurrentAudio(null, prev.audioUrl);
      setStatus("playing");
      setCurrentTime(0);
    } else {
      handleSkip(-10);
    }
  }, [
    history,
    currentIndex,
    setNowPlaying,
    setCurrentAudio,
    setStatus,
    handleSkip,
  ]);

  const handleNextTrack = useCallback(() => {
    if (history.length === 0) {
      handleSkip(30);
      return;
    }
    if (currentIndex >= 0 && currentIndex < history.length - 1) {
      const next = history[currentIndex + 1]!;
      setNowPlaying(next);
      setCurrentAudio(null, next.audioUrl);
      setStatus("playing");
      setCurrentTime(0);
    } else {
      handleSkip(30);
    }
  }, [
    history,
    currentIndex,
    setNowPlaying,
    setCurrentAudio,
    setStatus,
    handleSkip,
  ]);

  const handleShuffle = useCallback(() => {
    if (history.length === 0) return;
    const randomIndex = Math.floor(Math.random() * history.length);
    const item = history[randomIndex]!;
    setNowPlaying(item);
    setCurrentAudio(null, item.audioUrl);
    setStatus("playing");
    setCurrentTime(0);
  }, [history, setNowPlaying, setCurrentAudio, setStatus]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      setSettings({ volume: newVolume });
    },
    [setSettings],
  );

  const handleSpeedChange = useCallback(
    (speed: number) => {
      setSettings({ speed });
    },
    [setSettings],
  );

  const handleDownload = useCallback(async () => {
    let blob: Blob | null = currentAudio;
    if (!blob && currentAudioUrl?.startsWith("blob:")) {
      try {
        const res = await fetch(currentAudioUrl);
        blob = await res.blob();
      } catch {
        return;
      }
    }
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (() => {
      const voiceName = getVoiceName(
        (nowPlaying?.voice ?? settings.voice) as string,
      )
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u024F]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32);
      const textSnippet = (nowPlaying?.text ?? "")
        .trim()
        .slice(0, 24)
        .replace(/[^a-z0-9\u00C0-\u024F]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const parts = [voiceName, textSnippet].filter(Boolean);
      return parts.length > 0
        ? `${parts.join("-")}.wav`
        : `genvoice-${Date.now()}.wav`;
    })();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentAudio, currentAudioUrl, nowPlaying, settings, getVoiceName]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentAudioUrl || !isVisible) return null;

  const progressPercent =
    displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0;
  const voiceIdForDisplay = nowPlaying?.voice ?? settings.voice;
  const title = (nowPlaying?.text ?? "").trim().slice(0, 48) || "TTS Audio";
  const titleIsTruncated = (nowPlaying?.text ?? "").trim().length > 48;
  const speedForDisplay = nowPlaying?.speed ?? settings.speed;
  const subtitleParts = [
    `Giọng ${getVoiceName(voiceIdForDisplay)}`,
    `${speedForDisplay.toFixed(2).replace(/\.00$/, "")}x`,
  ];
  const subtitle = subtitleParts.join(" • ");

  return (
    <footer
      className={cn(
        "bg-card/95 backdrop-blur-xl border-t border-primary/10 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 z-50 fixed bottom-0 left-0 right-0 animate-fade-up",
        sidebarCollapsed ? "lg:left-[4.5rem]" : "lg:left-64",
      )}
    >
      <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />

      {/* Dưới lg: xếp dọc để không đè lên nhau; từ lg: lưới 3 cột */}
      <div className="flex flex-col gap-3 min-w-0 lg:grid lg:grid-cols-12 lg:gap-x-4 lg:gap-y-0 lg:items-center">
        {/* Track info */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:col-span-3">
          <div className="size-11 shrink-0 rounded-2xl bg-primary sm:size-14 flex items-center justify-center text-primary-foreground shadow-lg">
            <Mic className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h4
              className="truncate text-sm font-bold text-foreground sm:text-base"
              title={titleIsTruncated ? (nowPlaying?.text ?? "").trim() : undefined}
            >
              {title}
              {titleIsTruncated ? "…" : ""}
            </h4>
            <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
              {subtitle}
            </p>
          </div>
          <button
            onClick={() => {
              if (streamingDuration > 0) {
                gaplessPlayer.current?.pause();
              } else {
                audioRef.current?.pause();
              }
              onClose?.();
            }}
            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5 lg:hidden"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transport + timeline — full width, controls có thể xuống dòng */}
        <div className="flex min-w-0 flex-col gap-2 lg:col-span-6">
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:gap-x-4">
            <button
              onClick={handleShuffle}
              className="hidden shrink-0 p-2 text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
              aria-label="Phát ngẫu nhiên"
              disabled={history.length === 0}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={handlePreviousTrack}
              className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Bài trước / Lùi 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-primary/40 active:scale-95 disabled:cursor-not-allowed sm:h-14 sm:w-14"
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              disabled={isBuffering}
            >
              {isBuffering ? (
                <Loader2 className="h-6 w-6 animate-spin sm:h-7 sm:w-7" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : (
                <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7" />
              )}
            </button>
            <button
              onClick={handleNextTrack}
              className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Bài sau / Tiến 30s"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={cn(
                "hidden shrink-0 p-2 text-muted-foreground transition-colors hover:text-primary md:inline-flex",
                isLooping && "text-primary",
              )}
              aria-label="Lặp"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
            <span className="w-9 shrink-0 text-right font-mono text-[10px] font-bold text-muted-foreground tabular-nums sm:w-10">
              {formatTime(displayCurrentTime)}
            </span>
            <div
              ref={progressRef}
              className="group relative h-2 min-w-0 flex-1 cursor-pointer rounded-full bg-black/15 dark:bg-slate-800"
              onClick={handleProgressClick}
            >
              {isBuffering && (
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20" />
              )}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all group-hover:brightness-110"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className={cn(
                  "pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-lg transition-opacity",
                  isBuffering
                    ? "opacity-0"
                    : progressPercent > 0 && progressPercent < 100
                      ? "opacity-100 group-hover:opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                )}
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
              <input
                type="range"
                min={0}
                max={displayDuration || 0}
                step={0.1}
                value={displayCurrentTime}
                onChange={handleSeek}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Thanh tiến trình"
              />
            </div>
            {isBuffering ? (
              <span
                className="w-9 shrink-0 animate-pulse font-mono text-[10px] font-bold text-primary tabular-nums sm:w-10"
                aria-label="Đang tải audio, vui lòng đợi"
              >
                •••
              </span>
            ) : (
              <span className="w-9 shrink-0 font-mono text-[10px] font-bold text-muted-foreground tabular-nums sm:w-10">
                {formatTime(displayDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Tốc độ, âm lượng, tải — hàng riêng trên mobile/tablet, không chen vào cột giữa */}
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-border/40 pt-2 lg:col-span-3 lg:border-t-0 lg:pt-0 lg:justify-end">
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[10px] font-bold uppercase tracking-tighter text-muted-foreground xl:inline">
              Tốc độ
            </span>
            <select
              value={settings.speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="min-h-[2.25rem] min-w-[3.25rem] cursor-pointer rounded-xl border border-border/50 bg-muted/80 px-2 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted focus:border-primary focus:ring-2 focus:ring-primary"
              aria-label="Tốc độ phát"
            >
              {SPEED_OPTIONS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>

          {settings.pitch !== 0 && (
            <div className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 xl:flex">
              <Waves className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-mono text-[10px] font-bold tabular-nums text-primary">
                {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}
              </span>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="shrink-0 p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={isMuted ? "Bật âm" : "Tắt âm"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <div className="flex w-20 shrink-0 items-center gap-2 sm:w-24">
              <div className="group relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/15 dark:bg-slate-800">
                <div
                  className="h-full bg-foreground/30 transition-all group-hover:bg-foreground"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Âm lượng"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="Tải xuống"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
