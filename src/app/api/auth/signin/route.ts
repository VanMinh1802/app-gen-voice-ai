/**
 * Sign In Handler
 * 
 * Initiates OAuth flow with Genation.
 * Redirects user to Genation authorization page.
 * 
 * Route: /api/auth/signin
 */

export const runtime = "edge";

import { NextResponse } from "next/server";
import { signIn } from "@/lib/genation";

export async function GET() {
  try {
    const authUrl = await signIn();
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Sign in error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
    return NextResponse.redirect(
      new URL("/?auth_error=true&message=" + encodeURIComponent(errorMessage), 
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  }
}
