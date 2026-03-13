"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { X, Sparkles, Headphones, SlidersHorizontal, Edit3, User, Settings, CheckCircle, Play, Pause, Hourglass, Activity, Clock, Check, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import { useTts } from "@/features/tts/context/TtsContext";
import { useTtsStore } from "@/features/tts/store";
import { isTextValid } from "@/lib/text-processing/textProcessor";
import { VoiceCardSkeleton } from "./VoiceCard";
import type { VoiceId } from "@/config";

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
    <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-lg hover:border-primary/20 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span className="text-foreground">Văn bản cần chuyển đổi</span>
        </label>
        <div className="flex items-center gap-3">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-muted/80 text-muted-foreground rounded-lg border border-border">
            <span className="text-xs">Ctrl</span>
            <span className="text-muted-foreground">+</span>
            <span>Enter</span>
          </kbd>
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            isOverLimit 
              ? "bg-red-500/10 text-red-400" 
              : characterCount > maxLength * 0.8 
                ? "bg-amber-500/10 text-amber-400"
                : "text-muted-foreground"
          }`}>
            {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Progress bar underneath */}
      <div className="w-full h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            isOverLimit 
              ? "bg-red-500" 
              : progress > 80 
                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb]"
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
          "w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] bg-background/80 border border-primary/10 rounded-xl p-5",
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

// Helper function to detect gender from voice ID (fallback when not explicitly set)
function detectGender(voiceId: string): "male" | "female" {
  const maleKeywords = ["nam", "hung", "quang", "thanh", "khoi", "dung", "duy", "minh", "anh", "hoang", "phong", "son", "hieu"];
  const id = voiceId.toLowerCase();
  return maleKeywords.some(kw => id.includes(kw)) ? "male" : "female";
}

// Same-origin placeholder to avoid COEP blocking external avatars
function getVoicePlaceholderUrl(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#7c3aed"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Voice info type
interface VoiceInfo {
  id: string;
  name: string;
  gender: "male" | "female";
  region: string;
  style: string;
  avatar: string;
  isCustom?: boolean;
}

// Voice Card Component
interface VoiceCardProps {
  voice: VoiceInfo;
  isSelected: boolean;
  isPreviewing?: boolean;
  onSelect: () => void;
  onPreview?: () => void;
  disabled?: boolean;
}

function VoiceCard({ voice, isSelected, isPreviewing = false, onSelect, onPreview, disabled }: VoiceCardProps) {
  const initials = voice.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const avatarColor = voice.gender === "female" 
    ? "linear-gradient(135deg, #ec4899, #f472b6)" 
    : "linear-gradient(135deg, #3b82f6, #60a5fa)";

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200
        ${isSelected 
          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/10" 
          : "border-primary/10 hover:border-primary/30 bg-card hover:bg-card/80 hover:shadow-lg"
        }
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Dấu tích đã chọn — bên trái, không đè nút nghe thử */}
      {isSelected && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0" aria-hidden>
          <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-foreground font-bold text-sm shrink-0 shadow-lg"
        style={{ background: avatarColor }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate text-foreground">{voice.name}</p>
        <p className={`text-[11px] mt-0.5 ${isSelected ? "text-primary font-medium" : "text-muted-foreground"}`}>
          {voice.gender === "female" ? "👩 Giọng Nữ" : "👨 Giọng Nam"} • {voice.style}
        </p>
      </div>
      {/* Luôn hiển thị nút nghe thử bên phải; khi đang preview hiện icon loading */}
      {onPreview && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPreviewing) onPreview();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              if (!isPreviewing) onPreview();
            }
          }}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
            isPreviewing
              ? "bg-primary text-primary-foreground animate-pulse cursor-wait"
              : "bg-muted hover:bg-primary text-muted-foreground hover:text-primary-foreground cursor-pointer"
          )}
          aria-label={isPreviewing ? "Đang phát..." : "Nghe thử"}
        >
          {isPreviewing ? (
            <Activity className="w-4 h-4" />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
      )}
    </button>
  );
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

export function VoiceSelection({
  selectedVoice,
  onVoiceChange,
  isLoading = false,
  disabled = false,
  previewingVoiceId = null,
  onPreview,
  onViewAllClick,
}: VoiceSelectionProps) {
  // Chỉ hiển thị giọng đang active (có model); tổng số để "Xem tất cả"
  const voices: VoiceInfo[] = useMemo(() => {
    return config.customModels
      .filter((model) => config.activeVoiceIds.includes(model.id))
      .map((model) => {
        const gender = detectGender(model.id);
        return {
          id: `${CUSTOM_MODEL_PREFIX}${model.id}` as VoiceId,
          name: model.name.replace(" (custom)", ""),
          gender,
          region: "Việt Nam",
          style: gender === "male" ? "Nam" : "Nữ",
          avatar: "",
          isCustom: true,
        };
      });
  }, []);

  const displayVoices = voices;
  const totalCount = config.customModels.length;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-lg">
        <div className="mb-5">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-lg hover:border-primary/20 transition-all">
      <div className="mb-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-foreground">Chọn giọng đọc</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">Chọn giọng phù hợp với nội dung của bạn</p>
      </div>

      <div className="space-y-3">
        {displayVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            isSelected={selectedVoice === voice.id}
            isPreviewing={previewingVoiceId === voice.id}
            onSelect={() => onVoiceChange(voice.id as VoiceId)}
            onPreview={() => onPreview?.(voice.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {totalCount > 4 && onViewAllClick && (
        <button 
          onClick={onViewAllClick}
          className="w-full mt-5 py-3 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <span>Xem tất cả {totalCount} giọng đọc</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
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
    <div className="bg-card rounded-2xl p-6 border border-primary/10 shadow-lg hover:border-primary/20 transition-all">
      <h3 className="text-sm font-semibold mb-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <span className="text-foreground">Tùy chỉnh âm thanh</span>
      </h3>
      <div className="space-y-6">
        {/* Speed */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <label className="text-xs font-medium text-muted-foreground">Tốc độ</label>
            </div>
            <span className="text-sm font-bold text-foreground bg-muted px-3 py-1 rounded-lg">{speedValue.toFixed(1)}x</span>
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
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
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
            <span className="text-sm font-bold text-foreground bg-muted px-3 py-1 rounded-lg">
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
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
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
  isGenerating?: boolean;
  isModelLoading?: boolean;
  progress?: number;
  onClick?: () => void;
}

export function GenerateButton({
  disabled = false,
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
          className="px-12 py-4 bg-muted/50 text-muted-foreground font-bold rounded-2xl flex items-center gap-3 cursor-not-allowed"
        >
          <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
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
          "px-12 py-4.5 text-primary-foreground font-bold rounded-2xl shadow-xl transition-all duration-200 flex items-center gap-3",
          "hover:scale-[1.02] active:scale-[0.98]",
          disabled 
            ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none" 
            : "bg-gradient-to-r from-[#7c3aed] to-[#2563eb] hover:from-[#8b5cf6] hover:to-[#3b82f6] shadow-[#7c3aed]/30 hover:shadow-[#7c3aed]/50"
        )}
      >
        <div className={cn(
          "w-6 h-6 rounded-xl flex items-center justify-center",
          disabled ? "bg-muted" : "bg-white/20"
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
          {disabled ? "Nhập văn bản để tiếp tục" : "Tạo giọng nói ngay"}
        </span>
        {!disabled && (
          <div className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-xs font-medium">
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
              background: "linear-gradient(90deg, #7c3aed, #2563eb)",
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
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #2563eb)" }}
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

export function GenerationSuccess({ text, voiceName, duration, onClear, onRegenerate }: GenerationSuccessProps) {
  // Format duration to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Animated waveform bars
  const waveformBars = Array.from({ length: 24 }, (_, i) => (
    <div
      key={i}
      className="waveform-bar animate-pulse"
      style={{
        height: `${Math.random() * 20 + 10}px`,
        animationDelay: `${i * 0.05}s`,
      }}
    />
  ));

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex items-center justify-between p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400">
        <div className="flex items-center gap-3">
          <span className="bg-green-500 text-foreground rounded-full p-1 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-bold">Tạo giọng nói thành công!</p>
            <p className="text-xs opacity-80">Bản tin của bạn đã sẵn sàng để nghe và tải về.</p>
          </div>
        </div>
      </div>

      {/* Result Area - Readonly Text */}
      <div className="bg-card rounded-xl p-8 border border-primary/10 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Văn bản nội dung</h3>
          <span className="text-xs font-medium text-muted-foreground">{text.length} / 5000 ký tự</span>
        </div>
        <textarea
          value={text}
          readOnly
          className="flex-1 w-full p-5 rounded-xl bg-background border border-primary/5 text-foreground resize-none focus:ring-1 focus:ring-primary outline-none transition-all text-sm leading-relaxed mb-6"
          placeholder="Nhập văn bản của bạn tại đây..."
        />
        
        {/* Mini Audio Player Preview */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-primary/5 mb-6">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <Play className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {waveformBars}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(duration)}</span>
              <span>Giọng {voiceName}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClear}
            className="px-6 py-2.5 rounded-lg border border-primary/20 text-muted-foreground font-semibold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors text-sm"
          >
            Xóa hết
          </button>
          <button 
            onClick={onRegenerate}
            className="px-8 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Tạo lại
          </button>
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
  "Điều chỉnh tốc độ và cao độ ở panel bên phải trước khi tạo.",
  "Dùng Ctrl+Enter để tạo giọng nói nhanh.",
];

export function TipsAndLinks({ onViewAllVoices }: TipsAndLinksProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-[#7c3aed]" />
        <span className="text-foreground">Mẹo & Liên kết</span>
      </h3>
      <div className="bg-card border border-primary/10 rounded-xl p-4 space-y-3">
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
            className="px-3 py-2 text-xs text-muted-foreground bg-card border border-primary/10 rounded-lg hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed line-clamp-1 max-w-full"
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
            className="flex items-center justify-between gap-3 p-3 bg-card border border-primary/10 rounded-xl"
          >
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1 min-w-0">
              {item.text?.trim() || "(Không có văn bản)"}
            </p>
            <span className="text-[10px] text-muted-foreground shrink-0">
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
  onGenerate?: (text: string, voice: string) => void;
  initialText?: string;
  onViewAllVoices?: () => void;
}

export function MainContent({ onGenerate, initialText = "", onViewAllVoices }: MainContentProps) {
  const [text, setText] = useState(initialText);
  const { settings, status, progress, error, generate, stop, previewVoice, previewingVoiceId, isReady, currentAudioUrl, nowPlaying } = useTts();
  const { setSettings: setStoreSettings, setError } = useTtsStore();
  const [textError, setTextError] = useState<string | null>(null);

  // Sync with initialText when it changes (from History refill)
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const isGenerating = status === "generating";
  const isPreviewing = status === "previewing";
  const canGenerate = text.trim().length > 0 && !textError && isReady && !isGenerating && !isPreviewing;

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    if (newText && !isTextValid(newText, config.tts.maxTextLength)) {
      setTextError(`Văn bản vượt quá ${config.tts.maxTextLength} ký tự`);
    } else {
      setTextError(null);
    }
  }, []);

  const handleVoiceChange = useCallback((voiceId: VoiceId) => {
    setStoreSettings({ voice: voiceId, model: voiceId });
  }, [setStoreSettings]);

  const handleSpeedChange = useCallback((speed: number) => {
    setStoreSettings({ speed });
  }, [setStoreSettings]);

  const handlePitchChange = useCallback((pitch: number) => {
    setStoreSettings({ pitch });
  }, [setStoreSettings]);

  const handleCancel = useCallback(() => {
    stop();
    setText("");
  }, [stop]);

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  const handleRegenerate = useCallback(() => {
    if (!text.trim()) return;
    generate(text);
  }, [text, generate]);

  const isSuccess = status === "playing" && currentAudioUrl !== null;

  const handleGenerate = useCallback(() => {
    if (!text.trim()) return;
    generate(text);
    onGenerate?.(text, settings.voice);
  }, [text, generate, settings.voice, onGenerate]);

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
    
    if (urlText) setText(urlText);
    if (urlVoice) {
      const exists = config.customModels.some((m) => `${CUSTOM_MODEL_PREFIX}${m.id}` === urlVoice);
      if (exists) {
        setStoreSettings({ voice: urlVoice as VoiceId, model: urlVoice as VoiceId });
      }
    }
  }, [setStoreSettings]);

  // Get voice name from config - memoized
  const voiceName = useMemo(() => {
    const voiceId = settings.voice;
    const modelId = voiceId.replace(CUSTOM_MODEL_PREFIX, "");
    const model = config.customModels.find(m => m.id === modelId);
    return model?.name.replace(" (custom)", "") || "Unknown";
  }, [settings.voice]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Editor Area */}
      <div className="xl:col-span-8 space-y-6">
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
                <div className="flex-1">
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
              isGenerating={isGenerating}
              isModelLoading={!isReady}
              progress={progress}
              onClick={handleGenerate}
            />

            <TipsAndLinks onViewAllVoices={onViewAllVoices} />

            <SampleTextChips
              onSelect={handleTextChange}
              disabled={!isReady}
            />

            <RecentHistory
              onRefill={handleTextChange}
              disabled={!isReady}
            />
          </>
        )}
      </div>

      {/* Settings Area */}
      <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-6">
        <VoiceSelection
          selectedVoice={settings.voice}
          onVoiceChange={handleVoiceChange}
          isLoading={!isReady}
          disabled={false}
          previewingVoiceId={previewingVoiceId}
          onPreview={(voiceId) => previewVoice(voiceId)}
          onViewAllClick={onViewAllVoices}
        />
        
        <div className={cn(!isReady && "opacity-50 pointer-events-none")}>
          <AudioCustomization
            speed={settings.speed}
            pitch={settings.pitch}
            onSpeedChange={handleSpeedChange}
            onPitchChange={handlePitchChange}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
