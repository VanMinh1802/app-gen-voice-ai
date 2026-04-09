"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Mic, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type BottomNavTab = "dashboard" | "voice_library" | "history" | "settings";

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
}

const navItems = [
  { id: "dashboard" as const, label: "Tạo", icon: LayoutDashboard },
  { id: "voice_library" as const, label: "Thư viện", icon: Mic },
  { id: "history" as const, label: "Lịch sử", icon: History },
  { id: "settings" as const, label: "Cài đặt", icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-pb"
    >
      <div className="bg-background/95 backdrop-blur-2xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <nav
          className="flex items-center justify-around h-16 px-2"
          aria-label="Điều hướng chính"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full max-w-[80px] group",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-x-2 -top-px h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  className={cn(
                    "flex items-center justify-center transition-colors duration-200",
                    isActive
                      ? "text-primary"
                      : "text-foreground/55 group-hover:text-foreground",
                  )}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.1 }}
                >
                  <item.icon
                    className={cn(
                      "w-6 h-6 transition-transform duration-200",
                      isActive && "scale-110",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>

                <span
                  className={cn(
                    "text-[10px] font-medium mt-0.5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-foreground/55",
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </motion.div>
  );
}
