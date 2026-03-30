/**
 * Runtime config validation with Zod.
 * Ensures config values are within expected bounds at startup.
 */

import { z } from "zod";

const VoiceIdSchema = z.string().min(1);

const StreamingSchema = z.object({
  minChunksForStreaming: z.number().int().min(1),
  charsPerChunk: z.number().int().min(50).max(5000),
  bufferChunks: z.number().int().min(0),
});

const TtsSchema = z.object({
  maxTextLength: z.number().int().min(1).max(10000),
  defaultModel: z.string().min(1),
  defaultVoice: z.string().min(1),
  defaultSpeed: z.number().min(0.1).max(10),
  defaultVolume: z.number().min(0).max(1),
  historyLimit: z.number().int().min(0).max(1000),
  customModelBaseUrl: z.string().url().or(z.string().startsWith("/")),
});

const StorageSchema = z.object({
  settingsKey: z.string().min(1),
  historyKey: z.string().min(1),
});

export const ConfigSchema = z.object({
  /** Sidebar plan card, settings "Gói đăng ký" tab, /pricing page, upgrade CTAs */
  showSubscriptionUi: z.boolean(),
  tts: TtsSchema,
  streaming: StreamingSchema,
  freeAllowedVoiceIds: z.array(z.string()),
  storage: StorageSchema,
  activeVoiceIds: z.array(z.string()).min(1),
  customModels: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
      }),
    )
    .min(1),
  voices: z.array(z.unknown()),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Validate the runtime config and return issues (does not throw).
 * Call this at module initialization time.
 *
 * @param config - The raw config object to validate
 * @returns Array of validation issues, empty if valid
 */
export function validateConfig(
  config: unknown,
): { issues: z.ZodIssue[]; config: Config | null } {
  const result = ConfigSchema.safeParse(config);
  if (result.success) {
    return { issues: [], config: result.data };
  }
  return { issues: result.error.issues, config: null };
}
