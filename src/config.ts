/** Prefix for custom model voice IDs (pre-trained .onnx from public/tts-model/vi/) */
export const CUSTOM_MODEL_PREFIX = "custom:";

/** Map voiceId (app) → tên thư mục R2 khi khác nhau (vd: mytam2 → mytam) */
export const VOICE_ID_TO_R2_FOLDER: Record<string, string> = {
  mytam2: "mytam",
  /** R2 folder: naminh (1 m) — must match bucket path vi/naminh_giong_tram/ */
  namminh: "naminh_giong_tram",
};

/** Map voiceId (app) → tên file .onnx khi khác với voiceId (vd: namminh → namminh_tram) */
export const VOICE_ID_TO_MODEL_FILE: Record<string, string> = {
  namminh: "namminh_tram",
};

export function getR2FolderForVoice(voiceId: string): string {
  return VOICE_ID_TO_R2_FOLDER[voiceId] ?? voiceId;
}

export function getModelFileName(voiceId: string): string {
  return VOICE_ID_TO_MODEL_FILE[voiceId] ?? `${voiceId}.onnx`;
}

/** Voice IDs must match PATH_MAP in @mintplex-labs/piper-tts-web (HuggingFace diffusionstudio/piper-voices) */
export const config = {
  tts: {
    maxTextLength: 5000,
    // Custom-only mode: default to first custom voice
    defaultModel: "custom:ngochuyen",
    defaultVoice: "custom:ngochuyen",
    defaultSpeed: 1.0,
    defaultVolume: 1.0,
    historyLimit: 50,
    /** Base URL for custom Piper models - use R2 API proxy */
    customModelBaseUrl: "/api/models",
  },
  /**
   * Streaming settings for TTS playback
   */
  streaming: {
    /** Minimum number of chunks to trigger streaming mode */
    minChunksForStreaming: 2,
    /** Approximate chars per chunk */
    charsPerChunk: 500,
    /** Buffer this many chunks before starting playback to prevent gaps */
    bufferChunks: 2,
  },
  /**
   * Free plan: only these 2 voices can be used for generation.
   * Others are previewable via sample, but generation requires Pro.
   */
  freeAllowedVoiceIds: ["manhdung", "ngochuyen"] as const,
  storage: {
    settingsKey: "tts-settings",
    historyKey: "tts-history",
  },
  /** IDs of voices that are currently available (have .onnx model in tts-model/vi/). Others show "Coming soon". */
  activeVoiceIds: [
    "anhkhoi",
    "banmai",
    "chieuthanh",
    "lacphi",
    "manhdung",
    "maiphuong",
    "minhkhang",
    "minhquang",
    "mytam2",
    "namminh",
    "ngocngan",
    "ngochuyen",
  ] as string[],
  /** Custom models: add .onnx + .onnx.json to public/tts-model/vi/ and list id (filename without extension) here */
  customModels: [
    { id: "ngochuyen", name: "Ngọc Huyền (custom)" },
    { id: "ngocngan", name: "Ngọc Ngạn (custom)" },
    { id: "namminh", name: "Nam Minh (custom)" },
    { id: "banmai", name: "Ban Mai (custom)" },
    { id: "manhdung", name: "Mạnh Dũng (custom)" },
    { id: "minhquang", name: "Minh Quang (custom)" },
    { id: "maiphuong", name: "Mai Phương (custom)" },
    { id: "lacphi", name: "Lạc Phi (custom)" },
    { id: "minhkhang", name: "Minh Khang (custom)" },
    { id: "chieuthanh", name: "Chiếu Thành (custom)" },
    { id: "mytam2", name: "Mỹ Tâm (custom)" },
    { id: "anhkhoi", name: "Anh Khôi (custom)" },
  ],
  // Built-in voices removed (custom-only)
  voices: [],
} as const;

/** Active voice IDs - exported separately for easier access */
export const activeVoiceIds = config.activeVoiceIds;

/** Popular voice IDs to show first */
export const popularVoiceIds: string[] = [
  "ngochuyen",
  "banmai",
  "manhdung",
  "minhquang",
  "maiphuong",
];

/** Voice ID type */
export type VoiceId =
  | (typeof config.voices)[number]["id"]
  | `custom:${string}`;

/** Calculate minimum text length for streaming: minChunks * charsPerChunk */
export const STREAMING_THRESHOLD_CHARS =
  config.streaming.minChunksForStreaming * config.streaming.charsPerChunk;
