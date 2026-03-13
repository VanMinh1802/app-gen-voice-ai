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
    currentAudio,
    nowPlaying,
    history,
    setNowPlaying,
  } = useTtsStore();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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
    const handleEnded = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        setStatus("idle");
        setCurrentTime(0);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setStatus, isLooping, isDragging]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (!audioRef.current || !currentAudioUrl) return;

    if (status === "playing") {
      audioRef.current.play().catch(() => setStatus("idle"));
    } else {
      audioRef.current.pause();
    }
  }, [status, currentAudioUrl, setStatus]);

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
    if (status === "playing") {
      setStatus("idle");
    } else {
      setStatus("playing");
    }
  }, [status, setStatus]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleSkip = useCallback((seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setSettings({ volume: newVolume });
  }, [setSettings]);

  const handleSpeedChange = useCallback((speed: number) => {
    setSettings({ speed });
  }, [setSettings]);

  const handleDownload = useCallback(() => {
    if (!currentAudio) return;
    const url = URL.createObjectURL(currentAudio);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vietvoice-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentAudio]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentAudioUrl || !isVisible) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
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
          <div className="size-12 sm:size-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#2563eb] flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
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
            <button className="hidden sm:inline-flex text-muted-foreground hover:text-primary transition-colors p-2" aria-label="Shuffle">
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSkip(-10)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Lùi 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#2563eb] text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
              aria-label={status === "playing" ? "Tạm dừng" : "Phát"}
            >
              {status === "playing" ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-1" />
              )}
            </button>
            <button
              onClick={() => handleSkip(30)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Tiến 30s"
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
              {formatTime(currentTime)}
            </span>
            <div 
              ref={progressRef}
              className="flex-1 h-2 bg-slate-800 rounded-full relative cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#7c3aed] to-[#2563eb] rounded-full transition-all group-hover:from-[#8b5cf6] group-hover:to-[#3b82f6]"
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
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Thanh tiến trình"
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground w-10">
              {formatTime(duration)}
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
              className="bg-muted/80 border border-border/50 rounded-xl text-xs font-bold py-1.5 px-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:bg-slate-700"
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
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative group">
                <div
                  className="bg-slate-400 h-full transition-all group-hover:bg-white"
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
