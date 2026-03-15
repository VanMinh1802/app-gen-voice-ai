"use client";

import Image from "next/image";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface Voice {
  id: string;
  name: string;
  gender: "male" | "female";
  region: string;
  description?: string;
  avatar?: string;
  style?: string;
  isCustom?: boolean;
}

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  onPreview?: () => void;
}

export function VoiceCard({ voice, isSelected, onSelect, disabled, onPreview }: VoiceCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover-lift transition-all group relative cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Top row: Avatar + Preview button */}
      <div className="flex items-center justify-between mb-4">
        <div className="size-14 rounded-full overflow-hidden border-2 border-slate-700 p-0.5 group-hover:border-primary group-hover:scale-105 transition-all duration-200">
          {voice.avatar ? (
            <Image
              src={voice.avatar}
              alt={voice.name}
              fill
              className="object-cover rounded-full"
              sizes="56px"
            />
          ) : (
            <div className={cn(
              "w-full h-full rounded-full flex items-center justify-center text-lg font-medium transition-transform group-hover:scale-110 duration-200",
              voice.gender === "male"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-pink-500/20 text-pink-400"
            )}>
              {voice.name.charAt(0)}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.();
          }}
          className="size-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-200 shadow-lg"
          aria-label="Nghe thử"
        >
          <Headphones className="w-5 h-5" />
        </button>
      </div>

      {/* Name */}
      <h3 className="text-foreground font-bold text-lg mb-1">{voice.name}</h3>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          {voice.region}
        </span>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-medium",
          voice.gender === "male" 
            ? "bg-blue-500/10 text-blue-500" 
            : "bg-pink-500/10 text-pink-500"
        )}>
          {voice.gender === "male" ? "Nam" : "Nữ"}
        </span>
        {voice.style && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {voice.style}
          </span>
        )}
      </div>

      {/* Description */}
      {voice.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 italic">
          &quot;{voice.description}&quot;
        </p>
      )}

      {/* Select Button */}
      <button
        onClick={disabled ? undefined : onSelect}
        disabled={disabled}
        className={cn(
          "w-full border border-border text-muted-foreground py-2 rounded-lg text-xs font-bold transition-colors",
          "hover:bg-muted",
          isSelected && "bg-primary text-primary-foreground border-primary hover:bg-primary",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {isSelected ? "Đã chọn" : "Chọn giọng này"}
      </button>
    </div>
  );
}

export function VoiceCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="size-14 rounded-full bg-muted" />
        <div className="size-10 bg-muted rounded-full" />
      </div>
      <div className="h-5 w-24 bg-muted rounded mb-2" />
      <div className="flex gap-2 mb-4">
        <div className="h-4 w-16 bg-muted rounded-full" />
        <div className="h-4 w-12 bg-muted rounded-full" />
      </div>
      <div className="h-3 w-full bg-muted rounded mb-2" />
      <div className="h-3 w-2/3 bg-muted rounded mb-4" />
      <div className="h-8 w-full bg-muted rounded-lg" />
    </div>
  );
}
