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
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config";
import { useTheme } from "@/components/ThemeProvider";
import { useAuthContext } from "@/components/AuthProvider";
import { useNotificationStore } from "@/lib/storage/notifications";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  title?: string;
  /** Nhãn phụ phía trên tiêu đề (ngữ cảnh trang) — ẩn trên mobile rất hẹp nếu cần */
  eyebrow?: string;
  /** Nội dung bên trái (vd: nút menu mobile) — hiển thị trong header để layout responsive đúng */
  leftContent?: React.ReactNode;
}

export function Header({
  title = "Tạo giọng nói mới",
  eyebrow,
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
    <header className="relative min-h-[4.2rem] sm:min-h-[4.75rem] border border-white/10 backdrop-blur-2xl bg-background/60 flex items-center justify-between gap-3 px-5 sm:px-6 lg:px-8 py-2 sm:py-0 sticky top-0 z-30 shadow-lg shadow-black/10 overflow-visible rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[1.75rem] lg:ml-0.5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_40%),radial-gradient(circle_at_85%_0%,rgba(59,130,246,0.12),transparent_35%)]"
      />
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {leftContent}
        <div className="relative flex flex-col min-w-0 justify-center">
          {eyebrow ? (
            <p
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 truncate flex items-center gap-1.5"
              id="header-eyebrow"
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-extrabold text-foreground truncate min-w-0 tracking-tight",
              eyebrow ? "text-base sm:text-xl mt-0.5" : "text-lg sm:text-xl",
            )}
            title={title}
            aria-describedby={eyebrow ? "header-eyebrow" : undefined}
          >
            {title}
          </h1>
        </div>
      </div>

      <div className="relative flex items-center gap-2 sm:gap-2.5 shrink-0 rounded-2xl border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-xl">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-muted-foreground hover:text-foreground hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={
            theme === "dark"
              ? "Chuyển sang chế độ sáng"
              : "Chuyển sang chế độ tối"
          }
        >
          {theme === "dark" ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              showNotifications || unreadCount > 0
                ? "bg-primary/12 text-primary border-primary/25"
                : "bg-white/10 border-white/15 text-muted-foreground hover:text-foreground hover:bg-white/20",
            )}
            aria-label="Thông báo"
            aria-expanded={showNotifications}
            aria-haspopup="menu"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role="menu"
                aria-label="Danh sách thông báo"
                className="absolute right-0 top-full mt-3 w-[340px] sm:w-[380px] glass-card backdrop-blur-2xl bg-background/85 border border-white/15 rounded-3xl shadow-2xl shadow-black/25 overflow-hidden origin-top-right z-50"
              >
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <h3 className="font-bold text-foreground text-sm tracking-tight">
                    Thông báo
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-foreground/70">
                        Chưa có thông báo nào
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Khi có cập nhật mới, chúng sẽ xuất hiện ở đây.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          role="menuitem"
                          tabIndex={0}
                          onClick={() => markAsRead(notif.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              markAsRead(notif.id);
                            }
                          }}
                          className={cn(
                            "group p-4 border-b border-white/10 hover:bg-primary/5 transition-colors cursor-pointer relative",
                            !notif.read && "bg-primary/[0.03]",
                          )}
                        >
                          {!notif.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                          )}
                          <div className="flex items-start gap-3.5">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                !notif.read
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                  : "bg-black/5 dark:bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                              )}
                            >
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p
                                className={cn(
                                  "text-sm truncate leading-tight",
                                  !notif.read
                                    ? "font-bold text-foreground"
                                    : "font-medium text-foreground/80",
                                )}
                              >
                                {notif.title}
                              </p>
                              {notif.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {notif.description}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                                {new Date(notif.timestamp).toLocaleString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-white/10 bg-white/5">
                    <button
                      onClick={() => markAllAsRead()}
                      className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary py-2.5 rounded-xl hover:bg-primary/10 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Đánh dấu đã đọc tất cả
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-white/20 mx-0.5 hidden sm:block" />

        {/* User Menu - Authenticated */}
        {isAuthenticated ? (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className={cn(
                "flex items-center gap-2.5 p-1 pr-2.5 sm:pr-3.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border",
                showUserMenu
                  ? "bg-white/15 border-white/20"
                  : "bg-transparent border-transparent hover:bg-white/12 hover:border-white/20",
              )}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20 text-sm">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col items-start min-w-0 max-w-[120px]">
                <p className="text-xs font-bold text-foreground truncate w-full tracking-tight">
                  {userName}
                </p>
                {config.showSubscriptionUi && canAccessPro ? (
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mt-0.5">
                    PRO Plan
                  </p>
                ) : (
                  <p className="text-[9px] font-medium text-muted-foreground truncate w-full mt-0.5">
                    Free Plan
                  </p>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 hidden sm:block ml-1",
                  showUserMenu && "rotate-180 text-foreground",
                )}
              />
            </motion.button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-64 glass-card backdrop-blur-2xl bg-background/85 border border-white/15 rounded-3xl shadow-2xl shadow-black/25 overflow-hidden origin-top-right z-50"
                >
                  <div className="p-5 border-b border-white/10 bg-white/5 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20 mb-3">
                      {userInitial}
                    </div>
                    <p className="text-sm font-bold text-foreground truncate w-full px-2">
                      {userName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate w-full px-2 mt-0.5">
                      {userEmail}
                    </p>
                  </div>
                  <div className="p-3">
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-colors text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-left font-medium disabled:opacity-50 group"
                    >
                      {isSigningOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      )}
                      <span className="text-sm">Đăng xuất</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* User Menu - Not Authenticated - Show Login */
          <div className="relative flex items-center gap-3 ml-2">
            {!isConfigured && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20 hidden md:inline-block">
                ⚠️ Thiếu cấu hình SDK
              </span>
            )}
            {authError && (
              <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 hidden sm:inline-block">
                {authError}
              </span>
            )}
            {isLoading ? (
              <div className="w-24 h-10 bg-white/10 rounded-xl animate-pulse" />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  await signIn();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm">Đăng nhập</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
