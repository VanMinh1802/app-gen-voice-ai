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

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getLicenses,
  hasActivePlan,
  getActivePlanCode,
  isAuthenticated,
  type License,
} from "@/lib/genation";
import { useAuth } from "./useAuth";

export interface LicenseState {
  licenses: License[];
  activePlanCode: string | null;
  isLoading: boolean;
  isVerified: boolean;
  error: string | null;
}

export interface LicenseActions {
  refreshLicenses: () => Promise<void>;
  checkPlan: (planCode: string) => Promise<boolean>;
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
 * Voice access by plan.
 * - Free: only 2 allowed voices can be used for generation
 * - Pro: all voices can be used
 */
export function canUseVoiceForPlan(opts: { planCode: string | null; voiceId: string }): boolean {
  const { planCode, voiceId } = opts;
  if (planCode === "PRO") return true;
  // Treat null/unknown as FREE for MVP
  return (FREE_ALLOWED_VOICE_IDS as readonly string[]).includes(voiceId);
}

/**
 * Get plan features by plan code
 */
export function getPlanFeatures(planCode: string | null) {
  if (!planCode) return PLAN_ACCESS.FREE.features;
  
  const plan = Object.values(PLAN_ACCESS).find(p => p.code === planCode);
  return plan?.features || PLAN_ACCESS.FREE.features;
}

/**
 * Hook for license and plan management
 * Requires useAuth to be set up first
 */
export function useLicense(): UseLicenseReturn {
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
          setError(err instanceof Error ? err.message : "Failed to get licenses");
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
      setError(err instanceof Error ? err.message : "Failed to refresh licenses");
    } finally {
      setIsLoading(false);
    }
  }, [isAuth]);

  const checkPlan = useCallback(
    async (planCode: string): Promise<boolean> => {
      if (!isAuth || !isVerified) return false;
      return await hasActivePlan(planCode);
    },
    [isAuth, isVerified]
  );

  return {
    licenses,
    activePlanCode,
    isLoading,
    isVerified,
    error,
    refreshLicenses,
    checkPlan,
  };
}
