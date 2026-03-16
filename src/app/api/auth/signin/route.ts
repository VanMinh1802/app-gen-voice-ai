/**
 * Sign In Handler
 *
 * Initiates OAuth flow with Genation.
 * Redirects user to Genation authorization page.
 *
 * Route: /api/auth/signin
 *
 * Trên Cloudflare Pages cần set env: NEXT_PUBLIC_GENATION_CLIENT_ID,
 * GENATION_CLIENT_SECRET, NEXT_PUBLIC_GENATION_REDIRECT_URI.
 */

export const runtime = "edge";

import { NextResponse } from "next/server";
import { signIn, isGenationConfigured } from "@/lib/genation";

function getOriginFromRequest(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.origin;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL || "https://app-gen-voice-ai.pages.dev";
  }
}

export async function GET(request: Request) {
  const origin = getOriginFromRequest(request);

  if (!isGenationConfigured()) {
    const msg =
      "Genation chưa cấu hình. Trên Cloudflare Pages hãy thêm Environment Variables: NEXT_PUBLIC_GENATION_CLIENT_ID, GENATION_CLIENT_SECRET, NEXT_PUBLIC_GENATION_REDIRECT_URI.";
    return NextResponse.redirect(
      new URL("/?auth_error=true&message=" + encodeURIComponent(msg), origin)
    );
  }

  try {
    const authUrl = await signIn();
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Sign in error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
    return NextResponse.redirect(
      new URL("/?auth_error=true&message=" + encodeURIComponent(errorMessage), origin)
    );
  }
}
