"use client";

import React, { createContext, useContext } from "react";
import { useTtsGenerate } from "../hooks/useTtsGenerate";

type TtsContextValue = ReturnType<typeof useTtsGenerate>;

const TtsContext = createContext<TtsContextValue | null>(null);

/**
 * Provider that holds the TTS worker and state. Mount this at a level that
 * does not unmount when switching tabs (e.g. page layout) so generation
 * continues in the background when the user navigates away.
 */
export function TtsProvider({ children }: { children: React.ReactNode }) {
  const value = useTtsGenerate();
  return (
    <TtsContext.Provider value={value}>
      {children}
    </TtsContext.Provider>
  );
}

export function useTts(): TtsContextValue {
  const ctx = useContext(TtsContext);
  if (!ctx) {
    throw new Error("useTts must be used within a TtsProvider");
  }
  return ctx;
}
