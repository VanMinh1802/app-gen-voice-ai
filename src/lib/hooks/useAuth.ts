/**
 * useAuth Hook - Authentication state management
 * 
 * Provides authentication state and methods using Genation SDK.
 * Handles login, logout, and session management.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getSession,
  signIn as genationSignIn,
  signOut as genationSignOut,
  onAuthStateChange,
  isGenationConfigured,
  type Session,
} from "@/lib/genation";

export interface AuthState {
  user: Session["user"];
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Hook for authentication state and actions
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<Session["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = useMemo(() => isGenationConfigured(), []);

  // Check session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        if (!isConfigured) {
          setIsLoading(false);
          return;
        }

        const session = await getSession();
        if (isMounted) {
          setUser(session?.user || null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to get session");
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();

    // Subscribe to auth state changes
    let unsubscribe: (() => void) | undefined;
    
    if (isConfigured) {
      const { unsubscribe: unsub } = onAuthStateChange((event, session) => {
        if (isMounted) {
          switch (event) {
            case "SIGNED_IN":
            case "INITIAL_SESSION":
              setUser(session?.user || null);
              setError(null);
              break;
            case "SIGNED_OUT":
              setUser(null);
              break;
            case "TOKEN_REFRESHED":
              // Token refreshed silently, no UI update needed
              break;
          }
        }
      });
      unsubscribe = unsub;
    }

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [isConfigured]);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = await genationSignIn();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await genationSignOut();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await getSession();
      setUser(session?.user || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh session");
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isConfigured,
    error,
    signIn,
    signOut,
    refreshSession,
  };
}
