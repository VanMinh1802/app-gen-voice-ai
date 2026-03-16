/**
 * OAuth Callback Handler
 * 
 * Handles the callback from Genation after user signs in.
 * Exchanges authorization code for tokens and redirects to app.
 * 
 * Route: /api/auth/callback
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

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        new URL("/?auth_error=true&message=" + encodeURIComponent(errorDescription || error), url)
      );
    }

    // Missing authorization code
    if (!code || !state) {
      console.error("Missing code or state in callback");
      return NextResponse.redirect(
        new URL("/?auth_error=true&message=Missing authorization code", url)
      );
    }

    // Exchange code for tokens
    await handleCallback(url);

    // Redirect to app after successful login
    // The session is now stored in the client's localStorage via the SDK
    return NextResponse.redirect(new URL("/?signed_in=true", url));
  } catch (err) {
    console.error("Callback error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL("/?auth_error=true&message=" + encodeURIComponent(errorMessage), request.url)
    );
  }
}
