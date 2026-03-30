"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  User,
  CreditCard,
  SlidersHorizontal,
  Shield,
  Lock,
  ShieldAlert,
  Trash2,
  ChevronRight,
  Moon,
  Bell,
  Mic,
  Gauge,
  Volume2,
  Waves,
  Sparkles,
  Info,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useTheme } from "@/lib/hooks/useTheme";
import { useTtsStore } from "../store";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import { useAuthContext } from "@/components/AuthProvider";
import { canUseVoiceForPlan, PLAN_ACCESS, isProPlanCode } from "@/lib/hooks";
import { useToast } from "@/components/ui/Toast";

type SettingsTab = "personal" | "subscription" | "customization" | "security";

function detectGender(voiceId: string): "male" | "female" {
  const maleKeywords = [
    "nam", "hung", "quang", "thanh", "khoi", "dung",
    "duy", "minh", "anh", "hoang", "phong", "son", "hieu",
  ];
  return maleKeywords.some((kw) => voiceId.toLowerCase().includes(kw))
    ? "male"
    : "female";
}

const GENATION_ACCOUNT_URL =
  process.env.NEXT_PUBLIC_GENATION_STORE_URL || "https://genation.ai";

export function VoiceSettings() {
  const { settings, setSettings } = useTtsStore();
  const {
    user,
    isAuthenticated,
    activePlanCode,
    licenses,
    isLoading: isLicenseLoading,
    upgradeToPlan,
    signIn,
  } = useAuthContext();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    [setSettings, settings],
  );
  const handleSpeedChange = useCallback(
    (v: number) => setSettings({ speed: v }),
    [setSettings],
  );
  const handlePitchChange = useCallback(
    (v: number) => setSettings({ pitch: v }),
    [setSettings],
  );
  const handleVolumeChange = useCallback(
    (v: number) => setSettings({ volume: v }),
    [setSettings],
  );
  const handleNormalizeToggle = useCallback(
    (v: boolean) => setSettings({ normalizeText: v }),
    [setSettings],
  );

  const handleSecurityAction = useCallback(
    (action: "password" | "2fa" | "delete") => {
      const messages: Record<typeof action, string> = {
        password: "Đổi mật khẩu: quản lý tại tài khoản Genation.",
        "2fa": "Xác thực 2 yếu tố: quản lý tại tài khoản Genation.",
        delete: "",
      };
      if (action === "delete") {
        setShowDeleteDialog(true);
        return;
      }
      addToast({ type: "info", message: messages[action], duration: 5000 });
      if (typeof window !== "undefined") {
        window.open(GENATION_ACCOUNT_URL, "_blank");
      }
    },
    [addToast],
  );

  const planInfo = activePlanCode
    ? (Object.values(PLAN_ACCESS).find((p) => p.code === activePlanCode) ??
      (isProPlanCode(activePlanCode) ? PLAN_ACCESS.PRO : PLAN_ACCESS.FREE))
    : PLAN_ACCESS.FREE;
  const planName = planInfo?.name ?? "Miễn phí";
  const activeLicense = licenses.find((l) => l.status === "active");
  const expiresAt = activeLicense?.expiresAt;
  const hasActiveLicense = !!activeLicense;

  const allTabs: {
    id: SettingsTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "personal", label: "Thông tin cá nhân", icon: User },
    { id: "subscription", label: "Gói đăng ký", icon: CreditCard },
    { id: "customization", label: "Tùy chỉnh", icon: SlidersHorizontal },
    { id: "security", label: "Bảo mật", icon: Shield },
  ];
  const tabs = config.showSubscriptionUi
    ? allTabs
    : allTabs.filter((t) => t.id !== "subscription");

  useEffect(() => {
    if (!config.showSubscriptionUi && activeTab === "subscription") {
      setActiveTab("personal");
    }
  }, [activeTab]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          Cài đặt tài khoản
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Cài đặt"
        className="flex border-b border-border gap-8 mb-8 overflow-x-auto whitespace-nowrap pb-4"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  const next = tabs[(index + 1) % tabs.length];
                  setActiveTab(next.id);
                  document.getElementById(`tab-${next.id}`)?.focus();
                } else if (e.key === "ArrowLeft") {
                  const prev = tabs[(index - 1 + tabs.length) % tabs.length];
                  setActiveTab(prev.id);
                  document.getElementById(`tab-${prev.id}`)?.focus();
                } else if (e.key === "Home") {
                  setActiveTab(tabs[0].id);
                  document.getElementById(`tab-${tabs[0].id}`)?.focus();
                } else if (e.key === "End") {
                  const last = tabs[tabs.length - 1];
                  setActiveTab(last.id);
                  document.getElementById(`tab-${last.id}`)?.focus();
                }
              }}
              className={cn(
                "flex items-center gap-2 font-semibold transition-all border-b-2 px-1 -mb-4",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-6">

        {/* Thông tin cá nhân */}
        <div
          role="tabpanel"
          id="panel-personal"
          aria-labelledby="tab-personal"
          tabIndex={0}
          className={cn(activeTab !== "personal" && "hidden")}
        >
          <div className="bg-card border border-primary/10 rounded-xl p-6">
            {!isAuthenticated ? (
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-primary/10 bg-muted flex items-center justify-center text-foreground text-3xl font-bold shrink-0">
                  ?
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Đăng nhập để xem thông tin cá nhân. Hồ sơ được quản lý qua
                    tài khoản Genation.
                  </p>
                  <button
                    type="button"
                    onClick={() => signIn()}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all"
                  >
                    Đăng nhập
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="relative">
                  <div className="size-32 rounded-full border-4 border-primary/10 overflow-hidden bg-muted flex items-center justify-center text-foreground text-4xl font-bold shrink-0">
                    {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground border-2 border-card">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Họ và tên
                      </label>
                      <p className="px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground text-sm">
                        {user?.name || "—"}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Email
                      </label>
                      <p className="px-4 py-2 bg-muted/30 border border-border rounded-lg text-foreground text-sm truncate">
                        {user?.email || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          window.open(GENATION_ACCOUNT_URL, "_blank");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all"
                    >
                      Chỉnh sửa tại Genation
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gói đăng ký */}
        {config.showSubscriptionUi && (
        <div
          role="tabpanel"
          id="panel-subscription"
          aria-labelledby="tab-subscription"
          tabIndex={0}
          className={cn(activeTab !== "subscription" && "hidden")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-primary/10 rounded-xl p-6">
              {!isAuthenticated ? (
                <p className="text-muted-foreground text-sm py-4">
                  Đăng nhập để xem gói đăng ký hiện tại.
                </p>
              ) : isLicenseLoading ? (
                <div className="flex items-center gap-2 py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Đang tải thông tin gói...
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Gói đăng ký hiện tại
                        {hasActiveLicense && (
                          <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black border border-primary/20">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Bạn đang sử dụng gói{" "}
                        <span className="text-foreground font-bold">
                          {planName}
                        </span>
                        {isProPlanCode(activePlanCode) && " (Cá nhân)"}
                      </p>
                    </div>
                    {isProPlanCode(activePlanCode) ? (
                      <Link
                        href="/pricing"
                        className="px-4 py-2 border border-primary text-primary text-sm font-bold rounded-lg hover:bg-primary/5 transition-all inline-block"
                      >
                        Quản lý gói
                      </Link>
                    ) : hasActiveLicense ? (
                      <button
                        type="button"
                        onClick={() => upgradeToPlan("PRO")}
                        className="px-4 py-2 border border-primary text-primary text-sm font-bold rounded-lg hover:bg-primary/5 transition-all"
                      >
                        Nâng cấp Pro
                      </button>
                    ) : (
                      <Link
                        href="/pricing"
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all inline-block"
                      >
                        Nâng cấp Pro
                      </Link>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Chu kỳ thanh toán
                      </span>
                      <span className="text-foreground font-medium">
                        {expiresAt
                          ? `Hết hạn: ${new Date(expiresAt).toLocaleDateString("vi-VN")}`
                          : isProPlanCode(activePlanCode)
                            ? "Pro"
                            : "Miễn phí"}
                      </span>
                    </div>
                    <div className="h-px bg-primary/10" />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Quyền sử dụng giọng
                        </span>
                        <span className="text-foreground font-medium">
                          {isProPlanCode(activePlanCode)
                            ? "Tất cả giọng Pro"
                            : "2 giọng (Miễn phí)"}
                        </span>
                      </div>
                      {isProPlanCode(activePlanCode) && (
                        <p className="text-[11px] text-muted-foreground italic text-right">
                          * Gia hạn qua Genation để tiếp tục dùng Pro
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="bg-card/95 border border-primary/15 rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Nâng cấp Pro
                </h3>
                <p className="text-foreground/85 text-sm leading-relaxed">
                  Mở khóa tất cả giọng nói, chất lượng cao và tùy chỉnh tốc
                  độ/âm lượng.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    Tất cả giọng có sẵn
                  </li>
                  <li className="flex items-center gap-2 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    Xuất WAV, MP3
                  </li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="mt-6 w-full py-3 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all uppercase tracking-wide text-center block"
              >
                Xem các gói
              </Link>
            </div>
          </div>
        </div>
        )}

        {/* Tùy chỉnh */}
        <div
          role="tabpanel"
          id="panel-customization"
          aria-labelledby="tab-customization"
          tabIndex={0}
          className={cn(activeTab !== "customization" && "hidden")}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-primary/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-6">
                Tùy chỉnh giao diện
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Chế độ tối
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Giảm mỏi mắt ban đêm
                      </p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={darkMode}
                    aria-label="Chế độ tối"
                    onClick={() => setTheme(darkMode ? "light" : "dark")}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      darkMode ? "bg-primary" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform",
                        darkMode && "translate-x-5",
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Thông báo đẩy
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cập nhật tiến độ xử lý
                      </p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={notifications}
                    aria-label="Thông báo đẩy"
                    onClick={() => setNotifications(!notifications)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors shrink-0",
                      notifications ? "bg-primary" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform",
                        notifications && "translate-x-5",
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
                    const isLockedForPlan = !canUseVoiceForPlan({
                      planCode: activePlanCode,
                      voiceId: voice.id,
                    });
                    const gender = detectGender(voice.id);
                    const initials = voice.name
                      .replace(" (custom)", "")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const avatarBg =
                      gender === "female"
                        ? "from-pink-500 to-pink-400"
                        : "from-blue-500 to-blue-400";
                    return (
                      <label
                        key={voiceId}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-primary/10 hover:border-primary/30",
                          isLockedForPlan && "opacity-60 cursor-not-allowed",
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
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-primary-foreground font-bold text-sm",
                            avatarBg,
                          )}
                        >
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1">
                          {voice.name.replace(" (custom)", "")}
                          {isLockedForPlan && (
                            <span className="ml-2 text-[10px] font-bold text-primary/80">
                              Pro
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </label>
                    );
                  })}
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <label
                    htmlFor="settings-speed-slider"
                    className="text-muted-foreground flex items-center gap-2 cursor-pointer"
                  >
                    <Gauge className="w-4 h-4" /> Tốc độ
                  </label>
                  <span className="text-foreground font-medium">
                    {speedValue.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="settings-speed-slider"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speedValue}
                  onChange={(e) =>
                    handleSpeedChange(parseFloat(e.target.value))
                  }
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg"
                  aria-label="Tốc độ mặc định"
                />
                <div className="flex items-center justify-between text-sm">
                  <label
                    htmlFor="settings-pitch-slider"
                    className="text-muted-foreground flex items-center gap-2 cursor-pointer"
                  >
                    <Waves className="w-4 h-4" /> Cao độ
                  </label>
                  <span className="text-foreground font-medium">
                    {pitchValue > 0 ? `+${pitchValue}` : pitchValue}
                  </span>
                </div>
                <input
                  id="settings-pitch-slider"
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={pitchValue}
                  onChange={(e) =>
                    handlePitchChange(parseInt(e.target.value))
                  }
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg"
                  aria-label="Cao độ mặc định"
                />
                <p className="text-[10px] text-muted-foreground/70 -mt-1">
                  Âm = thấp hơn, Dương = cao hơn
                </p>
                <div className="flex items-center justify-between text-sm">
                  <label
                    htmlFor="settings-volume-slider"
                    className="text-muted-foreground flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Âm lượng
                  </label>
                  <span className="text-foreground font-medium">
                    {Math.round(volumeValue * 100)}%
                  </span>
                </div>
                <input
                  id="settings-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volumeValue}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg"
                  aria-label="Âm lượng mặc định"
                />
              </div>
              <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-background/50 border border-primary/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span
                    id="normalize-label"
                    className="text-sm text-foreground"
                  >
                    Chuẩn hóa văn bản
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={normalizeTextValue}
                  aria-labelledby="normalize-label"
                  onClick={() => handleNormalizeToggle(!normalizeTextValue)}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors shrink-0",
                    normalizeTextValue ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                      normalizeTextValue && "translate-x-5",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bảo mật */}
        <div
          role="tabpanel"
          id="panel-security"
          aria-labelledby="tab-security"
          tabIndex={0}
          className={cn(activeTab !== "security" && "hidden")}
        >
          <div className="bg-card border border-primary/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-6">
              Bảo mật tài khoản
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Đổi mật khẩu, xác thực 2 yếu tố và xóa tài khoản được quản lý tại
              tài khoản Genation. Bấm vào từng mục để mở trang quản lý.
            </p>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleSecurityAction("password")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-background transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">
                    Đổi mật khẩu
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: "info",
                    message: "Mở tài khoản Genation để quản lý xác thực 2 yếu tố.",
                    duration: 5000,
                  });
                  if (typeof window !== "undefined") {
                    window.open(GENATION_ACCOUNT_URL, "_blank");
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-background transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground block">
                      Xác thực 2 yếu tố (2FA)
                    </span>
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">
                      Quản lý tại Genation
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => handleSecurityAction("delete")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-background transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium text-foreground">
                    Xóa tài khoản
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Về ứng dụng */}
        <div className="bg-card border border-primary/10 rounded-xl p-6 flex items-start gap-3 pb-20">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ứng dụng sử dụng{" "}
              <span className="text-primary font-medium">Piper TTS</span> để
              chuyển văn bản thành giọng nói. Tất cả xử lý diễn ra trực tiếp
              trên trình duyệt — không có âm thanh nào được gửi đến máy chủ.
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">
              Phiên bản 1.0.0 • Text-to-Speech cho tiếng Việt
            </p>
          </div>
        </div>

      </div>

      {/* Delete account confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Xóa tài khoản"
        description="Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa tài khoản"
        cancelLabel="Hủy"
        destructive
        onConfirm={() => {
          setShowDeleteDialog(false);
          if (typeof window !== "undefined") {
            window.open(GENATION_ACCOUNT_URL, "_blank");
          }
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
