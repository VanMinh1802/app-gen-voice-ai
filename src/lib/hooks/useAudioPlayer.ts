"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";

interface UseAudioPlayerOptions {
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onLoaded?: (duration: number) => void;
  onError?: (error: Error) => void;
}

interface UseAudioPlayerReturn {
  audioContext: AudioContext | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  sourceNode: MediaElementAudioSourceNode | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  loadAudio: (url: string) => void;
}

/**
 * Web Audio API hook for enhanced audio playback
 * Provides better control over audio processing than HTMLAudioElement alone
 */
export function useAudioPlayer(options: UseAudioPlayerOptions = {}): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Connect audio element to Web Audio API
  const connectAudioSource = useCallback(() => {
    const audio = audioRef.current;
    const ctx = getAudioContext();
    
    if (!audio || !ctx) return null;

    // Disconnect previous source if exists
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }

    // Create new source node
    try {
      const source = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = source;

      // Create gain node for volume control
      if (!gainNodeRef.current) {
        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.connect(ctx.destination);
      }

      source.connect(gainNodeRef.current);
      return source;
    } catch (e) {
      // MediaElementSource might already be connected
      logger.warn("Audio source already connected:", e);
      return sourceNodeRef.current;
    }
  }, [getAudioContext]);

  // Load audio URL
  const loadAudio = useCallback((url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }

    const audio = audioRef.current;
    
    // Set up event listeners
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      options.onLoaded?.(audio.duration);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      options.onTimeUpdate?.(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      options.onEnded?.();
    };

    const onError = () => {
      setIsLoading(false);
      options.onError?.(new Error("Failed to load audio"));
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    // Clean up old listeners
    audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    audio.removeEventListener("timeupdate", onTimeUpdate);
    audio.removeEventListener("ended", onEnded);
    audio.removeEventListener("error", onError);
    audio.removeEventListener("canplay", onCanPlay);
    audio.removeEventListener("waiting", onWaiting);

    // Add new listeners
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("waiting", onWaiting);

    // Load the audio
    audio.src = url;
    audio.load();
    setIsLoading(true);
    setCurrentTime(0);
  }, [options]);

  // Play audio
  const play = useCallback(async () => {
    const audio = audioRef.current;
    const ctx = getAudioContext();
    
    if (!audio) return;

    // Resume audio context if suspended
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // Connect source on first play (required by Web Audio API)
    if (!sourceNodeRef.current) {
      connectAudioSource();
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      logger.error("Play error:", e);
      setIsPlaying(false);
    }
  }, [getAudioContext, connectAudioSource]);

  // Pause audio
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Seek to time
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Set volume
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);
    
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clampedVol;
    }
    
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : clampedVol;
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = newMuted ? 0 : volume;
      }
      return newMuted;
    });
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    audioContext: audioContextRef.current,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    sourceNode: sourceNodeRef.current,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    loadAudio,
  };
}
