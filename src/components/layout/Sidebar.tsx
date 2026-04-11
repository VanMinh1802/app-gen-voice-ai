"use client";

import { useMemo } from "react";
import {
  LayoutDashboard,
  Mic,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { config } from "@/config";
import { useAuthContext } from "@/components/AuthProvider";
import { PLAN_ACCESS, isProPlanCode } from "@/lib/hooks";

type SidebarTab = "dashboard" | "voice_library" | "history" | "settings";

interface SidebarProps {
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
  /** Thu gọn sidebar (chỉ icon) trên desktop */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const sidebarVariants = {
  expanded: { width: 288 },
  collapsed: { width: 88 },
};

export function Sidebar({
  activeTab = "dashboard",
  onTabChange,
  isOpen = true,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const {
    isAuthenticated,
    activePlanCode,
    isLoading: isLicenseLoading,
    licenses,
    upgradeToPlan,
  } = useAuthContext();

  const planInfo = activePlanCode
    ? Object.values(PLAN_ACCESS).find((p) => p.code === activePlanCode)
    : null;
  const planName =
    planInfo?.name ?? (isProPlanCode(activePlanCode) ? "Pro" : "Miễn phí");
  const hasActiveLicense = licenses.some((l) => l.status === "active");
  const activeLicense = licenses.find((l) => l.status === "active");
  const expiresAt = activeLicense?.expiresAt;

  const navItems = useMemo(
    () => [
      { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
      { id: "voice_library" as const, label: "Thư viện giọng", icon: Mic },
      { id: "history" as const, label: "Lịch sử", icon: History },
      { id: "settings" as const, label: "Cài đặt", icon: Settings },
    ],
    [],
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.9 }}
        className={cn(
          "relative flex flex-col fixed top-4 left-4 bottom-4 z-50 rounded-[1.75rem] overflow-hidden",
          "transform transition-all duration-300 ease-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "backdrop-blur-2xl bg-background/55 border border-white/10 shadow-[0_22px_55px_rgba(2,8,32,0.45)]",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.12),transparent_44%),radial-gradient(circle_at_100%_100%,rgba(59,130,246,0.12),transparent_40%)]"
        />

        {/* Logo — header gọn, không kèm nút thu gọn */}
        <div
          className={cn(
            "relative shrink-0 border-b border-white/10 transition-[padding] duration-300 ease-out",
            collapsed ? "p-3 md:px-2 md:py-3" : "px-4 pt-4 pb-3.5",
          )}
        >
          <button
            type="button"
            onClick={() => {
              onTabChange?.("dashboard");
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center rounded-2xl hover:bg-white/10 transition-all -m-1 p-1 group",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              collapsed ? "md:justify-center md:gap-0 gap-3" : "gap-3",
            )}
            aria-label={collapsed ? "GenVoice AI — Về Dashboard" : undefined}
          >
            <div className="logo-3d-wrapper shrink-0">
              <div className="logo-3d-inner relative">
                <Image
                  src="/logo_3D.png"
                  alt="GenVoice AI Logo"
                  width={128}
                  height={128}
                  priority
                  className={cn(
                    "rounded-2xl object-contain shadow-lg",
                    collapsed ? "size-10" : "size-16",
                    "group-hover:scale-105 transition-transform duration-300",
                  )}
                />
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50"
                  />
                )}
              </div>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col min-w-0 text-left"
                >
                  <span className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
                    GenVoice <span className="text-primary">AI</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </span>
                  <span className="text-[11px] text-foreground/50 -mt-0.5">
                    Text to Speech
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="relative flex flex-1 flex-col min-h-0 py-4">
          {/* Navigation */}
          <nav
            className={cn(
              "shrink-0 space-y-1 transition-[padding] duration-300 ease-out",
              collapsed ? "px-2 md:px-2" : "px-3",
            )}
            aria-label="Điều hướng chính"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.985 }}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full flex items-center rounded-[1.1rem] transition-all duration-300 relative group overflow-hidden",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "min-h-[50px]",
                    collapsed
                      ? "md:justify-center md:px-0 md:py-2.5 gap-0 px-3 py-2.5"
                      : "gap-3 px-3 py-2",
                    isActive
                      ? "text-foreground border border-primary/30 bg-gradient-to-r from-primary/18 via-primary/8 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "text-foreground/72 border border-transparent hover:text-foreground hover:bg-white/8 hover:border-white/10",
                  )}
                >
                  {isActive && (
                    <>
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-primary/12 via-primary/6 to-transparent"
                        aria-hidden
                      />
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                        aria-hidden
                      />
                    </>
                  )}

                  <motion.div
                    className={cn(
                      "relative flex items-center w-full min-w-0",
                      collapsed ? "md:justify-center md:w-auto gap-0" : "gap-3",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl transition-all duration-300 shrink-0",
                        isActive
                          ? "bg-gradient-to-br from-primary to-blue-500 text-primary-foreground shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                          : "bg-white/6 text-foreground/60 group-hover:text-foreground group-hover:bg-white/12",
                      )}
                    >
                      <item.icon
                        className="w-[20px] h-[20px]"
                        strokeWidth={2}
                      />
                    </div>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className={cn(
                            "font-semibold text-sm truncate",
                            isActive ? "text-foreground" : "text-foreground/88",
                          )}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>
              );
            })}
          </nav>

          <div className="flex-1 min-h-0 shrink-0" aria-hidden />

          {config.showSubscriptionUi && (
            <div
              className={cn("mt-auto shrink-0", collapsed ? "p-2" : "p-3 pb-4")}
            >
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/pricing"
                  className={cn(
                    "block w-full rounded-2xl group transition-all border bg-white/8 border-white/12 hover:bg-white/12 hover:border-primary/25 backdrop-blur-xl",
                    collapsed
                      ? "md:p-2.5 md:flex md:flex-col md:items-center p-4 text-left"
                      : "p-4 text-left",
                  )}
                  title="Gói của bạn — xem chi tiết"
                >
                  <div
                    className={cn(
                      "flex items-start gap-3",
                      collapsed && "md:flex-col md:items-center md:gap-2 mb-0",
                    )}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform">
                      <CreditCard className="text-white w-4 h-4" />
                    </div>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="min-w-0 flex-1"
                        >
                          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.15em]">
                            Gói của bạn
                          </p>
                          {isLicenseLoading ? (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/40 shrink-0" />
                              <span className="text-xs text-foreground/50">
                                Đang tải...
                              </span>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-foreground leading-tight mt-1 truncate">
                                {planName}
                              </p>
                              {hasActiveLicense && expiresAt ? (
                                <p className="text-[11px] text-foreground/45 mt-0.5 line-clamp-1">
                                  Hết hạn{" "}
                                  {new Date(expiresAt).toLocaleDateString(
                                    "vi-VN",
                                  )}
                                </p>
                              ) : !isAuthenticated ? (
                                <p className="text-[11px] text-foreground/45 mt-0.5 line-clamp-1">
                                  Đăng nhập để xem gói
                                </p>
                              ) : (
                                <p className="text-[11px] text-foreground/45 mt-0.5 line-clamp-1">
                                  Chưa có gói trả phí
                                </p>
                              )}
                              {!isProPlanCode(activePlanCode) &&
                                isAuthenticated && (
                                  <motion.button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      upgradeToPlan("PRO");
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-3 w-full py-2.5 px-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary/25 border border-white/10"
                                  >
                                    Nâng cấp Pro
                                  </motion.button>
                                )}
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {collapsed && (
                    <div className="hidden md:flex flex-col items-center gap-1 mt-2 w-full px-0.5">
                      {isLicenseLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-foreground/40" />
                      ) : (
                        <span
                          className="text-[10px] font-bold text-center text-foreground leading-tight line-clamp-2 break-words w-full"
                          title={planName}
                        >
                          {planName}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {/* Glass toggle button */}
        {onCollapsedChange && (
          <motion.button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            whileHover={{
              scale: 1.07,
              boxShadow: "0 10px 22px rgba(16,56,140,0.35)",
            }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-[60]",
            )}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            <div
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full",
                "backdrop-blur-xl bg-background/85 border border-white/20",
                "text-foreground/70 shadow-md shadow-black/20",
                "hover:bg-primary/16 hover:text-primary hover:border-primary/25 transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              {collapsed ? (
                <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
              ) : (
                <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
              )}
            </div>
          </motion.button>
        )}
      </motion.aside>
    </>
  );
}
