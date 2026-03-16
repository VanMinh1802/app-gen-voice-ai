import { useCallback, useRef, useEffect, useState } from "react";
import { useTtsStore } from "../store";
import { normalizeVietnamese } from "@/lib/text-processing/vietnameseNormalizer";
import type { TtsWorkerOutgoingMessage, TtsHistoryItem } from "../types";
import { CUSTOM_MODEL_PREFIX } from "@/config";
import { getR2PublicUrl, loadR2Config } from "@/lib/config/r2Config";
import { getVoiceSampleUrl } from "@/lib/piper/piperR2";

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
  } = useTtsStore();

  const handleAudioCompleteRef = useRef<((audioArrayBuffer: ArrayBuffer, duration: number) => void) | null>(null);
  const isPreviewRef = useRef(false);
  const previewVoiceIdRef = useRef<string>("");

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
    },
    [settings, setCurrentAudio, addToHistory, setNowPlaying, setStatus, setProgress]
  );

  handleAudioCompleteRef.current = handleAudioComplete;

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
            case "complete":
              // loadModel gửi complete với audio rỗng, duration 0 — bỏ qua
              if (message.audio.byteLength > 0 && message.duration > 0) {
                handleAudioCompleteRef.current?.(message.audio, message.duration);
              }
              break;
            case "error":
              setPreviewingVoiceId(null);
              setError(toFriendlyErrorMessage(message.error));
              setStatus("error");
              break;
          }
        };

        workerRef.current.onerror = () => {
          setError("Không tải được công cụ TTS. Vui lòng tải lại trang.");
          setStatus("error");
          setIsWorkerReady(true); // Hiện form + lỗi, không kẹt spinner
        };

        // Nếu sau 12s vẫn chưa có workerReady (lỗi script/network), bỏ spinner
        fallbackTimeoutRef.current = window.setTimeout(() => {
          setIsWorkerReady((ready) => {
            if (ready) return ready;
            setError("Khởi tạo quá lâu. Vui lòng tải lại trang.");
            setStatus("error");
            return true;
          });
        }, 12000);
      } catch (err) {
        console.error("Failed to create worker:", err);
        setError("Không tải được công cụ TTS. Vui lòng tải lại trang.");
        setStatus("error");
        setIsWorkerReady(true);
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
  }, [setError, setProgress, setStatus]);

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
    [isWorkerReady, settings, setError, reset, setStatus, setProgress]
  );

  const stop = useCallback(() => {
    // Just reset state, keep worker alive for reuse (model stays cached)
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "terminate" });
    }
    reset();
  }, [reset]);

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
      console.warn("Worker not ready for preload");
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
    terminateWorker,
    preloadModel,
    previewVoice,
    previewingVoiceId,
    isReady: isWorkerReady,
    nowPlaying,
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
