"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Mic,
  History,
  Settings,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
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

export function Sidebar({
  activeTab = "dashboard",
  onTabChange,
  isOpen = true,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const [hoveredTab, setHoveredTab] = useState<SidebarTab | null>(null);
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

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "voice_library" as const, label: "Thư viện giọng", icon: Mic },
    { id: "history" as const, label: "Lịch sử", icon: History },
    { id: "settings" as const, label: "Cài đặt", icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "relative overflow-visible border-r border-border flex flex-col fixed top-0 left-0 bottom-0 z-50",
          "transform transition-all duration-300 ease-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "glass-card",
          collapsed ? "w-64 md:w-[4.5rem]" : "w-64",
        )}
      >
        {/* Logo — header gọn, không kèm nút thu gọn */}
        <div
          className={cn(
            "shrink-0 border-b border-border/30",
            collapsed ? "p-3 md:px-2 md:py-3" : "p-6 pb-4",
          )}
        >
          <button
            type="button"
            onClick={() => {
              onTabChange?.("dashboard");
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors -m-2 p-2",
              collapsed ? "md:justify-center md:gap-0 gap-3" : "gap-3",
            )}
            aria-label={collapsed ? "GenVoice AI — Về Dashboard" : undefined}
          >
            <div className="logo-3d-wrapper shrink-0">
              <div className="logo-3d-inner">
                <Image
                  src="/logo_3D.png"
                  alt="GenVoice AI Logo"
                  width={128}
                  height={128}
                  priority
                  className={cn(
                    "rounded-xl object-contain shadow-lg",
                    collapsed ? "size-10" : "size-16",
                  )}
                />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  GenVoice <span className="text-primary">AI</span>
                </span>
                <span className="text-[10px] text-muted-foreground -mt-1">
                  Text to Speech
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="flex flex-1 flex-col min-h-0">
          {/* Navigation */}
          <nav
            className={cn(
              "shrink-0 space-y-2 mt-2",
              collapsed ? "px-2 md:px-2" : "px-4",
            )}
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isHovered = hoveredTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "w-full flex items-center rounded-xl transition-all duration-200 relative overflow-hidden group",
                    collapsed
                      ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3"
                      : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}

                  {/* Hover background */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-xl transition-opacity duration-200",
                      isHovered && !isActive ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <div
                    className={cn(
                      "relative z-10 flex items-center w-full min-w-0",
                      collapsed ? "md:justify-center md:w-auto gap-3" : "gap-3",
                      isActive && !collapsed ? "translate-x-1" : "",
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-xl transition-all duration-200 shrink-0",
                        isActive
                          ? "bg-white/20 text-primary-foreground"
                          : "bg-black/5 dark:bg-white/5 text-muted-foreground group-hover:bg-black/10 dark:group-hover:bg-white/10 group-hover:text-foreground",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    {!collapsed && (
                      <span className="font-medium truncate">{item.label}</span>
                    )}
                  </div>

                  {/* Chevron indicator - ẩn khi thu gọn */}
                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 ml-auto shrink-0 transition-transform duration-200",
                        isActive || isHovered
                          ? "text-primary translate-x-1"
                          : "text-muted-foreground opacity-70",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-h-0 shrink-0" aria-hidden />

          {/* Plan Card - real license data */}
          <div
            className={cn("mt-auto shrink-0", collapsed ? "p-2 md:p-2" : "p-4")}
          >
            <Link
              href="/pricing"
              className={cn(
                "block w-full glass-card-hover rounded-2xl group transition-all",
                collapsed
                  ? "md:p-3 md:flex md:flex-col md:items-center p-5 text-left"
                  : "p-5 text-left",
              )}
              title="Gói của bạn"
            >
              <div
                className={cn(
                  "flex items-center justify-between",
                  collapsed && "md:flex-col md:gap-2 md:mb-0 mb-3",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shrink-0">
                    <CreditCard className="text-white w-3.5 h-3.5" />
                  </div>
                  {!collapsed && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Gói của bạn
                    </p>
                  )}
                </div>
                {!collapsed && (
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                    Xem gói →
                  </span>
                )}
              </div>
              {isLicenseLoading ? (
                <div
                  className={cn(
                    "flex items-center gap-2 py-2",
                    collapsed && "md:justify-center",
                  )}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                  {!collapsed && (
                    <span className="text-sm text-muted-foreground">
                      Đang tải...
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <p
                    className={cn(
                      "text-base font-bold mb-1 text-foreground flex items-center gap-2",
                      collapsed && "md:justify-center md:mb-0 md:text-sm",
                    )}
                  >
                    {planName}
                  </p>
                  {!collapsed && (
                    <>
                      {hasActiveLicense && expiresAt ? (
                        <p className="text-xs text-muted-foreground">
                          Hết hạn:{" "}
                          {new Date(expiresAt).toLocaleDateString("vi-VN")}
                        </p>
                      ) : !isAuthenticated ? (
                        <p className="text-xs text-muted-foreground">
                          Đăng nhập để xem gói
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Chưa có gói trả phí
                        </p>
                      )}
                      {!isProPlanCode(activePlanCode) && isAuthenticated && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            upgradeToPlan("PRO");
                          }}
                          className="mt-2 w-full py-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-xl transition-colors"
                        >
                          Nâng cấp Pro
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </Link>
          </div>
        </div>

        {/* Chỉ mũi tên, nằm đúng mép phải sidebar (desktop) */}
        {onCollapsedChange && (
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "hidden md:flex absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2 z-[60]",
              "h-9 w-9 items-center justify-center rounded-2xl",
              "bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-600/80",
              "text-slate-700 dark:text-zinc-200 shadow-md shadow-slate-900/8",
              "hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-500 transition-colors active:scale-95",
            )}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? (
              <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
