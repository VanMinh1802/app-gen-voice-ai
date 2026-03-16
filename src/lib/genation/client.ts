/**
 * Genation Client Wrapper
 * 
 * Singleton client for Genation SDK authentication and license management.
 * Uses OAuth 2.1 with PKCE for secure authentication.
 */

import { createClient, GenationClient, Session } from "@genation/sdk";
import { genationConfig } from "./config";

/** License type inferred from SDK getLicenses() return */
export type License = NonNullable<
  Awaited<ReturnType<GenationClient["getLicenses"]>>
> extends (infer E)[]
  ? E
  : never;

let genationClient: GenationClient | null = null;

/**
 * Get or create the Genation client instance (singleton)
 */
export function getGenationClient(): GenationClient {
  if (!genationClient) {
    if (!genationConfig.clientId || !genationConfig.clientSecret) {
      throw new Error(
        "Genation SDK not configured. Please set GENATION_CLIENT_ID and GENATION_CLIENT_SECRET environment variables."
      );
    }

    genationClient = createClient({
      clientId: genationConfig.clientId,
      clientSecret: genationConfig.clientSecret,
      redirectUri: genationConfig.redirectUri,
    });
  }

  return genationClient;
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const client = getGenationClient();
  return await client.getSession();
}

/**
 * Get user licenses
 */
export async function getLicenses(): Promise<License[]> {
  const client = getGenationClient();
  const licenses = await client.getLicenses();
  return licenses ?? [];
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
  return await client.signIn();
}

/**
 * Handle OAuth callback
 * @param url - The full URL with query params (code & state)
 */
export async function handleCallback(url: string): Promise<void> {
  const client = getGenationClient();
  await client.handleCallback(url);
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const client = getGenationClient();
  await client.signOut();
}

/**
 * Listen to auth state changes
 * @param callback - Called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  const client = getGenationClient();
  const { subscription } = client.onAuthStateChange(callback);
  return { unsubscribe: () => subscription.unsubscribe() };
}

export type { Session };
