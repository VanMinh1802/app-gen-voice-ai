/**
 * Hooks Index
 * Central export for all custom hooks
 */

export { useAuth, type AuthState, type AuthActions, type UseAuthReturn } from "./useAuth";
export { 
  useLicense, 
  getPlanFeatures, 
  PLAN_ACCESS,
  FREE_ALLOWED_VOICE_IDS,
  canUseVoiceForPlan,
  isProPlanCode,
  isLicenseActiveForPlan,
  type LicenseState, 
  type LicenseActions, 
  type UseLicenseReturn 
} from "./useLicense";
export { useTheme } from "./useTheme";
export { useLocale } from "./useLocale";
