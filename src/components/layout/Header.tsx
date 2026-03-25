/**
 * Header Component
 *
 * Main header with navigation, user menu, and notifications.
 * Integrated with Genation authentication.
 */

"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  LogOut,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { useAuthContext } from "@/components/AuthProvider";
import { useNotificationStore } from "@/lib/storage/notifications";

interface HeaderProps {
  title?: string;
  /** Nội dung bên trái (vd: nút menu mobile) — hiển thị trong header để layout responsive đúng */
  leftContent?: React.ReactNode;
}

export function Header({
  title = "Tạo giọng nói mới",
  leftContent,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Use auth context
  const {
    user,
    isLoading,
    isAuthenticated,
    isConfigured,
    activePlanCode,
    canAccessPro,
    signIn,
    signOut,
    error: authError,
  } = useAuthContext();

  // Use notification store instead of hardcoded data
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowNotifications(false);
      setShowUserMenu(false);
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showNotifications, showUserMenu]);

  // Get user display info
  const userName = user?.name || user?.email?.split("@")[0] || "Khách";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="h-14 sm:h-16 border-b border-border glass-card flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {leftContent}
        <h1
          className="text-base sm:text-lg font-bold text-foreground truncate min-w-0"
          title={title}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all relative group"
          aria-label={
            theme === "dark"
              ? "Chuyển sang chế độ sáng"
              : "Chuyển sang chế độ tối"
          }
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all relative group"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-top-right z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Chưa có thông báo nào
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "p-4 border-b border-border/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer",
                        !notif.read && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            !notif.read
                              ? "bg-primary text-primary-foreground"
                              : "bg-black/10 dark:bg-white/10 text-muted-foreground",
                          )}
                        >
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notif.title}
                          </p>
                          {notif.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.description}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {new Date(notif.timestamp).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border">
                  <button
                    onClick={() => markAllAsRead()}
                    className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium py-2 transition-colors"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu - Authenticated */}
        {isAuthenticated ? (
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/25">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-foreground">{userName}</p>
                {canAccessPro && (
                  <p className="text-[10px] text-amber-500 font-medium">PRO</p>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform hidden sm:block",
                  showUserMenu && "rotate-180",
                )}
              />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-top-right z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-bold text-foreground">
                    {userName}
                  </p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 text-left disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* User Menu - Not Authenticated - Show Login */
          <div className="relative ml-2 flex flex-col items-end gap-1">
            {!isConfigured && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                ⚠️ Chưa cấu hình Genation SDK
              </span>
            )}
            {authError && (
              <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                {authError}
              </span>
            )}
            {isLoading ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <button
                onClick={async () => {
                  // Client-side sign in: SDK lấy URL Genation rồi redirect (không qua /api/auth/signin)
                  await signIn();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Đăng nhập</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
