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
      const newBlob = new Blob(["new audio"], { type: "audio/wav" });
      // Vitest setup mocks createObjectURL to the same value — use distinct blob URLs
      const oldUrl = "blob:http://localhost/old-track";
      const newUrl = "blob:http://localhost/new-track";

      useTtsStore.setState({ currentAudio: oldBlob, currentAudioUrl: oldUrl });

      useTtsStore.getState().setCurrentAudio(newBlob, newUrl);

      expect(revokeBlobUrl).toHaveBeenCalledWith(oldUrl);
    });

    it("does not revoke old URL when that URL is still referenced in history", () => {
      const oldBlob = new Blob(["old"], { type: "audio/wav" });
      const newBlob = new Blob(["new"], { type: "audio/wav" });
      const oldUrl = "blob:http://localhost/retained";
      const newUrl = "blob:http://localhost/other";

      useTtsStore.setState({
        currentAudio: oldBlob,
        currentAudioUrl: oldUrl,
        history: [
          {
            id: "1",
            text: "t",
            model: "vi_VN-vais1000-medium",
            voice: "vi_VN-vais1000-medium",
            speed: 1,
            audioUrl: oldUrl,
            duration: 1,
            createdAt: Date.now(),
          },
        ],
      });

      useTtsStore.getState().setCurrentAudio(newBlob, newUrl);

      expect(revokeBlobUrl).not.toHaveBeenCalledWith(oldUrl);
    });

    it("does not revoke when re-setting the same blob URL", () => {
      const blob = new Blob(["x"], { type: "audio/wav" });
      const url = "blob:http://localhost/same";
      useTtsStore.setState({ currentAudio: blob, currentAudioUrl: url });
      vi.clearAllMocks();

      useTtsStore.getState().setCurrentAudio(blob, url);

      expect(revokeBlobUrl).not.toHaveBeenCalled();
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
      const url = "blob:http://localhost/current";
      const nowPlayingUrl = "blob:http://localhost/now-playing";

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

    it("does not revoke URLs that are still referenced in history", () => {
      const blob = new Blob(["audio"], { type: "audio/wav" });
      const sharedUrl = "blob:http://localhost/shared-with-history";

      useTtsStore.setState({
        currentAudio: blob,
        currentAudioUrl: sharedUrl,
        nowPlaying: {
          id: "1",
          text: "test",
          model: "vi_VN-vais1000-medium",
          voice: "vi_VN-vais1000-medium",
          speed: 1,
          audioUrl: sharedUrl,
          duration: 1,
          createdAt: Date.now(),
        },
        history: [
          {
            id: "1",
            text: "test",
            model: "vi_VN-vais1000-medium",
            voice: "vi_VN-vais1000-medium",
            speed: 1,
            audioUrl: sharedUrl,
            duration: 1,
            createdAt: Date.now(),
          },
        ],
      });

      useTtsStore.getState().reset();

      expect(revokeBlobUrl).not.toHaveBeenCalledWith(sharedUrl);
    });
  });

  describe("clearHistory", () => {
    it("revokes blob URLs when clearing history", () => {
      const blob = new Blob(["audio"], { type: "audio/wav" });
      const url1 = "blob:http://localhost/h1";
      const url2 = "blob:http://localhost/h2";

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
      const url = "blob:http://localhost/remove-me";

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
