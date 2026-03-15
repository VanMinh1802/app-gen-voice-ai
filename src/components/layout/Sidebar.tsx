"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  Mic, 
  History, 
  Settings,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarTab = "dashboard" | "voice_library" | "history" | "settings";

interface SidebarProps {
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab = "dashboard", onTabChange, isOpen = true, onClose }: SidebarProps) {
  const [hoveredTab, setHoveredTab] = useState<SidebarTab | null>(null);

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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-border hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-50",
          "transform transition-all duration-300 ease-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "glass-card"
        )}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Volume2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                GenVoice <span className="text-primary">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 -mt-1">Text to Speech</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isHovered = hoveredTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden group",
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
                  "relative z-10 flex items-center gap-3 w-full",
                  isActive ? "translate-x-1" : ""
                )}>
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-black/5 dark:bg-white/5 text-muted-foreground group-hover:bg-black/10 dark:group-hover:bg-white/10 group-hover:text-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>

                {/* Chevron indicator */}
                <ChevronRight className={cn(
                  "w-4 h-4 ml-auto transition-transform duration-200",
                  isActive || isHovered ? "text-primary translate-x-1" : "text-muted-foreground opacity-70"
                )} />
              </button>
            );
          })}
        </nav>

        {/* Premium Plan Card */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => {
              window.location.href = "/settings?tab=credits";
            }}
            className="w-full text-left glass-card-hover rounded-2xl p-5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">★</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Premium
                </p>
              </div>
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                Nâng cấp →
              </span>
            </div>
            <p className="text-base font-bold mb-3 text-foreground flex items-center gap-2">
              250/1000 credits
              <span className="text-[10px] font-normal text-muted-foreground">/tháng</span>
            </p>
            <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full mb-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary relative overflow-hidden"
                style={{ width: "25%" }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Còn 750 credits</p>
          </button>
        </div>
      </aside>
    </>
  );
}
