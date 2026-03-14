/**
 * Client-side config that exposes public env vars to browser.
 * This runs in the browser context so worker can access via window.
 */

declare global {
  interface Window {
    NEXT_PUBLIC_R2_PUBLIC_URL?: string;
  }
}

// Export for use in components/pages that need to pass to worker
export function getR2PublicUrl(): string | undefined {
  if (typeof window !== "undefined") {
    return window.NEXT_PUBLIC_R2_PUBLIC_URL;
  }
  return undefined;
}

// Set the URL from env (Next.js will replace this at build time)
// This value will be inlined at build time
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
