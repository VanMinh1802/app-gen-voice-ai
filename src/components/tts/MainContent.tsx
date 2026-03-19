"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Headphones, SlidersHorizontal, Edit3, User, Settings, CheckCircle, Play, Pause, Hourglass, Activity, Clock, Check, RefreshCw, AlertCircle, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { config, CUSTOM_MODEL_PREFIX, popularVoiceIds } from "@/config";
import { voiceMetadata, getVoiceMetadata } from "@/config/voiceData";
import { useTts } from "@/features/tts/context/TtsContext";
import { VoiceCardShared } from "./VoiceCardShared";
import { useTtsStore } from "@/features/tts/store";
import { isTextValid } from "@/lib/text-processing/textProcessor";
import type { VoiceId } from "@/config";
import { useAuthContext } from "@/components/AuthProvider";
import { canUseVoiceForPlan } from "@/lib/hooks";

// Text Input Component
interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInput({
  value,
  onChange,
  maxLength = 5000,
  disabled = false,
}: TextInputProps) {
  const characterCount = value.length;
  const isOverLimit = characterCount > maxLength;
  const progress = Math.min((characterCount / maxLength) * 100, 100);

  return (
    <div className="glass-card rounded-2xl p-6 border border-border hover:border-border/80 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span className="text-foreground">Văn bản cần chuyển đổi</span>
        </label>
        <div className="flex items-center gap-3">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-black/5 dark:bg-white/5 text-muted-foreground rounded-lg border border-border">
            <span className="text-xs">Ctrl</span>
            <span className="opacity-70">+</span>
            <span>Enter</span>
          </kbd>
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            isOverLimit 
              ? "bg-red-500/20 text-red-400" 
              : characterCount > maxLength * 0.8 
                ? "bg-amber-500/20 text-amber-500"
                : "text-muted-foreground"
          }`}>
            {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Progress bar underneath */}
      <div className="w-full h-1 bg-black/10 dark:bg-white/10 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            isOverLimit 
              ? "bg-red-500" 
              : progress > 80 
                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                : "bg-primary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập văn bản tiếng Việt của bạn tại đây..."
        disabled={disabled}
        className={cn(
          "w-full min-h-[180px] sm:min-h-[220px] lg:min-h-[280px] xl:min-h-[320px] glass-input border border-border rounded-xl p-4 sm:p-5",
          "text-foreground placeholder:text-muted-foreground resize-none font-medium leading-relaxed",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed",
          isOverLimit && "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
        )}
        aria-label="Nhập văn bản cần chuyển thành giọng nói"
      />
    </div>
  );
}

// Same-origin placeholder to avoid COEP blocking external avatars
function getVoicePlaceholderUrl(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#2563eb"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface VoiceSelectionProps {
  selectedVoice: VoiceId;
  onVoiceChange: (voiceId: VoiceId) => void;
  isLoading?: boolean;
  disabled?: boolean;
  previewingVoiceId?: string | null;
  onPreview?: (voiceId: string) => void;
  onViewAllClick?: () => void;
}

type RegionFilter = "all" | "Miền Bắc" | "Miền Trung" | "Miền Nam";
type GenderFilter = "all" | "Nam" | "Nữ";

export function VoiceSelection({
  selectedVoice,
  onVoiceChange,
  isLoading = false,
  disabled = false,
  previewingVoiceId = null,
  onPreview,
  onViewAllClick,
}: VoiceSelectionProps) {
  const { activePlanCode } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  // Cùng nguồn voiceMetadata với Thư viện giọng — chỉ lấy giọng active
  const sortedVoices = useMemo(() => {
    return voiceMetadata
      .filter((v) => config.activeVoiceIds.includes(v.id))
      .sort((a, b) => {
        const aPopular = popularVoiceIds.includes(a.id) ? 0 : 1;
        const bPopular = popularVoiceIds.includes(b.id) ? 0 : 1;
        return aPopular - bPopular;
      });
  }, []);

  // Filter theo search + region + gender
  const filteredVoices = useMemo(() => {
    return sortedVoices.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!v.name.toLowerCase().includes(q) && !v.region.toLowerCase().includes(q) && !v.gender.toLowerCase().includes(q)) return false;
      }
      if (regionFilter !== "all" && v.region !== regionFilter) return false;
      if (genderFilter !== "all" && v.gender !== genderFilter) return false;
      return true;
    });
  }, [sortedVoices, searchQuery, regionFilter, genderFilter]);

  const selectedVoiceId = selectedVoice.startsWith(CUSTOM_MODEL_PREFIX)
    ? selectedVoice.slice(CUSTOM_MODEL_PREFIX.length)
    : "";
  const selectedVoiceMeta = selectedVoiceId ? getVoiceMetadata(selectedVoiceId) : undefined;

  const handleSelectVoice = useCallback(
    (voiceId: VoiceId) => {
      onVoiceChange(voiceId);
      setIsOpen(false);
    },
    [onVoiceChange]
  );

  // Cập nhật vị trí dropdown khi mở / resize / scroll (để render qua portal)
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const vh70 = Math.floor(0.7 * window.innerHeight);
    const maxHeight = Math.max(280, Math.min(520, vh70, spaceBelow));
    const width = Math.min(Math.max(rect.width, 300), window.innerWidth - rect.left - 16);
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return;
    }
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inCard = dropdownRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inCard && !inPanel) setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-lg">
        <div className="mb-5">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-foreground">Chọn giọng đọc</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 ml-10">Giọng tiếng Việt</p>
        </div>
        
        {/* Loading skeleton */}
        <div className="flex flex-col items-center justify-center py-8 mb-4">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium mb-2">Đang khởi tạo công cụ TTS...</p>
          <p className="text-xs text-muted-foreground">Chỉ mất vài giây lần đầu, lần sau sẽ nhanh hơn</p>
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full h-16 bg-muted/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-4 sm:p-6 border border-border hover:border-border/80 transition-all relative",
        isOpen && "z-[100]"
      )}
      ref={dropdownRef}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-foreground">Chọn giọng đọc</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">Chọn giọng phù hợp với nội dung của bạn</p>
      </div>

      {/* Trigger: dropdown hiển thị giọng đang chọn */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-2 sm:gap-3 rounded-xl border-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-left transition-all",
          isOpen ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-primary/50 bg-primary/5 hover:border-primary/70 hover:bg-primary/10",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={selectedVoiceMeta ? `Đang chọn ${selectedVoiceMeta.name}, nhấn để mở danh sách` : "Chọn giọng đọc"}
      >
        {selectedVoiceMeta ? (
          <>
            <div
              className="size-10 shrink-0 rounded-xl flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/30"
              style={{ backgroundColor: selectedVoiceMeta.avatarColor }}
            >
              {selectedVoiceMeta.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Check className="w-3 h-3 shrink-0" />
                Đang chọn
              </span>
              <p className="text-sm font-bold text-foreground truncate mt-1">{selectedVoiceMeta.name}</p>
              <p className="text-[11px] text-muted-foreground">{selectedVoiceMeta.region} • {selectedVoiceMeta.gender}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 py-1">
            <p className="text-sm font-medium text-muted-foreground">Chọn giọng...</p>
          </div>
        )}
        <ChevronDown className={cn("w-5 h-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown panel: flex + height cố định để vùng list luôn scroll được */}
      {isOpen && dropdownPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="flex flex-col rounded-xl border border-border bg-card shadow-xl overflow-hidden z-[200]"
          style={{
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            height: dropdownPosition.maxHeight,
            maxHeight: dropdownPosition.maxHeight,
          }}
        >
          {/* Header: search + filter — không co lại */}
          <div className="shrink-0 p-3 border-b border-border space-y-3 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm giọng theo tên, vùng..."
                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase mr-1">Vùng:</span>
              {(["all", "Miền Bắc", "Miền Trung", "Miền Nam"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegionFilter(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                    regionFilter === r ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {r === "all" ? "Tất cả" : r}
                </button>
              ))}
              <span className="text-[10px] font-semibold text-muted-foreground uppercase ml-2 mr-1">Giới tính:</span>
              {(["all", "Nam", "Nữ"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                    genderFilter === g ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {g === "all" ? "Tất cả" : g}
                </button>
              ))}
            </div>
          </div>
          {/* Danh sách giọng: chiếm phần còn lại, luôn scroll */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-1.5 custom-scrollbar voice-list-scroll"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {filteredVoices.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Không có giọng phù hợp</p>
            ) : (
              filteredVoices.map((voice) => {
                const voiceId = `${CUSTOM_MODEL_PREFIX}${voice.id}` as VoiceId;
                const isLockedForPlan = !canUseVoiceForPlan({ planCode: activePlanCode, voiceId: voice.id });
                return (
                  <VoiceCardShared
                    key={voice.id}
                    voice={voice}
                    variant="compact"
                    isSelected={selectedVoice === voiceId}
                    isPreviewing={previewingVoiceId === voiceId}
                    isActive={true}
                    showPopularBadge={popularVoiceIds.includes(voice.id)}
                    onSelect={() => handleSelectVoice(voiceId)}
                    onPreview={() => onPreview?.(voiceId)}
                    disabled={disabled || isLockedForPlan}
                  />
                );
              })
            )}
          </div>
          {onViewAllClick && (
            <div className="shrink-0 p-2 border-t border-border bg-card">
              <button
                type="button"
                onClick={() => { setIsOpen(false); onViewAllClick(); }}
                className="w-full py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg flex items-center justify-center gap-1.5"
              >
                <span>Mở thư viện giọng</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Audio Customization Component
interface AudioCustomizationProps {
  speed?: number;
  pitch?: number;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
  disabled?: boolean;
}

export function AudioCustomization({
  speed,
  pitch,
  onSpeedChange,
  onPitchChange,
  disabled = false,
}: AudioCustomizationProps) {
  // Ensure controlled inputs always receive a number (avoid undefined from old persisted settings)
  const pitchValue = Number(pitch) || 0;
  const speedValue = Number(speed) || 1;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-border hover:border-border/80 transition-all">
      <h3 className="text-sm font-semibold mb-4 sm:mb-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <span className="text-foreground">Tùy chỉnh âm thanh</span>
      </h3>
      <div className="space-y-4 sm:space-y-6">
        {/* Speed */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <label className="text-xs font-medium text-muted-foreground">Tốc độ</label>
            </div>
            <span className="text-sm font-bold text-foreground bg-black/10 dark:bg-white/10 px-3 py-1 rounded-lg">{speedValue.toFixed(1)}x</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speedValue}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0.5x</span>
              <span>2.0x</span>
            </div>
          </div>
        </div>
        
        {/* Pitch */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <label className="text-xs font-medium text-muted-foreground">Cao độ</label>
            </div>
            <span className="text-sm font-bold text-foreground bg-black/10 dark:bg-white/10 px-3 py-1 rounded-lg">
              {pitchValue > 0 ? `+${pitchValue}` : pitchValue}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchValue}
              onChange={(e) => onPitchChange(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>-12</span>
              <span>0</span>
              <span>+12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate Button
interface GenerateButtonProps {
  disabled?: boolean;
  disabledReason?: string;
  isGenerating?: boolean;
  isModelLoading?: boolean;
  progress?: number;
  onClick?: () => void;
}

export function GenerateButton({
  disabled = false,
  disabledReason,
  isGenerating = false,
  isModelLoading = false,
  progress = 0,
  onClick,
}: GenerateButtonProps) {
  // Model loading: show "Đang tải..." with skeleton pulse
  if (isModelLoading) {
    return (
      <div className="flex justify-center pt-4">
        <button
          disabled
          className="px-12 py-4 bg-black/5 dark:bg-white/5 text-muted-foreground font-bold rounded-2xl flex items-center gap-3 cursor-not-allowed border border-border"
        >
          <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
          <span>Đang khởi tạo...</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center pt-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "px-12 py-4.5 font-bold rounded-2xl shadow-xl transition-all duration-200 flex items-center gap-3",
          "hover:scale-[1.02] active:scale-[0.98]",
          disabled 
            ? "bg-black/10 dark:bg-white/10 text-muted-foreground cursor-not-allowed shadow-none border border-border" 
            : "glow-button text-primary-foreground hover:shadow-primary/40"
        )}
      >
        <div className={cn(
          "w-6 h-6 rounded-xl flex items-center justify-center",
          disabled ? "bg-black/5 dark:bg-white/5" : "bg-white/20"
        )}>
          {disabled ? (
            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        <span className="text-lg">
          {disabled ? (disabledReason ?? "Nhập văn bản để tiếp tục") : "Tạo giọng nói ngay"}
        </span>
        {!disabled && (
          <div className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-xs font-medium text-primary-foreground">
            Ctrl + Enter
          </div>
        )}
      </button>
    </div>
  );
}

// Compact progress bar – không chặn form, có thể chuyển tab trong lúc tạo
interface CompactGenerationProgressProps {
  progress: number;
  onCancel?: () => void;
}

function CompactGenerationProgress({ progress, onCancel }: CompactGenerationProgressProps) {
  const getStatusMessage = (p: number) => {
    if (p < 20) return "Đang tải model...";
    if (p < 40) return "Đang xử lý văn bản...";
    if (p < 60) return "Đang phân tích...";
    if (p < 80) return "Đang tạo âm thanh...";
    return "Đang hoàn tất...";
  };

  return (
    <div className="mb-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-sm font-medium text-foreground">Đang tạo giọng nói...</span>
          <span className="text-sm font-semibold text-primary tabular-nums">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-background/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "hsl(var(--primary))",
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {getStatusMessage(progress)} — Bạn có thể chuyển tab, quá trình vẫn chạy nền.
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 px-4 py-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-sm font-medium flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Hủy
      </button>
    </div>
  );
}

// Full-screen progress (kept for export if needed elsewhere)
interface GenerationProgressProps {
  progress: number;
  onCancel?: () => void;
}

export function GenerationProgress({ progress, onCancel }: GenerationProgressProps) {
  const getStatusMessage = (progress: number) => {
    if (progress < 20) return "Đang tải model...";
    if (progress < 40) return "Đang xử lý văn bản...";
    if (progress < 60) return "Đang phân tích ngữ pháp...";
    if (progress < 80) return "Đang tạo âm thanh...";
    return "Đang xử lý âm sắc...";
  };
  const estimatedTime = Math.max(1, Math.round((100 - progress) / 10));
  return (
    <div className="bg-card rounded-xl p-12 border border-primary/10 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-12 h-12 text-primary animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 text-foreground">Đang tạo giọng nói... {progress}%</h3>
      <p className="text-sm text-muted-foreground mb-8">Vui lòng đợi trong giây lát. Hệ thống đang xử lý văn bản của bạn.</p>
      <div className="w-full max-w-md space-y-4">
        <div className="w-full bg-background/50 h-3 rounded-full overflow-hidden border border-primary/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "hsl(var(--primary))" }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
          <span>{getStatusMessage(progress)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            ~{estimatedTime} giây
          </span>
        </div>
      </div>
      <div className="mt-12">
        <button
          onClick={onCancel}
          className="px-8 py-2.5 border border-primary/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all rounded-lg text-sm font-semibold flex items-center gap-2 text-muted-foreground"
        >
          <X className="w-4 h-4" />
          Hủy bỏ
        </button>
      </div>
    </div>
  );
}

// Generation Success Component - shown after generation completes
interface GenerationSuccessProps {
  text: string;
  voiceName: string;
  duration: number;
  onClear: () => void;
  onRegenerate: () => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function GenerationSuccess({ text, voiceName, duration: durationProp, onClear, onRegenerate }: GenerationSuccessProps) {
  const { togglePlay } = useTts();
  const {
    status,
    streamingDuration,
    streamingCurrentTime,
    pausedStreaming,
    nowPlaying,
  } = useTtsStore();

  // Use live duration (streaming or final); fallback to prop
  const totalDuration = streamingDuration > 0 ? streamingDuration : (nowPlaying?.duration ?? durationProp);
  const currentTime = streamingDuration > 0 ? streamingCurrentTime : 0;
  const isPlaying = status === "playing" && !pausedStreaming;

  // Waveform bars – pulse when playing (chỉ dùng shorthand animation để tránh conflict với animationDelay khi re-render)
  const waveformBars = Array.from({ length: 24 }, (_, i) => (
    <div
      key={i}
      className="waveform-bar rounded-sm bg-primary/40"
      style={{
        height: `${8 + (i % 4) * 3}px`,
        animation: isPlaying ? `gen-voice-waveform-pulse 1.2s ease-in-out ${i * 0.04}s infinite` : "none",
        opacity: isPlaying ? 1 : 0.6,
      }}
    />
  ));

  const progressPercent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Success – compact, không chiếm quá nhiều chú ý */}
      <div className="animate-in fade-in duration-300 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/20 bg-green-500/5">
        <Check className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">Tạo giọng nói thành công!</p>
          <p className="text-xs text-muted-foreground truncate">Bản tin đã sẵn sàng để nghe và tải ở thanh dưới màn hình.</p>
        </div>
      </div>

      {/* Result: text + inline player + actions */}
      <div className="bg-card rounded-xl p-6 sm:p-8 border border-border shadow-sm flex flex-col min-h-[360px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Văn bản nội dung</h3>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{text.length} / 5000 ký tự</span>
        </div>
        <textarea
          value={text}
          readOnly
          className="flex-1 min-h-[120px] w-full p-4 rounded-lg bg-muted/30 border border-border text-foreground resize-none focus:ring-2 focus:ring-primary/20 outline-none text-sm leading-relaxed mb-5"
          placeholder="Nhập văn bản của bạn tại đây..."
        />

        {/* Inline player – đồng bộ với thanh dưới, có nút phát/tạm dừng thật */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border"
          aria-label="Phát bản ghi âm"
        >
          <button
            type="button"
            onClick={togglePlay}
            className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isPlaying ? "Tạm dừng" : "Phát"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-0.5 h-6 mb-2">
              {waveformBars}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
              <span className="text-xs text-muted-foreground truncate">Giọng {voiceName}</span>
            </div>
            {totalDuration > 0 && (
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 mb-4">
          Điều khiển đầy đủ (tốc độ, âm lượng, tải file) ở thanh phát nhạc dưới cùng màn hình.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Tạo lượt mới để nhập văn bản khác • Tạo lại để phát lại với cùng nội dung
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClear}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center gap-2 text-sm shadow-sm"
              aria-label="Thoát về màn nhập văn bản, tạo lượt mới"
            >
              <Sparkles className="w-4 h-4" />
              Tạo lượt mới
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="px-5 py-2.5 rounded-lg border border-border text-muted-foreground font-medium hover:bg-muted/50 hover:text-foreground transition-colors text-sm flex items-center gap-2"
              aria-label="Tạo lại với văn bản này hoặc thoát về form nếu đã xóa"
            >
              <RefreshCw className="w-4 h-4" />
              Tạo lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tips & Quick links – thay thế khu vực "Giọng đọc mẫu"
interface TipsAndLinksProps {
  onViewAllVoices?: () => void;
}

const TIPS = [
  "Viết câu ngắn, rõ ràng để chất lượng giọng đọc tốt hơn.",
  "Chọn giọng và điều chỉnh tốc độ, cao độ trước khi bấm tạo.",
  "Dùng Ctrl+Enter để tạo giọng nói nhanh.",
];

export function TipsAndLinks({ onViewAllVoices }: TipsAndLinksProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-foreground">Mẹo & Liên kết</span>
      </h3>
      <div className="glass-card border border-border rounded-xl p-4 space-y-3">
        <ul className="space-y-2 text-xs text-muted-foreground">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary shrink-0">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        {onViewAllVoices && (
          <button
            type="button"
            onClick={onViewAllVoices}
            className="w-full mt-2 py-2 text-xs font-medium text-primary hover:underline rounded-lg hover:bg-primary/5 transition-colors"
          >
            Xem tất cả giọng đọc →
          </button>
        )}
      </div>
    </div>
  );
}

// Văn bản mẫu – click để điền nhanh vào ô nhập
const SAMPLE_TEXTS = [
  "Xin chào, đây là bản tin buổi sáng.",
  "Thời tiết hôm nay có mây, nhiệt độ từ 25 đến 32 độ C.",
  "Cảm ơn bạn đã sử dụng dịch vụ tổng đài. Chúng tôi sẽ gọi lại sau.",
  "Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng.",
  "Văn bản mẫu để bạn thử nghiệm giọng đọc tiếng Việt.",
];

interface SampleTextChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

function SampleTextChips({ onSelect, disabled }: SampleTextChipsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">Văn bản mẫu</h3>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_TEXTS.map((sample, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(sample)}
            disabled={disabled}
            className="px-3 py-2 text-xs text-muted-foreground glass-card hover:bg-black/5 dark:hover:bg-white/10 border border-border rounded-lg hover:border-border/80 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed line-clamp-1 max-w-full"
            title={sample}
          >
            {sample.length > 36 ? `${sample.slice(0, 36)}…` : sample}
          </button>
        ))}
      </div>
    </div>
  );
}

// Lịch sử gần đây – 2 bản ghi mới nhất, nút Điền lại
interface RecentHistoryProps {
  onRefill: (text: string) => void;
  disabled?: boolean;
}

function RecentHistory({ onRefill, disabled }: RecentHistoryProps) {
  const { history } = useTtsStore();

  const recent = history.slice(0, 2);

  const getVoiceName = (voiceId: string) => {
    if (voiceId.startsWith(CUSTOM_MODEL_PREFIX)) {
      const id = voiceId.slice(CUSTOM_MODEL_PREFIX.length);
      const custom = config.customModels.find((m) => m.id === id);
      return (custom?.name ?? voiceId).replace(" (custom)", "");
    }
    return voiceId;
  };

  if (recent.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground px-1">Lịch sử gần đây</h3>
      <div className="space-y-2">
        {recent.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 sm:gap-3 p-3 glass-card border border-border rounded-xl min-w-0"
          >
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1 min-w-0 truncate" title={item.text?.trim() || ""}>
              {item.text?.trim() || "(Không có văn bản)"}
            </p>
            <span className="text-[10px] text-muted-foreground/70 shrink-0">
              {getVoiceName(item.voice)}
            </span>
            <button
              type="button"
              onClick={() => item.text && onRefill(item.text)}
              disabled={disabled || !item.text}
              className="shrink-0 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50"
            >
              Điền lại
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Content
interface MainContentProps {
  onViewAllVoices?: () => void;
  /** Text từ parent — lifted state để không bị mất khi chuyển tab */
  text: string;
  onTextChange: (text: string) => void;
  onTextClear: () => void;
}

export function MainContent({ onViewAllVoices, text, onTextChange, onTextClear }: MainContentProps) {
  const { settings, status, progress, error, generate, stop, previewVoice, previewingVoiceId, isReady, currentAudioUrl, nowPlaying } = useTts();
  const { setSettings: setStoreSettings, setError, reset: resetStore } = useTtsStore();
  const { activePlanCode, canAccessPro } = useAuthContext();
  const [textError, setTextError] = useState<string | null>(null);

  const isGenerating = status === "generating";
  const isPreviewing = status === "previewing";
  const selectedVoiceRawId = useMemo(() => {
    const v = settings.voice;
    return v.startsWith(CUSTOM_MODEL_PREFIX) ? v.slice(CUSTOM_MODEL_PREFIX.length) : v;
  }, [settings.voice]);

  const canUseSelectedVoice = useMemo(
    () => canUseVoiceForPlan({ planCode: activePlanCode, voiceId: selectedVoiceRawId }),
    [activePlanCode, selectedVoiceRawId]
  );

  const canGenerate =
    text.trim().length > 0 &&
    !textError &&
    isReady &&
    !isGenerating &&
    !isPreviewing &&
    canUseSelectedVoice;

  const handleTextChange = useCallback((newText: string) => {
    onTextChange(newText);
    if (newText && !isTextValid(newText, config.tts.maxTextLength)) {
      setTextError(`Văn bản vượt quá ${config.tts.maxTextLength} ký tự`);
    } else {
      setTextError(null);
    }
  }, [onTextChange]);

  const handleVoiceChange = useCallback((voiceId: VoiceId) => {
    setStoreSettings({ voice: voiceId, model: voiceId });
  }, [setStoreSettings]);

  const handleSpeedChange = useCallback((speed: number) => {
    setStoreSettings({ speed });
  }, [setStoreSettings]);

  const handlePitchChange = useCallback((pitch: number) => {
    setStoreSettings({ pitch });
  }, [setStoreSettings]);

  /** Hủy đang tạo — chỉ dừng worker, giữ nguyên text để sửa lại và thử lại */
  const handleCancel = useCallback(() => {
    stop();
    // stop() đã gọi resetStore() bên trong
  }, [stop]);

  /** Thoát màn kết quả, về form nhập văn bản để tạo lượt mới (luôn có thể bấm) */
  const handleClear = useCallback(() => {
    resetStore();
    onTextClear();
  }, [resetStore, onTextClear]);

  /** Tạo lại với văn bản hiện tại; nếu đã xóa hết văn bản thì thoát về form nhập mới (tránh đơ) */
  const handleRegenerate = useCallback(() => {
    if (text.trim()) {
      generate(text);
    } else {
      handleClear();
    }
  }, [text, generate, handleClear]);

  const isSuccess = status === "playing" && currentAudioUrl !== null;

  const handleGenerate = useCallback(() => {
    if (!text.trim()) return;
    if (!canUseSelectedVoice) {
      setError("Gói Miễn phí chỉ tạo được 1 giọng nam + 1 giọng nữ. Bạn vẫn có thể nghe sample, hoặc nâng cấp Pro để dùng tất cả giọng.");
      return;
    }
    generate(text);
  }, [text, generate, canUseSelectedVoice, setError]);

  // Keyboard shortcut: Ctrl+Enter to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (canGenerate && !isGenerating) {
          e.preventDefault();
          handleGenerate();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGenerate, isGenerating, handleGenerate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlText = params.get("text");
    const urlVoice = params.get("voice");

    if (urlText) onTextChange(urlText);
    if (urlVoice) {
      const exists = config.customModels.some((m) => `${CUSTOM_MODEL_PREFIX}${m.id}` === urlVoice);
      if (exists) {
        setStoreSettings({ voice: urlVoice as VoiceId, model: urlVoice as VoiceId });
      }
    }
  }, [onTextChange, setStoreSettings]);

  // If user is on FREE (or not logged in) and currently selected voice is locked, fallback to a free-allowed default.
  useEffect(() => {
    if (canAccessPro) return;
    if (canUseSelectedVoice) return;
    const fallback = config.tts.defaultVoice as VoiceId; // currently custom:ngochuyen (free allowed)
    setStoreSettings({ voice: fallback, model: fallback });
  }, [canAccessPro, canUseSelectedVoice, setStoreSettings]);

  // Get voice name from config - memoized
  const voiceName = useMemo(() => {
    const voiceId = settings.voice;
    const modelId = voiceId.replace(CUSTOM_MODEL_PREFIX, "");
    const model = config.customModels.find(m => m.id === modelId);
    return model?.name.replace(" (custom)", "") || "Unknown";
  }, [settings.voice]);

  // Mobile: Văn bản → Chọn giọng + Âm thanh → Nút tạo → Mẹo, mẫu, lịch sử. XL: 2 cột (trái: văn bản + nút + mẹo/mẫu/lịch sử | phải: giọng + âm thanh).
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 xl:grid-rows-2 gap-4 md:gap-6 lg:gap-8 items-start">
      {/* 1. Ô nhập văn bản — mobile: đầu; xl: cột trái hàng 1 */}
      <div className="xl:col-span-8 xl:row-start-1 space-y-4 md:space-y-6">
        {isSuccess ? (
          <GenerationSuccess
            text={text}
            voiceName={voiceName}
            duration={nowPlaying?.duration || 0}
            onClear={handleClear}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <>
            {isGenerating && (
              <CompactGenerationProgress progress={progress} onCancel={handleCancel} />
            )}
            <TextInput
              value={text}
              onChange={handleTextChange}
              maxLength={config.tts.maxTextLength}
              disabled={!isReady}
            />
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-400">{error}</p>
                  <button
                    onClick={() => {
                      useTtsStore.getState().setError(null);
                      useTtsStore.getState().setStatus("idle");
                    }}
                    className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}
            <GenerateButton
              disabled={!canGenerate}
              disabledReason={!canUseSelectedVoice ? "Giọng này chỉ nghe sample (cần Pro để tạo)" : undefined}
              isGenerating={isGenerating}
              isModelLoading={!isReady}
              progress={progress}
              onClick={handleGenerate}
            />
          </>
        )}
      </div>

      {/* 2. Tùy chỉnh âm thanh + Chọn giọng — mobile: ngay dưới ô văn bản; xl: cột phải */}
      <div className="xl:col-span-4 xl:row-start-1 xl:row-span-2 xl:sticky xl:top-6 space-y-4 md:space-y-6">
        <div className={cn(!isReady && "opacity-50 pointer-events-none")}>
          <AudioCustomization
            speed={settings.speed}
            pitch={settings.pitch}
            onSpeedChange={handleSpeedChange}
            onPitchChange={handlePitchChange}
            disabled={false}
          />
        </div>
        <VoiceSelection
          selectedVoice={settings.voice}
          onVoiceChange={handleVoiceChange}
          isLoading={!isReady}
          disabled={false}
          previewingVoiceId={previewingVoiceId}
          onPreview={(voiceId) => previewVoice(voiceId)}
          onViewAllClick={onViewAllVoices}
        />
      </div>

      {/* 3. Mẹo, mẫu, lịch sử — mobile: sau giọng/âm thanh; xl: cột trái hàng 2 */}
      {!isSuccess && (
        <div className="xl:col-span-8 xl:row-start-2 space-y-4 md:space-y-6">
          <TipsAndLinks onViewAllVoices={onViewAllVoices} />
          <SampleTextChips
            onSelect={handleTextChange}
            disabled={!isReady}
          />
          <RecentHistory
            onRefill={handleTextChange}
            disabled={!isReady}
          />
        </div>
      )}
    </div>
  );
}
