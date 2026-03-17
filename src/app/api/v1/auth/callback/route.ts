/**
 * OAuth Callback – redirect to client page with query params preserved.
 *
 * Genation redirect URI: .../api/v1/auth/callback?code=xxx&state=yyy
 * - This edge route just redirects to /auth/callback with the same params
 * - The client-side /auth/callback page handles the actual token exchange
 *
 * Why this works:
 * - Minimal edge function - just redirects, no SDK usage
 * - Avoids async_hooks issues that come from bundling Node.js code
 * - Token exchange happens on client side (browser)
 */

export const runtime = "edge";

const FALLBACK_ORIGIN = "https://app-gen-voice-ai.pages.dev";

export function GET(request: Request): Response {
  const url = request.url || "";
  
  // Extract query string from the request URL
  const qIndex = url.indexOf("?");
  const search = qIndex >= 0 ? url.slice(qIndex) : "";
  
  // Determine origin from request
  let origin = FALLBACK_ORIGIN;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const slashAfterScheme = url.indexOf("/", 8);
    if (slashAfterScheme > 0) {
      origin = url.slice(0, slashAfterScheme);
    }
  }
  
  // Redirect to client-side callback page with same query params
  const location = origin + "/auth/callback" + search;
  
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}
