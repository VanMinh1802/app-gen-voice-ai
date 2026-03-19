import { useCallback, useRef, useEffect, useState } from "react";
import { useTtsStore } from "../store";
import { normalizeVietnamese } from "@/lib/text-processing/vietnameseNormalizer";
import type { TtsWorkerOutgoingMessage, TtsHistoryItem, TtsWorkerChunk } from "../types";
import { CUSTOM_MODEL_PREFIX, config } from "@/config";
import { getR2PublicUrl, loadR2Config } from "@/lib/config/r2Config";
import { getVoiceSampleUrl } from "@/lib/piper/piperR2";
import { getVoiceMetadata } from "@/config/voiceData";
import { notifyGenerationComplete, notifyGenerationError } from "@/lib/storage/notifications";
import { logger } from "@/lib/logger";
import { GaplessStreamingPlayer } from "@/lib/audio/gaplessStreamingPlayer";

/** Mẫu văn bản ngắn dùng cho preview giọng (không lưu lịch sử). */
const PREVIEW_SAMPLE_TEXT = "Xin chào, đây là giọng đọc mẫu.";

export function useTtsGenerate() {
  const workerRef = useRef<Worker | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const currentTextRef = useRef<string>("");
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const {
    settings,
    status,
    progress,
    currentAudio,
    currentAudioUrl,
    history,
    error,
    nowPlaying,
    setStatus,
    setProgress,
    setCurrentAudio,
    setNowPlaying,
    addToHistory,
    setError,
    reset,
    loadHistory,
    streamingState,
    setStreamingState,
    setStreamingProgress,
    setPausedStreaming,
  } = useTtsStore();

  const handleAudioCompleteRef = useRef<((audioArrayBuffer: ArrayBuffer, duration: number) => void) | null>(null);
  const isPreviewRef = useRef(false);
  const previewVoiceIdRef = useRef<string>("");

  /** Streaming state management */
  const chunkQueueRef = useRef<ArrayBuffer[]>([]);
  const isStreamingRef = useRef(false);
  const isCancelledRef = useRef(false);
  const pendingFullAudioRef = useRef<{ buffer: ArrayBuffer; duration: number } | null>(null);
  const onStreamingEndedRef = useRef<(() => void) | null>(null);
  /** Guard: only one playNextStreamingChunk per buffering transition (avoids double-pop in Strict Mode) */
  const isLoadingNextChunkRef = useRef(false);
  /** Gapless Web Audio player for streaming (no gaps between chunks) */
  const gaplessPlayerRef = useRef<GaplessStreamingPlayer | null>(null);

  const handleAudioComplete = useCallback(
    (audioArrayBuffer: ArrayBuffer, duration: number) => {
      const audioBlob = new Blob([audioArrayBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setCurrentAudio(audioBlob, audioUrl);

      if (isPreviewRef.current) {
        isPreviewRef.current = false;
        setPreviewingVoiceId(null);
        const voiceId = previewVoiceIdRef.current;
        const previewItem: TtsHistoryItem = {
          id: crypto.randomUUID(),
          text: PREVIEW_SAMPLE_TEXT,
          model: voiceId,
          voice: voiceId,
          speed: settings.speed,
          audioUrl,
          duration,
          createdAt: Date.now(),
        };
        setNowPlaying(previewItem);
        setStatus("playing");
        setProgress(100);
        return;
      }

      const historyItem: TtsHistoryItem = {
        id: crypto.randomUUID(),
        text: currentTextRef.current,
        model: settings.model,
        voice: settings.voice,
        speed: settings.speed,
        audioUrl,
        duration,
        createdAt: Date.now(),
      };
      addToHistory(historyItem, audioBlob);
      setNowPlaying(historyItem);
      setStatus("playing");
      setProgress(100);

      // Get voice name for notification
      const voiceId = settings.voice.startsWith(CUSTOM_MODEL_PREFIX)
        ? settings.voice.slice(CUSTOM_MODEL_PREFIX.length)
        : settings.voice;
      const voiceMeta = getVoiceMetadata(voiceId);
      const voiceName = voiceMeta?.name || "Unknown";
      notifyGenerationComplete(currentTextRef.current, voiceName);
    },
    [settings, setCurrentAudio, addToHistory, setNowPlaying, setStatus, setProgress]
  );

  handleAudioCompleteRef.current = handleAudioComplete;

  /**
   * Queue the next chunk into the store so AudioPlayer can play it.
   * AudioPlayer auto-plays when streamingState === "playing".
   */
  const playNextStreamingChunk = useCallback(() => {
    if (isCancelledRef.current) return;

    // Queue is empty — if we have the full audio, finalize; otherwise wait for more chunks
    if (chunkQueueRef.current.length === 0) {
      if (pendingFullAudioRef.current) {
        const pending = pendingFullAudioRef.current;
        const audioBlob = new Blob([pending.buffer], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);

        if (isPreviewRef.current) {
          isPreviewRef.current = false;
          setPreviewingVoiceId(null);
          const voiceId = previewVoiceIdRef.current;
          const previewItem: TtsHistoryItem = {
            id: crypto.randomUUID(),
            text: PREVIEW_SAMPLE_TEXT,
            model: voiceId,
            voice: voiceId,
            speed: settings.speed,
            audioUrl,
            duration: pending.duration,
            createdAt: Date.now(),
          };
          setCurrentAudio(audioBlob, audioUrl);
          setNowPlaying(previewItem);
          setStatus("playing");
          setProgress(100);
        } else {
          const historyItem: TtsHistoryItem = {
            id: crypto.randomUUID(),
            text: currentTextRef.current,
            model: settings.model,
            voice: settings.voice,
            speed: settings.speed,
            audioUrl,
            duration: pending.duration,
            createdAt: Date.now(),
          };
          setCurrentAudio(audioBlob, audioUrl);
          setNowPlaying(historyItem);
          setStatus("playing");
          setProgress(100);
          addToHistory(historyItem, audioBlob);
          const voiceId = settings.voice.startsWith(CUSTOM_MODEL_PREFIX)
            ? settings.voice.slice(CUSTOM_MODEL_PREFIX.length)
            : settings.voice;
          const voiceMeta = getVoiceMetadata(voiceId);
          const voiceName = voiceMeta?.name || "Unknown";
          notifyGenerationComplete(currentTextRef.current, voiceName);
        }

        setStreamingState("idle");
        isStreamingRef.current = false;
        pendingFullAudioRef.current = null;
      }
      isLoadingNextChunkRef.current = false;
      // else: no audio yet, wait for worker
      return;
    }

    // Pop next chunk from queue and put in store
    const chunk = chunkQueueRef.current.shift()!;
    const audioBlob = new Blob([chunk], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = 0;

    const item: TtsHistoryItem = {
      id: `streaming-${Date.now()}`,
      text: currentTextRef.current.slice(0, 80) + (currentTextRef.current.length > 80 ? "…" : ""),
      model: settings.model,
      voice: settings.voice,
      speed: settings.speed,
      audioUrl,
      duration,
      createdAt: Date.now(),
    };

    // Update store: chunk ready, tell AudioPlayer to play
    setCurrentAudio(audioBlob, audioUrl);
    setNowPlaying(item);
    setStreamingState("playing");
    setStatus("playing");
    isLoadingNextChunkRef.current = false;
  }, [settings, setCurrentAudio, setNowPlaying, setStatus, setProgress, setStreamingState, addToHistory]);

  /** Sync volume to gapless player when settings change during streaming */
  useEffect(() => {
    gaplessPlayerRef.current?.setVolume(settings.volume);
  }, [settings.volume]);

  /**
   * Respond to AudioPlayer's "chunk ended" signal (streamingState = "buffering").
   * Only used for non-gapless path; gapless uses Web Audio and does not set "buffering".
   */
  useEffect(() => {
    if (streamingState !== "buffering") return;
    if (!isStreamingRef.current) return;
    if (isLoadingNextChunkRef.current) return;
    isLoadingNextChunkRef.current = true;
    playNextStreamingChunk();
  }, [streamingState, playNextStreamingChunk]);

  /** Called when gapless playback has finished (all chunks played) or when queue was empty on complete */
  const finalizeStreaming = useCallback((fullAudioBuffer: ArrayBuffer, duration: number) => {
    if (isCancelledRef.current) return;

    const audioBlob = new Blob([fullAudioBuffer], { type: "audio/wav" });
    const audioUrl = URL.createObjectURL(audioBlob);

    if (isPreviewRef.current) {
      isPreviewRef.current = false;
      setPreviewingVoiceId(null);
      const voiceId = previewVoiceIdRef.current;
      const previewItem: TtsHistoryItem = {
        id: crypto.randomUUID(),
        text: PREVIEW_SAMPLE_TEXT,
        model: voiceId,
        voice: voiceId,
        speed: settings.speed,
        audioUrl,
        duration,
        createdAt: Date.now(),
      };
      setCurrentAudio(audioBlob, audioUrl);
      setNowPlaying(previewItem);
      setStatus("playing");
      setProgress(100);
    } else {
      const historyItem: TtsHistoryItem = {
        id: crypto.randomUUID(),
        text: currentTextRef.current,
        model: settings.model,
        voice: settings.voice,
        speed: settings.speed,
        audioUrl,
        duration,
        createdAt: Date.now(),
      };
      setCurrentAudio(audioBlob, audioUrl);
      setNowPlaying(historyItem);
      setStatus("playing");
      addToHistory(historyItem, audioBlob);
      const voiceId = settings.voice.startsWith(CUSTOM_MODEL_PREFIX)
        ? settings.voice.slice(CUSTOM_MODEL_PREFIX.length)
        : settings.voice;
      const voiceMeta = getVoiceMetadata(voiceId);
      const voiceName = voiceMeta?.name || "Unknown";
      notifyGenerationComplete(currentTextRef.current, voiceName);
    }

    setStreamingState("idle");
    isStreamingRef.current = false;
    pendingFullAudioRef.current = null;
    setStreamingProgress(0, 0);
    setPausedStreaming(false);
    gaplessPlayerRef.current?.stop();
    gaplessPlayerRef.current = null;
  }, [settings, setCurrentAudio, setNowPlaying, setStatus, setProgress, setStreamingState, setStreamingProgress, setPausedStreaming, addToHistory]);

  useEffect(() => {
    onStreamingEndedRef.current = () => {
      const p = pendingFullAudioRef.current;
      if (p) finalizeStreaming(p.buffer, p.duration);
    };
  }, [finalizeStreaming]);

  /** Handle incoming chunk from worker — gapless Web Audio playback (no gaps between chunks) */
  const handleChunkMessage = useCallback(
    async (chunk: TtsWorkerChunk) => {
      if (isCancelledRef.current) return;

      isStreamingRef.current = true;

      if (!gaplessPlayerRef.current) {
        gaplessPlayerRef.current = new GaplessStreamingPlayer({
          onProgress: setStreamingProgress,
          onStreamEnded: () => {
            onStreamingEndedRef.current?.();
          },
        });
        gaplessPlayerRef.current.setVolume(settings.volume);
        gaplessPlayerRef.current.setPlaybackRate(settings.speed);
        const audioBlob = new Blob([chunk.audio], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const item: TtsHistoryItem = {
          id: `streaming-${Date.now()}`,
          text: currentTextRef.current.slice(0, 80) + (currentTextRef.current.length > 80 ? "…" : ""),
          model: settings.model,
          voice: settings.voice,
          speed: settings.speed,
          audioUrl,
          duration: 0,
          createdAt: Date.now(),
        };
        setCurrentAudio(audioBlob, audioUrl);
        setNowPlaying(item);
        setStreamingState("playing");
        setStatus("playing");
      }

      try {
        await gaplessPlayerRef.current.scheduleChunk(chunk.audio);
      } catch (e) {
        logger.error("Gapless scheduleChunk failed", e);
      }
    },
    [
      settings,
      setCurrentAudio,
      setNowPlaying,
      setStatus,
      setStreamingState,
      setStreamingProgress,
    ]
  );

  useEffect(() => {
    const initWorker = async () => {
      if (workerRef.current) return;

      try {
        workerRef.current = new Worker(
          new URL("@/workers/tts-worker.ts", import.meta.url),
          { type: "module" }
        );

        workerRef.current.onmessage = (event: MessageEvent<TtsWorkerOutgoingMessage>) => {
          const message = event.data;

          switch (message.type) {
            case "workerReady":
              if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
                fallbackTimeoutRef.current = null;
              }
              setIsWorkerReady(true);
              setStatus("idle");
              // Gửi R2 URL trước, sau đó mới load model — tránh worker dùng /api/models (500)
              loadR2Config()
                .then(() => {
                  const url = getR2PublicUrl();
                  if (url && workerRef.current) {
                    workerRef.current.postMessage({
                      type: "setR2PublicUrl",
                      payload: url,
                    });
                  }
                  // Preload default voice model sau khi worker đã có R2 URL
                  if (workerRef.current) {
                    workerRef.current.postMessage({
                      type: "loadModel",
                      payload: { voice: "custom:ngochuyen" },
                    });
                  }
                })
                .catch(() => {
                  // Vẫn thử preload nếu r2-config.json lỗi (worker sẽ dùng /api/models)
                  if (workerRef.current) {
                    workerRef.current.postMessage({
                      type: "loadModel",
                      payload: { voice: "custom:ngochuyen" },
                    });
                  }
                });
              break;
            case "progress":
              setProgress(message.progress);
              break;
            case "chunk":
              void handleChunkMessage(message as TtsWorkerChunk).catch((e) =>
                logger.error("handleChunkMessage failed", e)
              );
              break;
            case "complete":
              // loadModel gửi complete với audio rỗng, duration 0 — bỏ qua
              if (message.audio.byteLength > 0 && message.duration > 0) {
                if (isStreamingRef.current) {
                  // Gapless: wait for playback to finish, then finalize in onStreamEnded
                  pendingFullAudioRef.current = { buffer: message.audio, duration: message.duration };
                  setProgress(100);
                  gaplessPlayerRef.current?.markComplete();
                } else {
                  handleAudioCompleteRef.current?.(message.audio, message.duration);
                }
              }
              break;
            case "error":
              // Reset streaming state on error
              setStreamingState("idle");
              setStreamingProgress(0, 0);
              setPausedStreaming(false);
              gaplessPlayerRef.current?.stop();
              gaplessPlayerRef.current = null;
              isStreamingRef.current = false;
              chunkQueueRef.current = [];
              isCancelledRef.current = true;

              setPreviewingVoiceId(null);
              setError(toFriendlyErrorMessage(message.error));
              setStatus("error");
              notifyGenerationError(toFriendlyErrorMessage(message.error));
              break;
          }
        };

        workerRef.current.onerror = () => {
          const errMsg = "Không tải được công cụ TTS. Vui lòng tải lại trang.";
          setError(errMsg);
          setStatus("error");
          setIsWorkerReady(true);
          notifyGenerationError(errMsg);
        };

        // Nếu sau 12s vẫn chưa có workerReady (lỗi script/network), bỏ spinner
        fallbackTimeoutRef.current = window.setTimeout(() => {
          setIsWorkerReady((ready) => {
            if (ready) return ready;
            const errorMsg = "Khởi tạo quá lâu. Vui lòng tải lại trang.";
            setError(errorMsg);
            setStatus("error");
            notifyGenerationError(errorMsg);
            return true;
          });
        }, 12000);
      } catch (err) {
        logger.error("Failed to create worker:", err);
        const errorMsg = "Không tải được công cụ TTS. Vui lòng tải lại trang.";
        setError(errorMsg);
        setStatus("error");
        setIsWorkerReady(true);
        notifyGenerationError(errorMsg);
      }
    };

    initWorker();

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setError, setProgress, setStatus, setStreamingProgress]);

  const generate = useCallback(
    (text: string) => {
      if (!workerRef.current || !isWorkerReady) {
        setError("TTS worker is not ready");
        return;
      }

      if (!text.trim()) {
        setError("Please enter some text to convert");
        return;
      }

      // Reset streaming state
      chunkQueueRef.current = [];
      isStreamingRef.current = false;
      isCancelledRef.current = false;
      pendingFullAudioRef.current = null;
      isLoadingNextChunkRef.current = false;
      setStreamingProgress(0, 0);
      setPausedStreaming(false);
      gaplessPlayerRef.current?.stop();
      gaplessPlayerRef.current = null;
      setStreamingState("idle");

      reset();
      setStatus("generating");
      setProgress(0);

      const textToGenerate = settings.normalizeText
        ? normalizeVietnamese(text)
        : text;

      currentTextRef.current = text;

      workerRef.current.postMessage({
        type: "generate",
        payload: {
          text: textToGenerate,
          model: settings.model,
          voice: settings.voice,
          speed: settings.speed,
          pitch: settings.pitch,
        },
      });
    },
    [isWorkerReady, settings, setError, reset, setStatus, setProgress, setStreamingState, setStreamingProgress, setPausedStreaming]
  );

  const stop = useCallback(() => {
    // Cancel any ongoing streaming
    setStreamingState("idle");
    setStreamingProgress(0, 0);
    setPausedStreaming(false);
    gaplessPlayerRef.current?.stop();
    gaplessPlayerRef.current = null;
    isCancelledRef.current = true;
    chunkQueueRef.current = [];
    isStreamingRef.current = false;
    isLoadingNextChunkRef.current = false;

    // Just reset state, keep worker alive for reuse (model stays cached)
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "terminate" });
    }
    reset();
  }, [reset, setStreamingState, setStreamingProgress, setPausedStreaming]);

  const terminateWorker = useCallback(() => {
    // Force terminate worker and clear cached model - use only when needed
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsWorkerReady(false);
    }
  }, []);

  const preloadModel = useCallback((voiceId?: string) => {
    // Preload a specific voice model (useful on app start)
    if (!workerRef.current || !isWorkerReady) {
      logger.warn("Worker not ready for preload");
      return;
    }
    const targetVoice = voiceId || settings.voice;
    workerRef.current.postMessage({
      type: "loadModel",
      payload: { voice: targetVoice },
    });
  }, [isWorkerReady, settings.voice]);

  /** Preview voice: plays sample.wav from R2 when available, else generates TTS with sample text. */
  const previewVoice = useCallback(
    async (voiceId: string, sampleText: string = PREVIEW_SAMPLE_TEXT) => {
      const normalizedId = voiceId.startsWith(CUSTOM_MODEL_PREFIX) ? voiceId : `${CUSTOM_MODEL_PREFIX}${voiceId}`;
      const modelName = normalizedId.startsWith(CUSTOM_MODEL_PREFIX) ? normalizedId.slice(CUSTOM_MODEL_PREFIX.length) : normalizedId;

      // Ưu tiên phát sample.wav từ R2 cho custom voice (nhanh, không cần generate)
      const sampleUrl = getVoiceSampleUrl(modelName);
      try {
        const res = await fetch(sampleUrl);
        if (res.ok) {
          const blob = await res.blob();
          const arrayBuffer = await blob.arrayBuffer();
          let duration = 0;
          try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
            duration = buf.duration;
          } catch {
            duration = 3;
          }
          const audioUrl = URL.createObjectURL(blob);
          setCurrentAudio(blob, audioUrl);
          setPreviewingVoiceId(null);
          const previewItem: TtsHistoryItem = {
            id: crypto.randomUUID(),
            text: PREVIEW_SAMPLE_TEXT,
            model: normalizedId,
            voice: normalizedId,
            speed: settings.speed,
            audioUrl,
            duration,
            createdAt: Date.now(),
          };
          setError(null);
          setNowPlaying(previewItem);
          setStatus("playing");
          setProgress(100);
          return;
        }
      } catch {
        // Fallback: generate TTS bằng worker
      }

      if (!workerRef.current || !isWorkerReady) {
        setError("TTS chưa sẵn sàng. Vui lòng thử lại sau.");
        return;
      }
      const textToGenerate = settings.normalizeText ? normalizeVietnamese(sampleText) : sampleText;
      isPreviewRef.current = true;
      previewVoiceIdRef.current = normalizedId;
      setPreviewingVoiceId(normalizedId);
      reset();
      setStatus("previewing");
      setProgress(0);
      workerRef.current.postMessage({
        type: "generate",
        payload: {
          text: textToGenerate,
          model: normalizedId,
          voice: normalizedId,
          speed: settings.speed,
          pitch: settings.pitch,
        },
      });
    },
    [isWorkerReady, settings, setError, reset, setStatus, setProgress, setCurrentAudio, setNowPlaying]
  );

  /** Toggle play/pause (used by AudioPlayer and GenerationSuccess inline control) */
  const togglePlay = useCallback(() => {
    const state = useTtsStore.getState();
    const { streamingDuration, pausedStreaming } = state;
    if (streamingDuration > 0) {
      if (pausedStreaming) {
        gaplessPlayerRef.current?.resume();
        useTtsStore.getState().resumeStreaming();
        setStatus("playing");
      } else {
        gaplessPlayerRef.current?.pause();
        useTtsStore.getState().pauseStreaming();
      }
      return;
    }
    if (state.status === "playing") {
      setStatus("idle");
    } else {
      useTtsStore.getState().setStreamingState("playing");
      setStatus("playing");
    }
  }, [setStatus]);

  return {
    settings,
    status,
    progress,
    currentAudio,
    currentAudioUrl,
    error,
    history,
    generate,
    stop,
    togglePlay,
    terminateWorker,
    preloadModel,
    previewVoice,
    previewingVoiceId,
    isReady: isWorkerReady,
    nowPlaying,
    gaplessPlayer: gaplessPlayerRef,
  };
}

function toFriendlyErrorMessage(raw: string): string {
  if (/Entry not found|not valid JSON|Unexpected token/i.test(raw)) {
    return "Không tải được giọng hoặc model. Vui lòng chọn giọng khác hoặc kiểm tra kết nối mạng.";
  }
  if (/network|fetch|Connection/i.test(raw)) {
    return "Unable to download voice model. Check your internet connection.";
  }
  if (/WASM|WebAssembly/i.test(raw)) {
    return "Your browser doesn't support WebAssembly. Please try a modern browser.";
  }
  return "An error occurred during speech synthesis. Please try again.";
}
