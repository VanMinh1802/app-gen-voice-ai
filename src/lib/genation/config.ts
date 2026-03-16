/**
 * Genation SDK Configuration
 *
 * From G-Store -> App Information. Secret may be used client-side per product decision.
 *
 * Env vars:
 * - NEXT_PUBLIC_GENATION_CLIENT_ID (required)
 * - GENATION_CLIENT_SECRET or NEXT_PUBLIC_GENATION_CLIENT_SECRET (client-side ok)
 * - NEXT_PUBLIC_GENATION_REDIRECT_URI (optional; defaults to origin + /api/auth/callback)
 */

export const genationConfig = {
  clientId: process.env.NEXT_PUBLIC_GENATION_CLIENT_ID || "",
  clientSecret:
    process.env.GENATION_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_GENATION_CLIENT_SECRET ||
    "",
  redirectUri:
    process.env.NEXT_PUBLIC_GENATION_REDIRECT_URI ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback`
      : "http://localhost:3000/api/auth/callback"),
} as const;

/**
 * Check if Genation SDK is configured
 */
export function isGenationConfigured(): boolean {
  return !!genationConfig.clientId && !!genationConfig.clientSecret;
}

/**
 * Get redirect URI based on environment
 */
export function getRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth/callback`;
  }
  return genationConfig.redirectUri;
}
