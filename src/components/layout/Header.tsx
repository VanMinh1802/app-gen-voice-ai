"use client";

import { useState } from "react";
import { 
  Bell, 
  Settings, 
  LogOut, 
  User,
  CreditCard,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  isLoggedIn?: boolean;
  avatarUrl?: string;
  userName?: string;
  isPro?: boolean;
  onSettingsClick?: () => void;
  onUserMenuClick?: () => void;
}

export function Header({
  title = "Tạo giọng nói mới",
  isLoggedIn = true,
  avatarUrl,
  userName = "Quang Minh",
  isPro = true,
  onSettingsClick,
  onUserMenuClick,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Model mới đã sẵn sàng", desc: "Giọng Linh Lan đã được cập nhật", time: "2 phút trước", unread: true },
    { id: 2, title: "Hoàn thành tạo audio", desc: "Bản tin buổi sáng đã sẵn sàng", time: "1 giờ trước", unread: true },
    { id: 3, title: "Credit còn 250", desc: "Bạn còn 250 credits", time: "1 ngày trước", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2.5 hover:bg-foreground/5 rounded-xl transition-all relative group"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-top-right z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 border-b border-border/50 hover:bg-foreground/5 transition-colors cursor-pointer",
                      notif.unread && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        notif.unread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">{notif.time}</p>
                      </div>
                      {notif.unread && (
                        <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <button className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium py-2 transition-colors">
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-2">
          <button 
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 pr-3 hover:bg-foreground/5 rounded-xl transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-foreground">{userName}</p>
              {isPro && (
                <p className="text-[10px] text-amber-400 font-medium">PRO</p>
              )}
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform hidden sm:block",
              showUserMenu && "rotate-180"
            )} />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in origin-top-right z-50">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-bold text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">quangminh@email.com</p>
              </div>
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground text-left">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Hồ sơ</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground text-left">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Quản lý Credits</span>
                  <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">250</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground text-left">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Cài đặt</span>
                </button>
              </div>
              <div className="p-2 border-t border-border">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 text-left">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
}
