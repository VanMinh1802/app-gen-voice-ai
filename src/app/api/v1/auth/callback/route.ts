/**
 * OAuth Callback – redirect tới trang client /auth/callback.
 *
 * Genation redirect URI: .../api/v1/auth/callback
 * - 302 là ĐÚNG (redirect), không phải lỗi.
 * - Local: 302 → /auth/callback → client gọi handleCallback (nếu 400 thì do token exchange, xem redirect_uri + secret).
 * - Production (Cloudflare): route tối giản để tránh 500 trên Edge.
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

const FALLBACK_ORIGIN = "https://app-gen-voice-ai.pages.dev";

/** Redirect 302 – Web API thuần, tương thích Cloudflare Workers. */
function redirect302(location: string): Response {
  const h = new Headers();
  h.set("Location", location);
  return new Response("", { status: 302, headers: h });
}

export async function GET(request: Request): Promise<Response> {
  let location = FALLBACK_ORIGIN + "/auth/callback";

  try {
    const url = String(request?.url ?? "");
    const qIndex = url.indexOf("?");
    const search = qIndex >= 0 ? url.substring(qIndex) : "";

    let origin = FALLBACK_ORIGIN;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const slashAfterScheme = url.indexOf("/", 8);
      if (slashAfterScheme > 0) {
        origin = url.substring(0, slashAfterScheme);
      }
    }
    if (origin === FALLBACK_ORIGIN && request?.headers) {
      const host = request.headers.get("host") ?? request.headers.get("x-forwarded-host") ?? "";
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      if (host) origin = (proto === "https" ? "https" : "http") + "://" + host;
    }

    location = origin + "/auth/callback" + search;
  } catch {
    location = FALLBACK_ORIGIN + "/?auth_error=true&message=Callback+failed";
  }

  return redirect302(location);
}
