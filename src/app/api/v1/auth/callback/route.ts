/**
 * OAuth Callback – redirect tới trang client /auth/callback.
 *
 * Genation redirect URI vẫn đăng ký: .../api/v1/auth/callback
 * Route này chỉ 302 sang /auth/callback?code=...&state=... để xử lý trên client (tránh 500 trên Edge).
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

function getOrigin(request: Request): string {
  try {
    const u = request.url;
    if (u && typeof u === "string" && u.length > 0) {
      const parsed = new URL(u);
      if (parsed.origin) return parsed.origin;
    }
  } catch {
    // fallback to Host header
  }
  const host =
    request.headers.get("host") || request.headers.get("x-forwarded-host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto === "https" ? "https" : "http"}://${host}`;
  return "https://app-gen-voice-ai.pages.dev";
}

/** Redirect response (302) – dùng Response chuẩn để tránh lỗi trên Cloudflare Edge. */
function redirect302(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

export async function GET(request: Request) {
  let origin: string;
  try {
    origin = getOrigin(request);
  } catch {
    origin = "https://app-gen-voice-ai.pages.dev";
  }

  let search = "";
  try {
    const url = request.url;
    if (url && typeof url === "string" && url.length > 0) {
      const parsed = new URL(url);
      search = parsed.search || "";
    }
  } catch {
    // keep search empty
  }

  const clientCallbackUrl = `${origin}/auth/callback${search}`;
  return redirect302(clientCallbackUrl);
}
