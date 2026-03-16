"use client";

import { useState, useCallback } from "react";
import {
  User,
  CreditCard,
  SlidersHorizontal,
  Shield,
  Pencil,
  Check,
  Lock,
  ShieldAlert,
  Trash2,
  ChevronRight,
  Globe,
  Moon,
  Bell,
  Mic,
  Gauge,
  Volume2,
  Waves,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/hooks/useTheme";
import { useTtsStore } from "../store";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import { useAuthContext } from "@/components/AuthProvider";
import { canUseVoiceForPlan } from "@/lib/hooks";

type SettingsTab = "personal" | "subscription" | "customization" | "security";

function detectGender(voiceId: string): "male" | "female" {
  const maleKeywords = ["nam", "hung", "quang", "thanh", "khoi", "dung", "duy", "minh", "anh", "hoang", "phong", "son", "hieu"];
  return maleKeywords.some((kw) => voiceId.toLowerCase().includes(kw)) ? "male" : "female";
}

export function VoiceSettings() {
  const { settings, setSettings } = useTtsStore();
  const { activePlanCode } = useAuthContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");

  // Form state (Thông tin cá nhân)
  const [fullName, setFullName] = useState("Quang Minh");
  const [email, setEmail] = useState("quangminh@email.com");
  const [phone, setPhone] = useState("+84 901 234 567");
  const [location, setLocation] = useState("Việt Nam");

  // Customization state
  const [language, setLanguage] = useState("vi");
  const { theme, setTheme } = useTheme();
  const darkMode = theme === "dark";
  const [notifications, setNotifications] = useState(true);

  const speedValue = Number(settings.speed) || 1;
  const pitchValue = Number(settings.pitch) || 0;
  const volumeValue = Number(settings.volume) || 1;
  const normalizeTextValue = settings.normalizeText ?? true;

  const handleVoiceSelect = useCallback(
    (voiceId: string) => {
      setSettings({
        voice: voiceId as typeof settings.voice,
        model: voiceId as typeof settings.model,
      });
    },
    [setSettings, settings]
  );
  const handleSpeedChange = useCallback((v: number) => setSettings({ speed: v }), [setSettings]);
  const handlePitchChange = useCallback((v: number) => setSettings({ pitch: v }), [setSettings]);
  const handleVolumeChange = useCallback((v: number) => setSettings({ volume: v }), [setSettings]);
  const handleNormalizeToggle = useCallback((v: boolean) => setSettings({ normalizeText: v }), [setSettings]);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "personal", label: "Thông tin cá nhân", icon: User },
    { id: "subscription", label: "Gói đăng ký", icon: CreditCard },
    { id: "customization", label: "Tùy chỉnh", icon: SlidersHorizontal },
    { id: "security", label: "Bảo mật", icon: Shield },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground mt-1">Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-primary/10 gap-8 mb-8 overflow-x-auto whitespace-nowrap pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 font-semibold transition-all border-b-2 px-1 -mb-4",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <section className="space-y-6">
        {/* Thông tin cá nhân */}
        {activeTab === "personal" && (
          <div className="bg-card border border-primary/10 rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative group">
                <div className="size-32 rounded-full border-4 border-primary/10 overflow-hidden bg-muted flex items-center justify-center text-foreground text-4xl font-bold">
                  {fullName.charAt(0)}
                </div>
                <button
                  type="button"
                  className="absolute bottom-1 right-1 size-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground border-2 border-card hover:scale-110 transition-transform"
                  aria-label="Đổi avatar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Họ và tên</label>
                    <input
                      className="w-full bg-background border border-primary/10 rounded-lg px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      className="w-full bg-background border border-primary/10 rounded-lg px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Số điện thoại</label>
                    <input
                      className="w-full bg-background border border-primary/10 rounded-lg px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vị trí</label>
                    <select
                      className="w-full bg-background border border-primary/10 rounded-lg px-4 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option>Việt Nam</option>
                      <option>Hoa Kỳ</option>
                      <option>Khác</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Hủy
                  </button>
                  <button type="button" className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all">
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gói đăng ký */}
        {activeTab === "subscription" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-primary/10 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Gói đăng ký hiện tại
                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-primary/20">
                      Active
                    </span>
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Bạn đang sử dụng gói <span className="text-foreground font-bold">Pro Member</span> (Cá nhân)
                  </p>
                </div>
                <button type="button" className="px-4 py-2 border border-primary text-primary text-sm font-bold rounded-lg hover:bg-primary/5 transition-all">
                  Gia hạn
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chu kỳ thanh toán</span>
                  <span className="text-foreground font-medium">Hàng tháng (Thanh toán tiếp: 15/10/2023)</span>
                </div>
                <div className="h-px bg-primary/10" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hạn mức ký tự (Credits)</span>
                    <span className="text-foreground font-medium">75,000 / 100,000</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-primary/10">
                    <div className="bg-primary h-full rounded-full" style={{ width: "75%" }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic text-right">* Tự động làm mới vào ngày 15 hàng tháng</p>
                </div>
              </div>
            </div>
            <div className="bg-card/95 border border-primary/15 rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Nâng cấp Business</h3>
                <p className="text-foreground/85 text-sm leading-relaxed">
                  Mở khóa giọng nói độc quyền, cộng tác nhóm và API không giới hạn.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    500,000 ký tự/tháng
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    Clone giọng nói siêu thực
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="mt-6 w-full py-3 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all uppercase tracking-wide"
              >
                Xem các gói
              </button>
            </div>
          </div>
        )}

        {/* Tùy chỉnh */}
        {activeTab === "customization" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-primary/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">Tùy chỉnh giao diện</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Ngôn ngữ hiển thị</p>
                        <p className="text-xs text-muted-foreground">Tiếng Việt</p>
                      </div>
                    </div>
                    <select
                      className="bg-background border border-primary/10 rounded-lg text-xs text-foreground px-2 py-1"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Chế độ tối</p>
                        <p className="text-xs text-muted-foreground">Giảm mỏi mắt ban đêm</p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={darkMode}
                      onClick={() => setTheme(darkMode ? "light" : "dark")}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors shrink-0",
                        darkMode ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform",
                          darkMode && "translate-x-5"
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Thông báo đẩy</p>
                        <p className="text-xs text-muted-foreground">Cập nhật tiến độ xử lý</p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={notifications}
                      onClick={() => setNotifications(!notifications)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors shrink-0",
                        notifications ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform",
                          notifications && "translate-x-5"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-primary/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Giọng nói mặc định
                </h3>
                <div className="space-y-3">
                  {config.customModels
                    .filter((voice) => config.activeVoiceIds.includes(voice.id))
                    .map((voice) => {
                      const voiceId = `${CUSTOM_MODEL_PREFIX}${voice.id}`;
                      const isSelected = settings.voice === voiceId;
                      const isLockedForPlan = !canUseVoiceForPlan({ planCode: activePlanCode, voiceId: voice.id });
                      const gender = detectGender(voice.id);
                      const initials = voice.name.replace(" (custom)", "").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                      const avatarBg = gender === "female" ? "from-pink-500 to-pink-400" : "from-blue-500 to-blue-400";
                      return (
                        <label
                          key={voiceId}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            isSelected ? "border-primary bg-primary/10" : "border-primary/10 hover:border-primary/30",
                            isLockedForPlan && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <input
                            type="radio"
                            name="voice"
                            value={voiceId}
                            checked={isSelected}
                            onChange={() => {
                              if (!isLockedForPlan) handleVoiceSelect(voiceId);
                            }}
                            className="sr-only"
                          />
                          <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-primary-foreground font-bold text-sm", avatarBg)}>
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-foreground flex-1">
                            {voice.name.replace(" (custom)", "")}
                            {isLockedForPlan && <span className="ml-2 text-[10px] font-bold text-primary/80">Pro</span>}
                          </span>
                          {isSelected && <Check className="w-5 h-5 text-primary" />}
                        </label>
                      );
                    })}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Gauge className="w-4 h-4" /> Tốc độ</span>
                    <span className="text-foreground font-medium">{speedValue.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speedValue}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-muted rounded-lg"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Waves className="w-4 h-4" /> Cao độ</span>
                    <span className="text-foreground font-medium">{pitchValue > 0 ? `+${pitchValue}` : pitchValue}</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={pitchValue}
                    onChange={(e) => handlePitchChange(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-muted rounded-lg"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Volume2 className="w-4 h-4" /> Âm lượng</span>
                    <span className="text-foreground font-medium">{Math.round(volumeValue * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volumeValue}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-muted rounded-lg"
                  />
                </div>
                <label className="flex items-center justify-between mt-4 p-3 rounded-lg bg-background/50 border border-primary/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">Chuẩn hóa văn bản</span>
                  </div>
                  <button
                    role="switch"
                    aria-checked={normalizeTextValue}
                    onClick={() => handleNormalizeToggle(!normalizeTextValue)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      normalizeTextValue ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform", normalizeTextValue && "translate-x-5")} />
                  </button>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Bảo mật */}
        {activeTab === "security" && (
          <div className="bg-card border border-primary/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Bảo mật tài khoản</h3>
            <div className="space-y-4">
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-background transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Đổi mật khẩu</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-background transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground block">Xác thực 2 yếu tố (2FA)</span>
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Chưa kích hoạt</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-red-900/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium text-foreground">Xóa tài khoản</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Về ứng dụng - hiển thị ở mọi tab phía dưới */}
        <div className="bg-card border border-primary/10 rounded-xl p-6 flex items-start gap-3 pb-20">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ứng dụng sử dụng <span className="text-primary font-medium">Piper TTS</span> để chuyển văn bản thành giọng nói.
              Tất cả xử lý diễn ra trực tiếp trên trình duyệt — không có âm thanh nào được gửi đến máy chủ.
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">Phiên bản 1.0.0 • Text-to-Speech cho tiếng Việt</p>
          </div>
        </div>
      </section>
    </div>
  );
}
