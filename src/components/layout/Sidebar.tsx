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

export function Sidebar({ activeTab = "dashboard", onTabChange, isOpen = true, onClose, collapsed = false, onCollapsedChange }: SidebarProps) {
  const [hoveredTab, setHoveredTab] = useState<SidebarTab | null>(null);
  const { isAuthenticated, activePlanCode, isLoading: isLicenseLoading, licenses, upgradeToPlan } = useAuthContext();

  const planInfo = activePlanCode ? Object.values(PLAN_ACCESS).find((p) => p.code === activePlanCode) : null;
  const planName = planInfo?.name ?? (isProPlanCode(activePlanCode) ? "Pro" : "Miễn phí");
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
          "border-r border-border flex flex-col fixed top-0 left-0 bottom-0 z-50",
          "transform transition-all duration-300 ease-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "glass-card",
          collapsed ? "w-64 md:w-[4.5rem]" : "w-64"
        )}
      >
        {/* Logo - bấm vào quay về Dashboard */}
        <div className={cn("shrink-0", collapsed ? "p-3 md:px-2 md:py-4" : "p-6")}>
          <button
            type="button"
            onClick={() => {
              onTabChange?.("dashboard");
              onClose?.();
            }}
            className={cn(
              "w-full flex items-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors -m-2 p-2",
              collapsed ? "md:justify-center md:gap-0 gap-3" : "gap-3"
            )}
            aria-label="Về Dashboard"
          >
            <div className="logo-3d-wrapper shrink-0">
              <div className="logo-3d-inner">
                <video
                  src="/logo_3d_rmbr.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={cn("rounded-xl object-contain shadow-lg", collapsed ? "w-16 h-35 md:w-10 md:h-10" : "w-16 h-35")}
                />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  GenVoice <span className="text-primary">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 -mt-1">Text to Speech</span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 space-y-2 mt-2", collapsed ? "px-2 md:px-2" : "px-4")}>
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
                className={cn(
                  "w-full flex items-center rounded-xl transition-all duration-200 relative overflow-hidden group",
                  collapsed ? "md:justify-center md:px-0 md:py-3 gap-3 px-4 py-3" : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}

                {/* Hover background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-xl transition-opacity duration-200",
                  isHovered && !isActive ? "opacity-100" : "opacity-0"
                )} />

                <div className={cn(
                  "relative z-10 flex items-center w-full min-w-0",
                  collapsed ? "md:justify-center md:w-auto gap-3" : "gap-3",
                  isActive && !collapsed ? "translate-x-1" : ""
                )}>
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-200 shrink-0",
                    isActive
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-black/5 dark:bg-white/5 text-muted-foreground group-hover:bg-black/10 dark:group-hover:bg-white/10 group-hover:text-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                </div>

                {/* Chevron indicator - ẩn khi thu gọn */}
                {!collapsed && (
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-auto shrink-0 transition-transform duration-200",
                    isActive || isHovered ? "text-primary translate-x-1" : "text-muted-foreground opacity-70"
                  )} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Nút thu gọn / mở rộng sidebar - chỉ desktop */}
        {onCollapsedChange && (
          <div className={cn("shrink-0 px-4 pb-2", collapsed && "md:px-2")}>
            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                collapsed && "md:justify-center md:px-0"
              )}
              aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Thu gọn</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Plan Card - real license data */}
        <div className={cn("mt-auto shrink-0", collapsed ? "p-2 md:p-2" : "p-4")}>
          <Link
            href="/pricing"
            className={cn(
              "block w-full glass-card-hover rounded-2xl group transition-all",
              collapsed ? "md:p-3 md:flex md:flex-col md:items-center p-5 text-left" : "p-5 text-left"
            )}
            title="Gói của bạn"
          >
            <div className={cn("flex items-center justify-between", collapsed && "md:flex-col md:gap-2 md:mb-0 mb-3")}>
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
              <div className={cn("flex items-center gap-2 py-2", collapsed && "md:justify-center")}>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                {!collapsed && <span className="text-sm text-muted-foreground">Đang tải...</span>}
              </div>
            ) : (
              <>
                <p className={cn("text-base font-bold mb-1 text-foreground flex items-center gap-2", collapsed && "md:justify-center md:mb-0 md:text-sm")}>
                  {planName}
                </p>
                {!collapsed && (
                  <>
                    {hasActiveLicense && expiresAt ? (
                      <p className="text-xs text-muted-foreground">
                        Hết hạn: {new Date(expiresAt).toLocaleDateString("vi-VN")}
                      </p>
                    ) : !isAuthenticated ? (
                      <p className="text-xs text-muted-foreground">Đăng nhập để xem gói</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Chưa có gói trả phí</p>
                    )}
                    {!isProPlanCode(activePlanCode) && isAuthenticated && (
                      <button
                        onClick={(e) => { e.preventDefault(); upgradeToPlan("PRO"); }}
                        className="mt-2 w-full py-1.5 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors"
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
      </aside>
    </>
  );
}
