/**
 * AuthProvider - Authentication context provider
 * 
 * Wraps the app with auth state, making it available throughout the component tree.
 */

"use client";

import { ReactNode, createContext, useContext, Suspense } from "react";
import { useAuth, useLicense, isProPlanCode, type AuthState, type AuthActions, type LicenseState, type LicenseActions } from "@/lib/hooks";

/**
 * Combined auth + license context type
 */
export interface AuthContextValue extends AuthState, AuthActions, LicenseState, LicenseActions {
  canAccessPro: boolean;
}

/**
 * Create context with default values
 */
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider component
 * Provides auth and license state to all children
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <Suspense fallback={<AuthContext.Provider value={getDefaultAuthContextValue()}><div className="min-h-screen flex items-center justify-center">Loading...</div></AuthContext.Provider>}>
      <LicenseProvider auth={auth}>
        {children}
      </LicenseProvider>
    </Suspense>
  );
}

function LicenseProvider({ children, auth }: { children: ReactNode; auth: AuthState & AuthActions }) {
  const license = useLicense();

  // Computed: user has PRO access
  const canAccessPro = isProPlanCode(license.activePlanCode);

  const value: AuthContextValue = {
    ...auth,
    ...license,
    canAccessPro,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function getDefaultAuthContextValue(): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isConfigured: false,
    error: null,
    signIn: async () => {},
    signOut: async () => {},
    refreshSession: async () => {},
    licenses: [],
    activePlanCode: null,
    hasProAccess: false,
    isVerified: false,
    refreshLicenses: async () => {},
    checkPlan: async () => false,
    checkProAccess: async () => false,
    upgradeToPlan: () => {},
    canAccessPro: false,
  };
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
