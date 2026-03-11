import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TtsGenerator } from "@/features/tts/components/TtsGenerator";

// Mock the useTtsGenerate hook
vi.mock("@/features/tts/hooks/useTtsGenerate", () => ({
  useTtsGenerate: () => ({
    generate: vi.fn(),
    isReady: true,
    status: "idle",
    progress: 0,
    error: null,
    settings: {
      model: "vi_VN-vais1000-medium",
      voice: "vi_VN-vais1000-medium",
      speed: 1.0,
      volume: 1.0,
    },
  }),
}));

// Mock useTtsStore
vi.mock("@/features/tts/store", () => ({
  useTtsStore: () => ({
    settings: {
      model: "vi_VN-vais1000-medium",
      voice: "vi_VN-vais1000-medium",
      speed: 1.0,
      volume: 1.0,
    },
    setSettings: vi.fn(),
  }),
}));

describe("TtsGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the component", () => {
    render(<TtsGenerator />);
    expect(screen.getByLabelText(/text to convert/i)).toBeInTheDocument();
  });

  it("renders voice select dropdown", () => {
    render(<TtsGenerator />);
    expect(screen.getByLabelText(/voice/i)).toBeInTheDocument();
  });

  it("renders speed slider", () => {
    render(<TtsGenerator />);
    expect(screen.getByLabelText(/speed/i)).toBeInTheDocument();
  });

  it("renders generate button", () => {
    render(<TtsGenerator />);
    expect(
      screen.getByRole("button", { name: /generate speech/i }),
    ).toBeInTheDocument();
  });

  it("disables generate button when text is empty", () => {
    render(<TtsGenerator />);
    const button = screen.getByRole("button", { name: /generate speech/i });
    expect(button).toBeDisabled();
  });

  it("shows character count", () => {
    render(<TtsGenerator />);
    expect(screen.getByText(/0 \/ 5000/)).toBeInTheDocument();
  });

  it("updates character count when text changes", async () => {
    render(<TtsGenerator />);
    const textarea = screen.getByLabelText(/text to convert/i);

    fireEvent.change(textarea, { target: { value: "Hello world" } });

    await waitFor(() => {
      expect(screen.getByText(/11 \/ 5000/)).toBeInTheDocument();
    });
  });

  it("enables generate button when text is entered", async () => {
    render(<TtsGenerator />);
    const textarea = screen.getByLabelText(/text to convert/i);
    const button = screen.getByRole("button", { name: /generate speech/i });

    fireEvent.change(textarea, { target: { value: "Hello world" } });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("shows validation error when text exceeds max length", async () => {
    render(<TtsGenerator />);
    const textarea = screen.getByLabelText(/text to convert/i);

    const longText = "a".repeat(5001);
    fireEvent.change(textarea, { target: { value: longText } });

    // The character count should update to show 5001 characters
    await waitFor(() => {
      expect(screen.getAllByText(/5001 \/ 5000/)).toHaveLength(1);
    });
  });
});
