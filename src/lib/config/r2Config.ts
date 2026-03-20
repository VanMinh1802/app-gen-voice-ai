/**
 * Client-side config that exposes public env vars to browser.
 * Prefers: (1) runtime config from /r2-config.json, (2) build-time NEXT_PUBLIC_*, (3) empty.
 * Dùng r2-config.json khi deploy Cloudflare Pages (build env có thể không có NEXT_PUBLIC_*).
 */

declare global {
  interface Window {
    NEXT_PUBLIC_R2_PUBLIC_URL?: string;
  }
}

let cachedFromConfig: string | undefined;

/** Load R2 public URL from /r2-config.json and set window + cache. Gọi sớm (layout/provider). */
export async function loadR2Config(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const res = await fetch("/r2-config.json?t=" + Date.now());
    if (!res.ok) return undefined;
    const data = (await res.json()) as { r2PublicUrl?: string };
    const url =
      typeof data.r2PublicUrl === "string" &&
      data.r2PublicUrl.startsWith("http")
        ? data.r2PublicUrl.trim()
        : undefined;
    if (url) {
      cachedFromConfig = url;
      window.NEXT_PUBLIC_R2_PUBLIC_URL = url;
    }
    return url;
  } catch {
    return undefined;
  }
}

/** Trả về R2 public URL: cache từ r2-config.json > window > build-time env. */
export function getR2PublicUrl(): string | undefined {
  if (typeof window !== "undefined") {
    const w = window.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (w && w.startsWith("http")) return w;
    if (cachedFromConfig) return cachedFromConfig;
  }
  const env = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  return env && env.startsWith("http") ? env : undefined;
}

/** Build-time value (inlined). Trên Cloudflare có thể rỗng → dùng loadR2Config() + getR2PublicUrl(). */
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
