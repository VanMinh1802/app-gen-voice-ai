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
          "w-64 border-r border-border bg-card hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-50",
          "transform transition-all duration-300 ease-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#2563eb] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Volume2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                VietVoice <span className="text-[#7c3aed]">AI</span>
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
                    ? "bg-gradient-to-r from-primary/20 to-primary/5 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
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
                    "p-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>

                {/* Chevron indicator */}
                <ChevronRight className={cn(
                  "w-4 h-4 ml-auto transition-transform duration-200",
                  isActive || isHovered ? "text-primary translate-x-1" : "text-muted-foreground"
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
            className="w-full text-left bg-gradient-to-br from-[#7c3aed]/10 to-[#2563eb]/10 hover:from-[#7c3aed]/20 hover:to-[#2563eb]/20 rounded-2xl p-5 border border-[#7c3aed]/20 hover:border-[#7c3aed]/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">★</span>
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Premium
                </p>
              </div>
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0">
                Nâng cấp →
              </span>
            </div>
            <p className="text-base font-bold mb-3 text-white flex items-center gap-2">
              250/1000 credits
              <span className="text-[10px] font-normal text-slate-500">/tháng</span>
            </p>
            <div className="w-full bg-slate-800 h-2 rounded-full mb-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#2563eb] relative overflow-hidden" 
                style={{ width: "25%" }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-slate-500">Còn 750 credits</p>
          </button>
        </div>
      </aside>
    </>
  );
}
