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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTtsStore } from "@/features/tts/store";
import { useTts } from "@/features/tts/context/TtsContext";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";

interface AudioPlayerProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioPlayer({ isVisible = true, onClose }: AudioPlayerProps) {
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
  const displayCurrentTime = isGaplessStreaming ? streamingCurrentTime : currentTime;
  const displayDuration = isGaplessStreaming ? streamingDuration : duration;
  const [volume, setVolume] = useState(settings.volume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const getVoiceName = (voiceId: string) => {
    if (voiceId.startsWith(CUSTOM_MODEL_PREFIX)) {
      const id = voiceId.slice(CUSTOM_MODEL_PREFIX.length);
      const custom = config.customModels.find((m) => m.id === id);
      return (custom?.name ?? voiceId).replace(" (custom)", "");
    }
    // Custom-only mode: built-in voices removed
    return voiceId;
  };

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
  }, [streamingState, streamingDuration, isLooping, setStatus, setStreamingState]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.speed;
    }
  }, [settings.speed]);

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
  }, [status, setStatus, streamingState, setStreamingState, streamingDuration, pausedStreaming, pauseStreaming, resumeStreaming, gaplessPlayer]);

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
    [displayDuration, isGaplessStreaming]
  );

  const handleSkip = useCallback(
    (seconds: number) => {
      if (isGaplessStreaming) return; // Gapless: cannot seek
      if (audioRef.current) {
        const newTime = Math.max(
          0,
          Math.min(displayDuration, audioRef.current.currentTime + seconds)
        );
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    },
    [displayDuration, isGaplessStreaming]
  );

  /** Index of nowPlaying in history, or -1 */
  const currentIndex = nowPlaying && history.length > 0
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
  }, [history, currentIndex, setNowPlaying, setCurrentAudio, setStatus, handleSkip]);

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
  }, [history, currentIndex, setNowPlaying, setCurrentAudio, setStatus, handleSkip]);

  const handleShuffle = useCallback(() => {
    if (history.length === 0) return;
    const randomIndex = Math.floor(Math.random() * history.length);
    const item = history[randomIndex]!;
    setNowPlaying(item);
    setCurrentAudio(null, item.audioUrl);
    setStatus("playing");
    setCurrentTime(0);
  }, [history, setNowPlaying, setCurrentAudio, setStatus]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setSettings({ volume: newVolume });
  }, [setSettings]);

  const handleSpeedChange = useCallback((speed: number) => {
    setSettings({ speed });
  }, [setSettings]);

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
    link.download = `genvoice-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentAudio, currentAudioUrl]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentAudioUrl || !isVisible) return null;

  const progressPercent =
    displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0;
  const voiceIdForDisplay = nowPlaying?.voice ?? settings.voice;
  const title =
    (nowPlaying?.text ?? "").trim().slice(0, 48) ||
    "TTS Audio";
  const speedForDisplay = nowPlaying?.speed ?? settings.speed;
  const subtitleParts = [
    `Giọng ${getVoiceName(voiceIdForDisplay)}`,
    `${speedForDisplay.toFixed(2).replace(/\.00$/, "")}x`,
  ];
  const subtitle = subtitleParts.join(" • ");

  return (
    <footer className="bg-card/95 backdrop-blur-xl border-t border-primary/10 px-3 sm:px-6 py-3 z-50 fixed bottom-0 left-0 right-0 lg:left-64 animate-fade-up">
      <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />

      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Left: Track Info */}
        <div className="col-span-12 sm:col-span-4 xl:col-span-3 flex items-center gap-3 min-w-0">
          <div className="size-12 sm:size-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
            <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold truncate text-foreground text-sm sm:text-base">{title}</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Controls + Progress */}
        <div className="col-span-12 sm:col-span-5 xl:col-span-6 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <button
              onClick={handleShuffle}
              className="hidden sm:inline-flex text-muted-foreground hover:text-primary transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Phát ngẫu nhiên"
              disabled={history.length === 0}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={handlePreviousTrack}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Bài trước / Lùi 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
              aria-label={status === "playing" && !pausedStreaming ? "Tạm dừng" : "Phát"}
            >
              {status === "playing" && !pausedStreaming ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />
              )}
            </button>
            <button
              onClick={handleNextTrack}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Bài sau / Tiến 30s"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={cn(
                "hidden sm:inline-flex text-muted-foreground hover:text-primary transition-colors p-2",
                isLooping && "text-primary"
              )}
              aria-label="Lặp"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3 sm:gap-4">
            <span className="text-[10px] font-mono font-bold text-muted-foreground w-10 text-right">
              {formatTime(displayCurrentTime)}
            </span>
            <div 
              ref={progressRef}
              className="flex-1 h-2 bg-black/15 dark:bg-slate-800 rounded-full relative cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all group-hover:brightness-110"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Thumb */}
              <div 
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-opacity",
                  progressPercent > 0 && progressPercent < 100 ? "opacity-100" : "opacity-0",
                  "group-hover:opacity-100"
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
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Thanh tiến trình"
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground w-10">
              {formatTime(displayDuration)}
            </span>
          </div>
        </div>

        {/* Right: Extra Controls */}
        <div className="col-span-12 sm:col-span-3 xl:col-span-3 flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="hidden xl:inline text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Tốc độ</span>
            <select
              value={settings.speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-muted/80 border border-border/50 rounded-xl text-xs font-bold py-1.5 px-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-muted"
              aria-label="Tốc độ phát"
            >
              {SPEED_OPTIONS.map((speed) => (
                <option key={speed} value={speed}>{speed}x</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Volume Button - always visible */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label={isMuted ? "Bật âm" : "Tắt âm"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {/* Volume Slider - visible on sm+ screens */}
            <div className="hidden sm:flex items-center gap-2 w-24">
              <div className="flex-1 h-1.5 bg-black/15 dark:bg-slate-800 rounded-full overflow-hidden relative group">
                <div
                  className="bg-muted-foreground/70 h-full transition-all group-hover:bg-foreground"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Âm lượng"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-xl"
            aria-label="Tải xuống"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
