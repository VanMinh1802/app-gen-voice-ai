/**
 * Genation Client Wrapper (client-side only)
 *
 * Provides authentication and license management via Genation SDK.
 * Only runs in browser (guarded by typeof window check).
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
 * Returns null on server (typeof window === "undefined") – callers must check.
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
  if (!client) return [];
  try {
    const licenses = await client.getLicenses();
    return licenses ?? [];
  } catch {
    return [];
  }
}

/**
 * Check if user has active license with specific plan code
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
 * Genation may return plan codes like "PRO_1_Month", "PRO_1_Year".
 * Treat any code that equals "PRO" or starts with "PRO_" as Pro tier.
 */
export function isProPlanCode(code: string | null): boolean {
  if (!code) return false;
  return code === PRO_PLAN_CODE || code.startsWith("PRO_");
}

/**
 * Check if the current user has an active PRO license.
 */
export async function checkProAccess(): Promise<boolean> {
  const licenses = await getLicenses();
  if (!licenses) return false;
  return licenses.some(
    (license) =>
      isProPlanCode(license.plan.code) && license.status === "active"
  );
}

/**
 * Get the highest active plan code for the user.
 * Normalizes Genation plan codes (e.g. "PRO_1_Month") to "PRO" so app logic stays simple.
 */
export async function getActivePlanCode(): Promise<string | null> {
  try {
    const licenses = await getLicenses();
    const activeLicense = licenses.find((l) => l.status === "active");
    const raw = activeLicense?.plan.code || null;
    if (!raw) return null;
    return isProPlanCode(raw) ? PRO_PLAN_CODE : raw;
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
  if (!client) throw new Error("Genation SDK not configured");
  return await client.signIn();
}

/**
 * Handle OAuth callback
 */
export async function handleCallback(url: string): Promise<void> {
  const client = getGenationClient();
  if (!client) throw new Error("Genation SDK not configured");
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
