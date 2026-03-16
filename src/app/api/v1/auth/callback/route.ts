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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientCallbackUrl = new URL("/auth/callback", url.origin);
  clientCallbackUrl.search = url.search;
  return NextResponse.redirect(clientCallbackUrl.toString(), 302);
}
