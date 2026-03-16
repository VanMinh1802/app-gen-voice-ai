/**
 * OAuth Callback – redirect tới trang client /auth/callback.
 *
 * Genation redirect URI vẫn đăng ký: .../api/v1/auth/callback
 * Route này chỉ 302 sang /auth/callback?code=...&state=... để xử lý trên client (tránh 500 trên Edge).
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

import { NextResponse } from "next/server";

function getOrigin(request: Request): string {
  try {
    const u = request.url;
    if (u && typeof u === "string") {
      const parsed = new URL(u);
      if (parsed.origin) return parsed.origin;
    }
  } catch {
    // fallback to Host header
  }
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto === "https" ? "https" : "http"}://${host}`;
  return "https://app-gen-voice-ai.pages.dev";
}

export async function GET(request: Request) {
  try {
    const origin = getOrigin(request);
    const url = request.url;
    const search = url && typeof url === "string" ? new URL(url).search : "";
    const clientCallbackUrl = `${origin}/auth/callback${search || ""}`;
    return NextResponse.redirect(clientCallbackUrl, 302);
  } catch (err) {
    console.error("[api/v1/auth/callback]", err);
    let origin: string;
    try {
      origin = getOrigin(request);
    } catch {
      origin = "https://app-gen-voice-ai.pages.dev";
    }
    return NextResponse.redirect(`${origin}/?auth_error=true&message=Callback+failed`, 302);
  }
}
