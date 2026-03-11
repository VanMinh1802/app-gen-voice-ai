import { describe, it, expect, beforeEach } from "vitest";
import { useTtsStore } from "@/features/tts/store";
import type { TtsHistoryItem } from "@/features/tts/types";

describe("ttsStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useTtsStore.getState().reset();
    useTtsStore.setState({
      settings: {
        model: "vi_VN-vais1000-medium",
        voice: "vi_VN-vais1000-medium",
        speed: 1.0,
        volume: 1.0,
      },
      status: "idle",
      progress: 0,
      currentAudio: null,
      currentAudioUrl: null,
      history: [],
      error: null,
    });
  });

  describe("initial state", () => {
    it("has idle status by default", () => {
      expect(useTtsStore.getState().status).toBe("idle");
    });

    it("has empty history by default", () => {
      expect(useTtsStore.getState().history).toEqual([]);
    });

    it("has no error by default", () => {
      expect(useTtsStore.getState().error).toBeNull();
    });
  });

  describe("setStatus", () => {
    it("sets status to loading", () => {
      useTtsStore.getState().setStatus("loading");
      expect(useTtsStore.getState().status).toBe("loading");
    });

    it("sets status to generating", () => {
      useTtsStore.getState().setStatus("generating");
      expect(useTtsStore.getState().status).toBe("generating");
    });

    it("sets status to playing", () => {
      useTtsStore.getState().setStatus("playing");
      expect(useTtsStore.getState().status).toBe("playing");
    });

    it("sets status to error", () => {
      useTtsStore.getState().setStatus("error");
      expect(useTtsStore.getState().status).toBe("error");
    });
  });

  describe("setSettings", () => {
    it("updates single setting", () => {
      useTtsStore.getState().setSettings({ speed: 1.5 });
      expect(useTtsStore.getState().settings.speed).toBe(1.5);
    });

    it("merges with existing settings", () => {
      useTtsStore.getState().setSettings({ speed: 1.5 });
      useTtsStore.getState().setSettings({ voice: "new-voice" });
      const { settings } = useTtsStore.getState();
      expect(settings.speed).toBe(1.5);
      expect(settings.voice).toBe("new-voice");
    });
  });

  describe("setProgress", () => {
    it("sets progress value", () => {
      useTtsStore.getState().setProgress(50);
      expect(useTtsStore.getState().progress).toBe(50);
    });

    it("accepts decimal values", () => {
      useTtsStore.getState().setProgress(33.5);
      expect(useTtsStore.getState().progress).toBe(33.5);
    });
  });

  describe("setError", () => {
    it("sets error message", () => {
      useTtsStore.getState().setError("Something went wrong");
      expect(useTtsStore.getState().error).toBe("Something went wrong");
    });

    it("sets status to error when error is set", () => {
      useTtsStore.getState().setStatus("generating");
      useTtsStore.getState().setError("Failed");
      expect(useTtsStore.getState().status).toBe("error");
    });

    it("clears error when null is passed", () => {
      useTtsStore.getState().setError("Failed");
      useTtsStore.getState().setError(null);
      expect(useTtsStore.getState().error).toBeNull();
    });
  });

  describe("history management", () => {
    const mockAudioBlob = new Blob(["mock"], { type: "audio/wav" });
    const mockHistoryItem: TtsHistoryItem = {
      id: "test-1",
      text: "Hello world",
      model: "vi_VN-vais1000-medium",
      voice: "vi_VN-vais1000-medium",
      speed: 1.0,
      audioUrl: "blob:http://localhost/test",
      duration: 2.5,
      createdAt: Date.now(),
    };

    it("adds item to history", () => {
      useTtsStore.getState().addToHistory(mockHistoryItem, mockAudioBlob);
      expect(useTtsStore.getState().history).toHaveLength(1);
      expect(useTtsStore.getState().history[0].id).toBe("test-1");
    });

    it("prepends new items to history", () => {
      const item1 = { ...mockHistoryItem, id: "1", createdAt: 1000 };
      const item2 = { ...mockHistoryItem, id: "2", createdAt: 2000 };
      useTtsStore.getState().addToHistory(item1, mockAudioBlob);
      useTtsStore.getState().addToHistory(item2, mockAudioBlob);
      const { history } = useTtsStore.getState();
      expect(history[0].id).toBe("2");
    });

    it("limits history to 50 items", () => {
      for (let i = 0; i < 60; i++) {
        useTtsStore.getState().addToHistory(
          { ...mockHistoryItem, id: String(i), createdAt: i },
          mockAudioBlob
        );
      }
      expect(useTtsStore.getState().history).toHaveLength(50);
    });

    it("removes item from history", () => {
      useTtsStore.getState().addToHistory(mockHistoryItem, mockAudioBlob);
      useTtsStore.getState().removeFromHistory("test-1");
      expect(useTtsStore.getState().history).toHaveLength(0);
    });

    it("clears all history", () => {
      useTtsStore.getState().addToHistory(mockHistoryItem, mockAudioBlob);
      useTtsStore.getState().clearHistory();
      expect(useTtsStore.getState().history).toHaveLength(0);
    });
  });

  describe("reset", () => {
    it("resets status to idle", () => {
      useTtsStore.getState().setStatus("playing");
      useTtsStore.getState().reset();
      expect(useTtsStore.getState().status).toBe("idle");
    });

    it("resets progress to 0", () => {
      useTtsStore.getState().setProgress(100);
      useTtsStore.getState().reset();
      expect(useTtsStore.getState().progress).toBe(0);
    });

    it("clears current audio", () => {
      useTtsStore.getState().setCurrentAudio(new Blob(), "blob:http://test");
      useTtsStore.getState().reset();
      expect(useTtsStore.getState().currentAudio).toBeNull();
      expect(useTtsStore.getState().currentAudioUrl).toBeNull();
    });

    it("clears error", () => {
      useTtsStore.getState().setError("Some error");
      useTtsStore.getState().reset();
      expect(useTtsStore.getState().error).toBeNull();
    });
  });
});
