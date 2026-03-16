/**
 * Sign In Handler (fallback – ưu tiên dùng client-side signIn() trong app)
 *
 * Route: /api/auth/signin
 * Nếu ai đó mở trực tiếp hoặc link cũ, không dùng SDK trên Edge (dễ 500).
 * Redirect về trang chủ để đăng nhập bằng nút Đăng nhập (client-side).
 */

export const runtime = "edge";

import { NextResponse } from "next/server";

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
  // Không gọi Genation SDK trên Edge (có thể gây 500). Redirect về home;
  // user bấm "Đăng nhập" trên trang chủ sẽ dùng client-side signIn().
  return NextResponse.redirect(
    new URL(
      "/?auth_prompt=true&message=" + encodeURIComponent("Vui lòng bấm nút Đăng nhập trên trang để đăng nhập với Genation."),
      origin
    )
  );
}
