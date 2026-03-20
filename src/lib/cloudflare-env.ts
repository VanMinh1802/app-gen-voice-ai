/**
 * Cloudflare Pages / Edge: read env from request context.
 * next-on-pages injects __cloudflare-request-context__ (env + bindings).
 * In browser or Node without CF, returns null.
 * Env contains both string vars (e.g. GENATION_CLIENT_SECRET) and bindings (e.g. R2Bucket).
 */
const CF_REQUEST_CONTEXT = Symbol.for("__cloudflare-request-context__");

export function getCloudflareEnv(): Record<string, unknown> | null {
  try {
    const ctx = (globalThis as unknown as Record<symbol, unknown>)[
      CF_REQUEST_CONTEXT
    ];
    const env =
      ctx &&
      typeof ctx === "object" &&
      (ctx as { env?: Record<string, unknown> }).env;
    return env && typeof env === "object"
      ? (env as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
