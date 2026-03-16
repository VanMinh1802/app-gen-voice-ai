/**
 * Genation Client Wrapper (client-side only)
 *
 * Next.js renders on server first – dùng guard "window" và "use client" để SDK chỉ chạy trên client.
 * Theo docs Genation: https://dev.genation.ai/docs
 */

"use client";

import { createClient, GenationClient, Session } from "@genation/sdk";
import { getGenationConfig } from "./config";

/** License type inferred from SDK getLicenses() return */
export type License = NonNullable<
  Awaited<ReturnType<GenationClient["getLicenses"]>>
> extends (infer E)[]
  ? E
  : never;

let genationClient: GenationClient | null = null;

/**
 * Get or create the Genation client instance (singleton).
 * Returns null on server (typeof window === "undefined") – callers phải check trước khi dùng.
 */
export function getGenationClient(): GenationClient | null {
  if (typeof window === "undefined") return null;

  if (!genationClient) {
    const config = getGenationConfig();
    if (!config.clientId || !config.clientSecret) {
      return null;
    }

    genationClient = createClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });
  }

  return genationClient;
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const client = getGenationClient();
  if (!client) return null;
  return await client.getSession();
}

/**
 * Get user licenses
 */
export async function getLicenses(): Promise<License[]> {
  const client = getGenationClient();
  if (!client) {
    console.warn("[genation] Client not initialized");
    return [];
  }
  try {
    const licenses = await client.getLicenses();
    console.log("[genation] getLicenses result:", licenses);
    return licenses ?? [];
  } catch (err) {
    console.error("[genation] getLicenses error:", err);
    return [];
  }
}

/**
 * Check if user has active license with specific plan code
 * @param planCode - The plan code to check (e.g., "PRO", "FREE")
 */
export async function hasActivePlan(planCode: string): Promise<boolean> {
  try {
    const licenses = await getLicenses();
    return licenses.some(
      (license) =>
        license.status === "active" && license.plan.code === planCode
    );
  } catch {
    return false;
  }
}

/** Plan code for Pro tier (unlock all features). */
export const PRO_PLAN_CODE = "PRO";

/**
 * Check if the current user has an active PRO license (purchased).
 * Use this to unlock Pro features, e.g.:
 *   if (await checkProAccess()) showProFeatures();
 *   else showUpgradePrompt();
 */
export async function checkProAccess(): Promise<boolean> {
  const licenses = await getLicenses();
  if (!licenses) return false;
  return licenses.some(
    (license) =>
      license.plan.code === PRO_PLAN_CODE && license.status === "active"
  );
}

/**
 * Get the highest active plan code for the user
 */
export async function getActivePlanCode(): Promise<string | null> {
  try {
    const licenses = await getLicenses();
    const activeLicense = licenses.find((l) => l.status === "active");
    return activeLicense?.plan.code || null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Start sign in flow
 */
export async function signIn(): Promise<string> {
  const client = getGenationClient();
  if (!client) throw new Error("Genation SDK not configured or not available on server.");
  return await client.signIn();
}

/**
 * Handle OAuth callback
 * @param url - The full URL with query params (code & state)
 */
export async function handleCallback(url: string): Promise<void> {
  const client = getGenationClient();
  if (!client) throw new Error("Genation SDK not configured or not available on server.");
  await client.handleCallback(url);
}

/** Config for creating a one-off client (e.g. in Edge callback with request-scoped env). */
export interface GenationCallbackConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Handle OAuth callback with explicit config (for Edge/Cloudflare where env is request-scoped).
 * Use this in API routes that have access to getRequestContext().env.
 */
export async function handleCallbackWithConfig(
  url: string,
  config: GenationCallbackConfig
): Promise<void> {
  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      "Genation SDK not configured. Need clientId and clientSecret."
    );
  }
  const client = createClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });
  await client.handleCallback(url);
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const client = getGenationClient();
  if (!client) return;
  await client.signOut();
}

/**
 * Listen to auth state changes
 * @param callback - Called when auth state changes
 * @returns Unsubscribe function (no-op nếu client chưa có)
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  const client = getGenationClient();
  if (!client) return { unsubscribe: () => {} };
  const { subscription } = client.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}

export type { Session };
