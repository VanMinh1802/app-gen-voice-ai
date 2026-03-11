/** Voice IDs must match PATH_MAP in @mintplex-labs/piper-tts-web (HuggingFace diffusionstudio/piper-voices) */
export const config = {
  tts: {
    maxTextLength: 5000,
    defaultModel: "vi_VN-vais1000-medium",
    defaultVoice: "vi_VN-vais1000-medium",
    defaultSpeed: 1.0,
    defaultVolume: 1.0,
    historyLimit: 50,
  },
  storage: {
    settingsKey: "tts-settings",
    historyKey: "tts-history",
  },
  voices: [
    {
      id: "vi_VN-vais1000-medium",
      name: "Vietnamese (Vais1000 - Medium)",
      language: "vi",
      gender: "female",
    },
    {
      id: "vi_VN-25hours_single-low",
      name: "Vietnamese (25hours - Low)",
      language: "vi",
      gender: "female",
    },
    {
      id: "vi_VN-vivos-x_low",
      name: "Vietnamese (Vivos - X Low)",
      language: "vi",
      gender: "female",
    },
    {
      id: "en_US-lessac-medium",
      name: "English (Lessac Medium)",
      language: "en",
      gender: "female",
    },
    {
      id: "en_US-lessac-low",
      name: "English (Lessac Low)",
      language: "en",
      gender: "male",
    },
  ],
} as const;

export type VoiceId = (typeof config.voices)[number]["id"];
