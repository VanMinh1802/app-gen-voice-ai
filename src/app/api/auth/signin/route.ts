/**
 * Sign In Handler (fallback – ưu tiên dùng client-side signIn() trong app)
 *
 * Route: /api/auth/signin
 * Nếu ai đó mở trực tiếp hoặc link cũ, không dùng SDK trên Edge (dễ 500).
 * Redirect về trang chủ để đăng nhập bằng nút Đăng nhập (client-side).
 */

export const runtime = "edge";

const FALLBACK_ORIGIN = "https://app-gen-voice-ai.pages.dev";

export function GET(request: Request): Response {
  let origin = FALLBACK_ORIGIN;
  const url = request.url || "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const slashAfterScheme = url.indexOf("/", 8);
    if (slashAfterScheme > 0) {
      origin = url.slice(0, slashAfterScheme);
    }
  }

  const message =
    "Vui lòng bấm nút Đăng nhập trên trang để đăng nhập với Genation.";
  const location =
    origin + "/?auth_prompt=true&message=" + encodeURIComponent(message);

  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}
