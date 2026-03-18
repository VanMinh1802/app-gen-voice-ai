import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTtsStore } from "@/features/tts/store";

// Mock the blobUrl module
vi.mock("@/lib/storage/blobUrl", () => ({
  revokeBlobUrl: vi.fn(),
  createBlobUrl: vi.fn((blob) => URL.createObjectURL(blob)),
}));

import { revokeBlobUrl } from "@/lib/storage/blobUrl";

describe("ttsStore - blob URL management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useTtsStore.getState().reset();
    useTtsStore.setState({
      settings: {
        model: "vi_VN-vais1000-medium",
        voice: "vi_VN-vais1000-medium",
        speed: 1.0,
        volume: 1.0,
        pitch: 0,
        normalizeText: true,
      },
      status: "idle",
      progress: 0,
      currentAudio: null,
      currentAudioUrl: null,
      history: [],
      nowPlaying: null,
      error: null,
    });
  });

  describe("setCurrentAudio", () => {
    it("revokes old blob URL when setting new audio", () => {
      const oldBlob = new Blob(["old audio"], { type: "audio/wav" });
      const oldUrl = URL.createObjectURL(oldBlob);
      const newBlob = new Blob(["new audio"], { type: "audio/wav" });
      const newUrl = URL.createObjectURL(newBlob);

      useTtsStore.setState({ currentAudio: oldBlob, currentAudioUrl: oldUrl });
      
      useTtsStore.getState().setCurrentAudio(newBlob, newUrl);

      expect(revokeBlobUrl).toHaveBeenCalledWith(oldUrl);
    });

    it("does not fail when currentAudioUrl is null", () => {
      useTtsStore.setState({ currentAudio: null, currentAudioUrl: null });
      
      const newBlob = new Blob(["new audio"], { type: "audio/wav" });
      const newUrl = URL.createObjectURL(newBlob);

      expect(() => {
        useTtsStore.getState().setCurrentAudio(newBlob, newUrl);
      }).not.toThrow();
    });
  });

  describe("reset", () => {
    it("revokes blob URLs when resetting", () => {
      const blob = new Blob(["audio"], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const nowPlayingUrl = URL.createObjectURL(blob);

      useTtsStore.setState({
        currentAudio: blob,
        currentAudioUrl: url,
        nowPlaying: {
          id: "1",
          text: "test",
          model: "vi_VN-vais1000-medium",
          voice: "vi_VN-vais1000-medium",
          speed: 1,
          audioUrl: nowPlayingUrl,
          duration: 1,
          createdAt: Date.now(),
        },
      });

      useTtsStore.getState().reset();

      expect(revokeBlobUrl).toHaveBeenCalledWith(url);
      expect(revokeBlobUrl).toHaveBeenCalledWith(nowPlayingUrl);
    });
  });

  describe("clearHistory", () => {
    it("revokes blob URLs when clearing history", () => {
      const blob = new Blob(["audio"], { type: "audio/wav" });
      const url1 = URL.createObjectURL(blob);
      const url2 = URL.createObjectURL(blob);

      useTtsStore.setState({
        history: [
          {
            id: "1",
            text: "test 1",
            model: "vi_VN-vais1000-medium",
            voice: "vi_VN-vais1000-medium",
            speed: 1,
            audioUrl: url1,
            duration: 1,
            createdAt: Date.now(),
          },
          {
            id: "2",
            text: "test 2",
            model: "vi_VN-vais1000-medium",
            voice: "vi_VN-vais1000-medium",
            speed: 1,
            audioUrl: url2,
            duration: 1,
            createdAt: Date.now(),
          },
        ],
      });

      useTtsStore.getState().clearHistory();

      expect(revokeBlobUrl).toHaveBeenCalledWith(url1);
      expect(revokeBlobUrl).toHaveBeenCalledWith(url2);
    });
  });

  describe("removeFromHistory", () => {
    it("revokes blob URL when removing item not currently playing", () => {
      const blob = new Blob(["audio"], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      useTtsStore.setState({
        history: [
          {
            id: "1",
            text: "test",
            model: "vi_VN-vais1000-medium",
            voice: "vi_VN-vais1000-medium",
            speed: 1,
            audioUrl: url,
            duration: 1,
            createdAt: Date.now(),
          },
        ],
        nowPlaying: null,
      });

      useTtsStore.getState().removeFromHistory("1");

      expect(revokeBlobUrl).toHaveBeenCalledWith(url);
    });
  });
});
