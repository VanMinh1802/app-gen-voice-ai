import { useCallback, useRef, useEffect, useState } from "react";
import { useTtsStore } from "../store";
import type { TtsWorkerOutgoingMessage, TtsHistoryItem } from "../types";

export function useTtsGenerate() {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  const {
    settings,
    status,
    progress,
    currentAudio,
    currentAudioUrl,
    history,
    error,
    setStatus,
    setProgress,
    setCurrentAudio,
    addToHistory,
    setError,
    reset,
  } = useTtsStore();

  const handleAudioCompleteRef = useRef<((audioArrayBuffer: ArrayBuffer, duration: number) => void) | null>(null);

  const handleAudioComplete = useCallback(
    (audioArrayBuffer: ArrayBuffer, duration: number) => {
      const audioBlob = new Blob([audioArrayBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      setCurrentAudio(audioBlob, audioUrl);

      const historyItem: TtsHistoryItem = {
        id: crypto.randomUUID(),
        text: "",
        model: settings.model,
        voice: settings.voice,
        speed: settings.speed,
        audioUrl,
        duration,
        createdAt: Date.now(),
      };

      addToHistory(historyItem);
      setStatus("playing");
      setProgress(100);
    },
    [settings, setCurrentAudio, addToHistory, setStatus, setProgress]
  );

  handleAudioCompleteRef.current = handleAudioComplete;

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
            case "progress":
              setProgress(message.progress);
              break;
            case "complete":
              handleAudioCompleteRef.current?.(message.audio, message.duration);
              break;
            case "error":
              setError(toFriendlyErrorMessage(message.error));
              setStatus("error");
              break;
          }
        };

        workerRef.current.onerror = (error) => {
          console.error("Worker error:", error);
          setError("Failed to initialize TTS worker");
          setStatus("error");
        };

        setIsWorkerReady(true);
        setStatus("idle");
      } catch (err) {
        console.error("Failed to create worker:", err);
        setError("Failed to initialize TTS worker");
        setStatus("error");
      }
    };

    initWorker();

    return () => {
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

      workerRef.current.postMessage({
        type: "generate",
        payload: {
          text,
          model: settings.model,
          voice: settings.voice,
          speed: settings.speed,
        },
      });
    },
    [isWorkerReady, settings, setError, reset, setStatus, setProgress]
  );

  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsWorkerReady(false);
    }
    reset();
  }, [reset]);

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
    isReady: isWorkerReady,
  };
}

function toFriendlyErrorMessage(raw: string): string {
  if (/Entry not found|not valid JSON/i.test(raw)) {
    return "Voice or model data could not be loaded. The selected voice may be unavailable or the CDN returned an error.";
  }
  if (/network|fetch|Connection/i.test(raw)) {
    return "Unable to download voice model. Check your internet connection.";
  }
  if (/WASM|WebAssembly/i.test(raw)) {
    return "Your browser doesn't support WebAssembly. Please try a modern browser.";
  }
  return "An error occurred during speech synthesis. Please try again.";
}
