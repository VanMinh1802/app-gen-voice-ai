/**
 * OAuth Callback – redirect tới trang client /auth/callback.
 *
 * Genation redirect URI: .../api/v1/auth/callback
 * Route này CHỈ trả 302 sang /auth/callback?code=...&state=... (client gọi handleCallback).
 * Luôn trả 302, không bao giờ 500 (tránh lỗi trên Cloudflare Edge).
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

const FALLBACK_ORIGIN = "https://app-gen-voice-ai.pages.dev";

/** Redirect 302 – chỉ dùng Response chuẩn, không dùng NextResponse. */
function redirect302(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: new Headers({ Location: location }),
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    let origin = FALLBACK_ORIGIN;
    let search = "";

    try {
      const url = request.url;
      if (url && typeof url === "string") {
        const i = url.indexOf("?");
        if (i >= 0) {
          search = url.slice(i);
        }
        if (url.startsWith("http")) {
          const end = url.indexOf("/", 8);
          origin = end > 0 ? url.slice(0, end) : url.split("?")[0] || FALLBACK_ORIGIN;
        }
      }
    } catch {
      // use fallbacks
    }

    if (!origin || origin === FALLBACK_ORIGIN) {
      try {
        const host = request.headers.get("host") || request.headers.get("x-forwarded-host") || "";
        const proto = request.headers.get("x-forwarded-proto") || "https";
        if (host) origin = (proto === "https" ? "https" : "http") + "://" + host;
      } catch {
        // keep FALLBACK_ORIGIN
      }
    }

    const location = origin + "/auth/callback" + search;
    return redirect302(location);
  } catch (_err) {
    return redirect302(FALLBACK_ORIGIN + "/?auth_error=true&message=Callback+failed");
  }
}
