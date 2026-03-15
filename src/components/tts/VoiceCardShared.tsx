"use client";

import { Play, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceMetadata } from "@/config/voiceData";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface VoiceCardSharedProps {
  voice: VoiceMetadata;
  variant: "compact" | "full";
  isSelected: boolean;
  isPreviewing?: boolean;
  isActive?: boolean;
  showPopularBadge?: boolean;
  onSelect: () => void;
  onPreview?: () => void;
  disabled?: boolean;
}

/**
 * Shared voice card used in both Voice Selection (compact) and Voice Library (full).
 * Keeps UI/UX consistent: same labels, same button copy, same visual language.
 */
export function VoiceCardShared({
  voice,
  variant,
  isSelected,
  isPreviewing = false,
  isActive = true,
  showPopularBadge = false,
  onSelect,
  onPreview,
  disabled = false,
}: VoiceCardSharedProps) {
  const initials = getInitials(voice.name);

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={isActive && !disabled ? onSelect : undefined}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 relative",
          isSelected
            ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg shadow-primary/15"
            : "border-border hover:border-border/80 glass-card-hover",
          disabled && "opacity-60 cursor-not-allowed",
          !disabled && isActive && "cursor-pointer"
        )}
      >
        {isSelected && (
          <div
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 absolute left-2.5 top-2.5 ring-2 ring-background shadow-md"
            aria-hidden
          >
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg"
          style={{ backgroundColor: voice.avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold truncate text-foreground">{voice.name}</p>
            {showPopularBadge && (
              <span className="shrink-0 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-bold rounded-full flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                HOT
              </span>
            )}
          </div>
          <p
            className={cn(
              "text-[11px] mt-0.5",
              isSelected ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            {voice.region} • {voice.gender}
          </p>
        </div>
        {isActive && onPreview && (
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
                : "bg-black/10 dark:bg-white/10 hover:bg-primary text-muted-foreground hover:text-primary-foreground cursor-pointer"
            )}
            aria-label={isPreviewing ? "Đang phát..." : "Nghe thử"}
          >
            {isPreviewing ? (
              <Activity className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </span>
        )}
      </button>
    );
  }

  // Full variant (Voice Library)
  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-5 transition-all group relative",
        isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "border-primary/10"
      )}
    >
      {!isActive && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
            Coming soon
          </span>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "size-14 rounded-full overflow-hidden border-2 border-border p-0.5 transition-colors flex items-center justify-center text-white font-bold text-lg",
            isSelected && "border-primary",
            isActive && "group-hover:border-primary"
          )}
          style={{ backgroundColor: voice.avatarColor }}
        >
          {initials}
        </div>
        {isActive ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.();
            }}
            disabled={isPreviewing}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0",
              isPreviewing
                ? "bg-primary text-primary-foreground animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            )}
            aria-label={isPreviewing ? "Đang phát" : "Nghe thử"}
            title="Nghe thử"
          >
            {isPreviewing ? <Activity className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        ) : (
          <div className="size-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground cursor-not-allowed shrink-0" title="Sắp ra mắt">
            <Play className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-foreground font-bold text-lg truncate">{voice.name}</h3>
        {showPopularBadge && (
          <span className="shrink-0 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-bold rounded-full flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            HOT
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {voice.region}
        </span>
        <span
          className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-medium",
            voice.gender === "Nữ" ? "bg-pink-500/10 text-pink-500" : "bg-blue-500/10 text-blue-500"
          )}
        >
          {voice.gender}
        </span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 italic">
        &ldquo;{voice.description}&rdquo;
      </p>
      {isActive ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "w-full border py-2 rounded-lg text-xs font-bold transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-primary/20 text-muted-foreground hover:bg-muted"
          )}
        >
          {isSelected ? "Đang chọn" : "Chọn giọng này"}
        </button>
      ) : (
        <div className="w-full border border-border py-2 rounded-lg text-xs font-bold text-muted-foreground text-center bg-muted/30 cursor-not-allowed">
          Coming soon
        </div>
      )}
    </div>
  );
}
