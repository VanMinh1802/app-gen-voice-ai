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
            "shrink-0 border-b border-border/40",
            collapsed ? "p-3 md:px-2 md:py-3" : "px-5 pt-5 pb-4",
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
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
                <span className="text-[11px] text-foreground/55 dark:text-foreground/50 -mt-0.5">
                  Text to Speech
                </span>
              </div>
            )}
          </button>
        </div>

        <div className="flex flex-1 flex-col min-h-0">
          {/* Navigation — cùng min-height mọi mục; active nhẹ (không khối primary cao) */}
          <nav
            className={cn(
              "shrink-0 space-y-1 mt-1",
              collapsed ? "px-2 md:px-2" : "px-3",
            )}
            aria-label="Điều hướng chính"
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
                    "w-full flex items-center rounded-xl transition-colors duration-200 relative group",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "min-h-[44px]",
                    collapsed
                      ? "md:justify-center md:px-0 md:py-2 gap-0 px-3 py-2.5"
                      : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-primary/14 text-foreground ring-1 ring-inset ring-primary/25 shadow-sm dark:bg-primary/[0.18]"
                      : "text-foreground/72 dark:text-foreground/68 hover:text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.07]",
                  )}
                >
                  {/* Thanh nhấn trái — mỏng, đồng chiều cao với item */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                      aria-hidden
                    />
                  )}

                  <div
                    className={cn(
                      "relative flex items-center w-full min-w-0",
                      collapsed ? "md:justify-center md:w-auto gap-0" : "gap-3",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors duration-200 shrink-0",
                        isActive
                          ? "bg-primary/25 text-primary dark:text-primary"
                          : "bg-black/[0.06] dark:bg-white/[0.08] text-foreground/55 group-hover:bg-black/10 dark:group-hover:bg-white/12 group-hover:text-foreground",
                      )}
                    >
                      <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    </div>
                    {!collapsed && (
                      <span className="font-medium text-sm truncate">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 ml-auto shrink-0 transition-all duration-200",
                        isActive
                          ? "text-primary opacity-90"
                          : isHovered
                            ? "text-foreground/50 translate-x-0.5"
                            : "text-foreground/30",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-h-0 shrink-0" aria-hidden />

          {config.showSubscriptionUi && (
            <div
              className={cn(
                "mt-auto shrink-0",
                collapsed ? "p-2" : "p-3 pb-4",
              )}
            >
            <Link
              href="/pricing"
              className={cn(
                "block w-full glass-card-hover rounded-xl group transition-all border border-border/50",
                collapsed
                  ? "md:p-2.5 md:flex md:flex-col md:items-center p-4 text-left"
                  : "p-3.5 text-left",
              )}
              title="Gói của bạn — xem chi tiết"
            >
              <div
                className={cn(
                  "flex items-start gap-2.5",
                  collapsed && "md:flex-col md:items-center md:gap-1.5 mb-0",
                )}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md shrink-0">
                  <CreditCard className="text-white w-3.5 h-3.5" />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-foreground/50 dark:text-foreground/45 uppercase tracking-[0.14em]">
                      Gói của bạn
                    </p>
                    {isLicenseLoading ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-foreground/50 shrink-0" />
                        <span className="text-xs text-foreground/60">
                          Đang tải...
                        </span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-foreground leading-tight mt-0.5 truncate">
                          {planName}
                        </p>
                        {hasActiveLicense && expiresAt ? (
                          <p className="text-[11px] text-foreground/55 mt-0.5 line-clamp-1">
                            Hết hạn{" "}
                            {new Date(expiresAt).toLocaleDateString("vi-VN")}
                          </p>
                        ) : !isAuthenticated ? (
                          <p className="text-[11px] text-foreground/55 mt-0.5 line-clamp-1">
                            Đăng nhập để xem gói
                          </p>
                        ) : (
                          <p className="text-[11px] text-foreground/55 mt-0.5 line-clamp-1">
                            Chưa có gói trả phí
                          </p>
                        )}
                        {!isProPlanCode(activePlanCode) && isAuthenticated && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              upgradeToPlan("PRO");
                            }}
                            className="mt-2 w-full py-2 px-3 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold rounded-lg transition-colors border border-primary/20"
                          >
                            Nâng cấp Pro
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              {collapsed && (
                <div className="hidden md:flex flex-col items-center gap-1 mt-1.5 w-full px-0.5">
                  {isLicenseLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-foreground/50" />
                  ) : (
                    <span
                      className="text-[9px] font-bold text-center text-foreground leading-tight line-clamp-2 break-words w-full"
                      title={planName}
                    >
                      {planName}
                    </span>
                  )}
                </div>
              )}
            </Link>
            </div>
          )}
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
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
