/**
 * LoginButton Component
 *
 * Button for signing in with Genation.
 * Shows different states: loading, signed in, or sign in prompt.
 */

"use client";

import { useState } from "react";
import { LogIn, LogOut, Loader2, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config";
import { useAuth, useLicense, PLAN_ACCESS } from "@/lib/hooks";

interface LoginButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showPlanBadge?: boolean;
  className?: string;
}

export function LoginButton({
  variant = "default",
  size = "md",
  showPlanBadge = true,
  className,
}: LoginButtonProps) {
  const { user, isLoading, isAuthenticated, isConfigured, signIn, signOut } =
    useAuth();
  const { activePlanCode, isLoading: isLicenseLoading } = useLicense();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  // If Genation is not configured, show setup message
  if (!isConfigured) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground text-sm",
          size === "sm" && "text-xs",
          size === "lg" && "text-base",
          className,
        )}
      >
        <span>Cần cấu hình Genation SDK</span>
      </div>
    );
  }

  // Loading state
  if (isLoading || isLicenseLoading) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center gap-2 rounded-xl font-medium transition-all",
          "bg-primary/50 text-primary-foreground cursor-wait",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          className,
        )}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Đang tải...</span>
      </button>
    );
  }

  // Authenticated - show user info and sign out
  if (isAuthenticated && user) {
    const planInfo = activePlanCode
      ? Object.values(PLAN_ACCESS).find((p) => p.code === activePlanCode)
      : null;

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25">
            {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
          </div>

          {/* User info */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {user.name || user.email?.split("@")[0] || "User"}
            </p>
            {showPlanBadge && config.showSubscriptionUi && activePlanCode && (
              <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {planInfo?.name || activePlanCode}
              </p>
            )}
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            "flex items-center gap-2 rounded-xl font-medium transition-all",
            "hover:bg-red-500/10 text-muted-foreground hover:text-red-400",
            size === "sm" && "px-2 py-1.5 text-xs",
            size === "md" && "px-3 py-2 text-sm",
            size === "lg" && "px-4 py-3 text-base",
            className,
          )}
          title="Đăng xuất"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  // Not authenticated - show sign in button
  return (
    <button
      onClick={signIn}
      className={cn(
        "flex items-center gap-2 rounded-xl font-medium transition-all",
        variant === "default" &&
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
        variant === "outline" &&
          "border-2 border-primary text-primary hover:bg-primary/10",
        variant === "ghost" &&
          "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className,
      )}
    >
      <Sparkles className="w-4 h-4" />
      <span>Đăng nhập</span>
    </button>
  );
}
