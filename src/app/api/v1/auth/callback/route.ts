/**
 * OAuth Callback Handler (v1 path)
 *
 * Genation redirect URI đăng ký: .../api/v1/auth/callback
 * Trên Cloudflare Pages dùng getOptionalRequestContext().env để đọc biến (request-scoped).
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { NextResponse } from "next/server";
import { handleCallback, handleCallbackWithConfig } from "@/lib/genation";

function getConfigFromEnv(env: Record<string, unknown>): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} | null {
  const clientId =
    (typeof env.NEXT_PUBLIC_GENATION_CLIENT_ID === "string"
      ? env.NEXT_PUBLIC_GENATION_CLIENT_ID
      : "") || "";
  const clientSecret =
    (typeof env.GENATION_CLIENT_SECRET === "string"
      ? env.GENATION_CLIENT_SECRET
      : "") ||
    (typeof env.NEXT_PUBLIC_GENATION_CLIENT_SECRET === "string"
      ? env.NEXT_PUBLIC_GENATION_CLIENT_SECRET
      : "") ||
    "";
  const redirectUri =
    (typeof env.NEXT_PUBLIC_GENATION_REDIRECT_URI === "string"
      ? env.NEXT_PUBLIC_GENATION_REDIRECT_URI
      : "") || "";
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: redirectUri || "https://app-gen-voice-ai.pages.dev/api/v1/auth/callback",
  };
}

export async function GET(request: Request) {
  const url = request.url;
  const searchParams = new URL(url).searchParams;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  try {
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL("/?auth_error=true&message=" + encodeURIComponent(errorDescription || error), url)
      );
    }

    if (!code || !state) {
      console.error("Missing code or state in callback");
      return NextResponse.redirect(
        new URL("/?auth_error=true&message=Missing authorization code", url)
      );
    }

    const ctx = getOptionalRequestContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const config = env ? getConfigFromEnv(env) : null;

    if (config) {
      await handleCallbackWithConfig(url, config);
    } else {
      await handleCallback(url);
    }

    return NextResponse.redirect(new URL("/?signed_in=true", url));
  } catch (err) {
    console.error("Callback error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL("/?auth_error=true&message=" + encodeURIComponent(errorMessage), request.url)
    );
  }
}
