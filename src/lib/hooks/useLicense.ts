/**
 * useLicense Hook - License and plan management
 *
 * Provides license state and methods for checking user plan access.
 * Integrates with Genation SDK for license verification.
 *
 * Plan codes:
 * - "FREE" - Free tier (1 giọng nam + 1 giọng nữ)
 * - "PRO" - Pro tier (tất cả model giọng)
 *
 * License status:
 * - "active" - License is active and valid
 * - "expired" - License has expired
 * - "revoked" - License was revoked
 */

"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getLicenses,
  hasActivePlan,
  getActivePlanCode,
  checkProAccess,
  type License,
} from "@/lib/genation";
import { useAuth } from "./useAuth";

export interface LicenseState {
  licenses: License[];
  activePlanCode: string | null;
  /** True if user has an active PRO license (purchased). Use to unlock Pro features. */
  hasProAccess: boolean;
  isLoading: boolean;
  isVerified: boolean;
  error: string | null;
}

export interface LicenseActions {
  refreshLicenses: () => Promise<void>;
  checkPlan: (planCode: string) => Promise<boolean>;
  /** Async check: does the user have active PRO license? */
  checkProAccess: () => Promise<boolean>;
  /** Redirect to Genation store to upgrade to a specific plan */
  upgradeToPlan: (planCode: string) => void;
}

export type UseLicenseReturn = LicenseState & LicenseActions;

/**
 * Free plan: allowed voice models (custom voice IDs without prefix)
 * Chosen randomly for initial setup:
 * - male: manhdung
 * - female: ngochuyen
 */
export const FREE_ALLOWED_VOICE_IDS = ["manhdung", "ngochuyen"] as const;

/**
 * Plan access configuration
 * Define your app's plans here
 */
export const PLAN_ACCESS = {
  FREE: {
    code: "FREE",
    name: "Miễn phí",
    features: {
      /** Free: chỉ 1 model giọng nam + 1 model giọng nữ (voice IDs do app quy định) */
      maxVoiceModels: 2,
      allowedVoiceIds: FREE_ALLOWED_VOICE_IDS,
      exportFormat: ["wav"],
    },
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    features: {
      /** Pro: tất cả model giọng */
      maxVoiceModels: -1,
      exportFormat: ["wav", "mp3"],
      prioritySupport: true,
    },
  },
} as const;

/**
 * Treat Genation plan codes like "PRO_1_Month" as Pro tier.
 */
export function isProPlanCode(planCode: string | null): boolean {
  if (!planCode) return false;
  return planCode === "PRO" || planCode.startsWith("PRO_");
}

/**
 * Voice access by plan.
 * Temporarily disabled: all voices are available to everyone (Free for all).
 * TODO: Re-enable plan restrictions when billing is ready.
 */
export function canUseVoiceForPlan(_opts: {
  planCode: string | null;
  voiceId: string;
}): boolean {
  return true;
}

/**
 * Get plan features by plan code
 */
export function getPlanFeatures(planCode: string | null) {
  if (!planCode) return PLAN_ACCESS.FREE.features;
  if (isProPlanCode(planCode)) return PLAN_ACCESS.PRO.features;
  const plan = Object.values(PLAN_ACCESS).find((p) => p.code === planCode);
  return plan?.features || PLAN_ACCESS.FREE.features;
}

/**
 * Check if user has an active license for a specific plan.
 * @param planCode - The plan code to check (e.g., "PRO", "FREE")
 * @param licenses - Array of user licenses
 * @returns true if user has an active license for the given plan
 */
export function isLicenseActiveForPlan(
  planCode: string,
  licenses: License[],
): boolean {
  return licenses.some(
    (license) => license.status === "active" && license.plan.code === planCode,
  );
}

/**
 * Hook for license and plan management
 * Requires useAuth to be set up first
 */
export function useLicense(): UseLicenseReturn {
  return useLicenseInner();
}

// Inner hook with search params (must be wrapped in Suspense)
function useLicenseInner(): UseLicenseReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated: isAuth, isLoading: isAuthLoading } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [activePlanCode, setActivePlanCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch licenses when user is authenticated
  useEffect(() => {
    let isMounted = true;

    async function fetchLicenses() {
      // Don't fetch if auth is still loading or user not authenticated
      if (isAuthLoading || !isAuth) {
        setIsLoading(false);
        setLicenses([]);
        setActivePlanCode(null);
        setIsVerified(false);
        return;
      }

      try {
        setIsLoading(true);
        const [licenseList, planCode] = await Promise.all([
          getLicenses(),
          getActivePlanCode(),
        ]);

        if (isMounted) {
          setLicenses(licenseList);
          setActivePlanCode(planCode);
          setIsVerified(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to get licenses",
          );
          setIsVerified(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLicenses();

    return () => {
      isMounted = false;
    };
  }, [isAuth, isAuthLoading]);

  const refreshLicenses = useCallback(async () => {
    if (!isAuth) {
      setLicenses([]);
      setActivePlanCode(null);
      setIsVerified(false);
      return;
    }

    try {
      setIsLoading(true);
      const [licenseList, planCode] = await Promise.all([
        getLicenses(),
        getActivePlanCode(),
      ]);
      setLicenses(licenseList);
      setActivePlanCode(planCode);
      setIsVerified(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh licenses",
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuth]);

  // Handle post-purchase redirect: refresh licenses when returning from purchase
  useEffect(() => {
    const signedIn = searchParams.get("signed_in");
    if (signedIn === "true" && isAuth && !isLoading) {
      refreshLicenses();
      // Clean up the URL
      router.replace("/", { scroll: false });
    }
  }, [searchParams, isAuth, isLoading, refreshLicenses, router]);

  const checkPlan = useCallback(
    async (planCode: string): Promise<boolean> => {
      if (!isAuth || !isVerified) return false;
      return await hasActivePlan(planCode);
    },
    [isAuth, isVerified],
  );

  const checkProAccessFn = useCallback(async (): Promise<boolean> => {
    if (!isAuth) return false;
    return await checkProAccess();
  }, [isAuth]);

  const upgradeToPlan = useCallback((planCode: string) => {
    const storeUrl =
      process.env.NEXT_PUBLIC_GENATION_STORE_URL || "https://genation.ai";
    const redirectUri =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "http://localhost:3000/auth/callback";
    // Build the store URL with plan and redirect back to app after purchase
    const purchaseUrl = `${storeUrl}?plan=${planCode}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = purchaseUrl;
  }, []);

  const hasProAccess = isProPlanCode(activePlanCode);

  return {
    licenses,
    activePlanCode,
    hasProAccess,
    isLoading,
    isVerified,
    error,
    refreshLicenses,
    checkPlan,
    checkProAccess: checkProAccessFn,
    upgradeToPlan,
  };
}
