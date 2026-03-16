/**
 * OAuth Callback Handler (v1 path)
 *
 * Genation redirect URI đăng ký: .../api/v1/auth/callback
 * Xử lý giống /api/auth/callback.
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

import { NextResponse } from "next/server";
import { handleCallback } from "@/lib/genation";

export async function GET(request: Request) {
  try {
    const url = request.url;
    const searchParams = new URL(url).searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

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

    await handleCallback(url);
    return NextResponse.redirect(new URL("/?signed_in=true", url));
  } catch (err) {
    console.error("Callback error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL("/?auth_error=true&message=" + encodeURIComponent(errorMessage), request.url)
    );
  }
}
