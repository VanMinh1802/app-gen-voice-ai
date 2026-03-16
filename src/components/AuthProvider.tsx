/**
 * AuthProvider - Authentication context provider
 * 
 * Wraps the app with auth state, making it available throughout the component tree.
 */

"use client";

import { ReactNode, createContext, useContext } from "react";
import { useAuth, useLicense, type AuthState, type AuthActions, type LicenseState } from "@/lib/hooks";

/**
 * Combined auth + license context type
 */
export interface AuthContextValue extends AuthState, AuthActions, LicenseState {
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
  const license = useLicense();

  // Computed: user has PRO access
  const canAccessPro = license.activePlanCode === "PRO";

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
