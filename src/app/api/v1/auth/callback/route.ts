/**
 * OAuth Callback – redirect tới trang client /auth/callback.
 *
 * Genation redirect URI: .../api/v1/auth/callback
 * - 302 là ĐÚNG (redirect), không phải lỗi.
 * - Local: 302 → /auth/callback → client gọi handleCallback (nếu 400 thì do token exchange, xem redirect_uri + secret).
 * - Production: dùng edge runtime (Cloudflare Pages yêu cầu).
 *
 * Route: /api/v1/auth/callback
 */

export const runtime = "edge";

const FALLBACK_ORIGIN = "https://app-gen-voice-ai.pages.dev";

export function GET(request: Request): Response {
  const url = request.url || "";
  const qIndex = url.indexOf("?");
  const search = qIndex >= 0 ? url.slice(qIndex) : "";

  let origin = FALLBACK_ORIGIN;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const slashAfterScheme = url.indexOf("/", 8);
    if (slashAfterScheme > 0) {
      origin = url.slice(0, slashAfterScheme);
    }
  }

  const location = origin + "/auth/callback" + search;

  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}
