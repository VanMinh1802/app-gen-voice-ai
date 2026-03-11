/** Prefix for custom model voice IDs (pre-trained .onnx from public/tts-model/vi/) */
export const CUSTOM_MODEL_PREFIX = "custom:";

/** Voice IDs must match PATH_MAP in @mintplex-labs/piper-tts-web (HuggingFace diffusionstudio/piper-voices) */
export const config = {
  tts: {
    maxTextLength: 5000,
    defaultModel: "vi_VN-vais1000-medium",
    defaultVoice: "vi_VN-vais1000-medium",
    defaultSpeed: 1.0,
    defaultVolume: 1.0,
    historyLimit: 50,
    /** Base URL for custom Piper models (no trailing slash). Place .onnx + .onnx.json in public/tts-model/vi/ */
    customModelBaseUrl: "/tts-model/vi",
  },
  storage: {
    settingsKey: "tts-settings",
    historyKey: "tts-history",
  },
  /** Custom models: add .onnx + .onnx.json to public/tts-model/vi/ and list id (filename without extension) here */
  customModels: [
    { id: "ngochuyen", name: "Ngọc Huyền (custom)" },
    { id: "banmai", name: "Ban Mai (custom)" },
    { id: "manhdung", name: "Mạnh Dũng (custom)" },
    { id: "minhquang", name: "Minh Quang (custom)" },
    { id: "duyoryx3175", name: "Duy Oryx (custom)" },
    { id: "maiphuong", name: "Mai Phương (custom)" },
    { id: "lacphi", name: "Lạc Phi (custom)" },
    { id: "minhkhang", name: "Minh Khang (custom)" },
    { id: "chieuthanh", name: "Chiếu Thành (custom)" },
    { id: "mytam2794", name: "Mỹ Tâm (custom)" },
  ],
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

export type VoiceId =
  | (typeof config.voices)[number]["id"]
  | `custom:${string}`;
