"use client";

/**
 * OAuth callback page – chạy trên client (browser).
 * Genation OAuth redirect về đây với ?code=...&state=...
 * Trang này gọi handleCallback(callbackUrl) trong browser.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { handleCallback } from "@/lib/genation";
import { getGenationConfig } from "@/lib/genation/config";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || error);
      router.replace("/?auth_error=true&message=" + encodeURIComponent(errorDescription || error));
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Thiếu code hoặc state");
      router.replace("/?auth_error=true&message=" + encodeURIComponent("Missing authorization code"));
      return;
    }

    let cancelled = false;

    (async () => {
      let config;
      try {
        config = getGenationConfig();
        if (!config.clientId || !config.clientSecret) {
          setStatus("error");
          setMessage("Genation chưa cấu hình (clientId/secret)");
          router.replace("/?auth_error=true&message=Genation+not+configured");
          return;
        }
      } catch (err) {
        setStatus("error");
        setMessage("Lỗi cấu hình: " + (err instanceof Error ? err.message : "Unknown"));
        router.replace("/?auth_error=true&message=Config+error");
        return;
      }

      try {
        const { redirectUri } = config;
        const qs = searchParams.toString();
        const fullUrl = (redirectUri || "") + (qs ? "?" + qs : "");
        await handleCallback(fullUrl);
        if (cancelled) return;
        setStatus("ok");
        router.replace("/?signed_in=true");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          const msg = err instanceof Error ? err.message : "Unknown error";
          const cause = err instanceof Error && err.cause ? String(err.cause) : "";
          setMessage(msg + (cause ? ` (${cause})` : ""));
          router.replace("/?auth_error=true&message=" + encodeURIComponent(msg));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Đang xác thực...</p>
          </>
        )}
        {status === "error" && message && (
          <p className="text-destructive">{message}</p>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
