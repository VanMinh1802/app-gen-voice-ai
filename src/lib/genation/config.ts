/**
 * Genation SDK Configuration
 *
 * From G-Store -> App Information. Secret may be used client-side per product decision.
 *
 * Env vars:
 * - NEXT_PUBLIC_GENATION_CLIENT_ID (required)
 * - GENATION_CLIENT_SECRET or NEXT_PUBLIC_GENATION_CLIENT_SECRET (client-side ok)
 * - NEXT_PUBLIC_GENATION_REDIRECT_URI (optional; default /api/v1/auth/callback – phải khớp với G-Store)
 *
 * Luồng: Đăng nhập (OAuth) trước → có session → sau đó check license (getLicenses / checkProAccess).
 * Đăng ký / quản lý tài khoản qua Genation; license do G-Store quản lý (mua/redeem).
 *
 * On Cloudflare Pages (Edge), process.env may be empty; vars are in request context.
 */

import { getCloudflareEnv } from "@/lib/cloudflare-env";

/** Redirect path đăng ký trên G-Store; đổi thì phải cập nhật Redirect URIs trong G-Store. */
export const GENATION_REDIRECT_PATH = "/auth/callback";

function defaultRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${GENATION_REDIRECT_PATH}`;
  }
  return "http://localhost:3000" + GENATION_REDIRECT_PATH;
}

export const genationConfig = {
  clientId: process.env.NEXT_PUBLIC_GENATION_CLIENT_ID || "",
  clientSecret:
    process.env.GENATION_CLIENT_SECRET ||
    process.env.NEXT_PUBLIC_GENATION_CLIENT_SECRET ||
    "",
  redirectUri:
    process.env.NEXT_PUBLIC_GENATION_REDIRECT_URI || defaultRedirectUri(),
} as const;

/** Runtime config: Cloudflare Edge env first, then process.env (for callback route). */
export function getGenationConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const cf = getCloudflareEnv();
  const clientId =
    (typeof cf?.NEXT_PUBLIC_GENATION_CLIENT_ID === "string"
      ? cf.NEXT_PUBLIC_GENATION_CLIENT_ID
      : "") || genationConfig.clientId || "";
  const clientSecret =
    (typeof cf?.GENATION_CLIENT_SECRET === "string"
      ? cf.GENATION_CLIENT_SECRET
      : "") ||
    (typeof cf?.NEXT_PUBLIC_GENATION_CLIENT_SECRET === "string"
      ? cf.NEXT_PUBLIC_GENATION_CLIENT_SECRET
      : "") ||
    genationConfig.clientSecret ||
    "";
  const redirectUri =
    (typeof cf?.NEXT_PUBLIC_GENATION_REDIRECT_URI === "string"
      ? cf.NEXT_PUBLIC_GENATION_REDIRECT_URI
      : "") ||
    genationConfig.redirectUri ||
    defaultRedirectUri();
  return { clientId, clientSecret, redirectUri };
}

/**
 * Check if Genation SDK is configured
 */
export function isGenationConfigured(): boolean {
  return !!genationConfig.clientId && !!genationConfig.clientSecret;
}

/**
 * Get redirect URI based on environment (phải khớp với Redirect URIs trong G-Store).
 */
export function getRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${GENATION_REDIRECT_PATH}`;
  }
  return genationConfig.redirectUri;
}
