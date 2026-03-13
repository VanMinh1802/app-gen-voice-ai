"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { SlidersHorizontal, Play, Activity, SearchX, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import { voiceMetadata, type VoiceMetadata } from "@/config/voiceData";
import { useTtsStore } from "@/features/tts/store";
import { useTts } from "@/features/tts/context/TtsContext";

type RegionFilter = "all" | "Miền Bắc" | "Miền Trung" | "Miền Nam";
type GenderFilter = "all" | "Nam" | "Nữ";

interface VoiceLibraryProps {
  onSelectVoice?: (voiceId: string) => void;
  onPreview?: (voiceId: string) => void;
}

export function VoiceLibrary({ onSelectVoice, onPreview }: VoiceLibraryProps) {
  const { settings, setSettings, status } = useTtsStore();
  const { previewVoice } = useTts();
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Clear preview loading state when playback starts or errors
  useEffect(() => {
    if (previewingVoice && (status === "playing" || status === "error")) {
      setPreviewingVoice(null);
    }
  }, [previewingVoice, status]);

  // Filter voices based on selected filters and search
  const filteredVoices = useMemo(() => {
    return voiceMetadata.filter((voice) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = voice.name.toLowerCase().includes(query);
        const matchRegion = voice.region.toLowerCase().includes(query);
        const matchGender = voice.gender.toLowerCase().includes(query);
        if (!matchName && !matchRegion && !matchGender) return false;
      }
      // Region filter
      if (regionFilter !== "all" && voice.region !== regionFilter) return false;
      // Gender filter
      if (genderFilter !== "all" && voice.gender !== genderFilter) return false;
      return true;
    });
  }, [regionFilter, genderFilter, searchQuery]);

  const hasActiveFilters = regionFilter !== "all" || genderFilter !== "all" || searchQuery.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setRegionFilter("all");
    setGenderFilter("all");
    setSearchQuery("");
  }, []);

  const handleSelectVoice = useCallback((voice: VoiceMetadata) => {
    const voiceId = `${CUSTOM_MODEL_PREFIX}${voice.id}` as any;
    setSettings({ voice: voiceId, model: voiceId });
    onSelectVoice?.(voiceId);
  }, [setSettings, onSelectVoice]);

  const handlePreview = useCallback((voice: VoiceMetadata) => {
    setPreviewingVoice(voice.id);
    previewVoice(voice.id);
    onPreview?.(voice.id);
  }, [previewVoice, onPreview]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">Thư viện giọng</h1>
        <p className="text-muted-foreground max-w-2xl">
          Khám phá hơn {voiceMetadata.length} giọng đọc AI chuyên nghiệp với nhiều vùng miền và phong cách khác nhau cho dự án của bạn.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Search Input */}
        <div className="relative w-full sm:w-auto sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm giọng nói..."
            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-card border border-primary/10 text-muted-foreground text-xs rounded-lg focus:ring-primary focus:border-primary outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center bg-card border border-primary/10 rounded-lg p-1">
          {(["all", "Miền Bắc", "Miền Trung", "Miền Nam"] as const).map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-semibold transition-colors",
                regionFilter === region
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {region === "all" ? "Tất cả" : region}
            </button>
          ))}
        </div>

        <div className="h-8 w-px bg-primary/10 mx-2 hidden sm:block"></div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as GenderFilter)}
            className="bg-card border border-primary/10 text-muted-foreground text-xs rounded-lg focus:ring-primary focus:border-primary block p-2 px-4 cursor-pointer"
          >
            <option value="all">Giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          <button className="flex items-center gap-2 bg-card border border-primary/10 text-muted-foreground text-xs rounded-lg px-4 py-2 hover:text-foreground transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            Lọc nâng cao
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-red-400 hover:text-red-300 underline"
            aria-label="Xóa bộ lọc"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVoices.map((voice) => {
          const isActive = config.activeVoiceIds.includes(voice.id);
          const isSelected = isActive && settings.voice === `${CUSTOM_MODEL_PREFIX}${voice.id}`;
          const isPreviewing = previewingVoice === voice.id;

          return (
            <div
              key={voice.id}
              className={cn(
                "bg-card border rounded-xl p-5 transition-all group relative",
                isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "border-primary/10",
                !isActive && "opacity-75 hover:border-primary/20"
              )}
            >
              {!isActive && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
                    Coming soon
                  </span>
                </div>
              )}

              {/* Top Row: Avatar + Preview Button */}
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "size-14 rounded-full overflow-hidden border-2 border-border p-0.5 transition-colors",
                  isSelected && "border-primary",
                  isActive && "group-hover:border-primary"
                )}>
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-foreground font-bold text-lg"
                    style={{ backgroundColor: voice.avatarColor }}
                  >
                    {getInitials(voice.name)}
                  </div>
                </div>
                {isActive ? (
                  <button
                    onClick={() => handlePreview(voice)}
                    disabled={isPreviewing}
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center transition-all shadow-lg",
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
                  <div className="size-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground cursor-not-allowed" title="Sắp ra mắt">
                    <Play className="w-5 h-5" />
                  </div>
                )}
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
                  voice.gender === "Nữ"
                    ? "bg-pink-500/10 text-pink-500"
                    : "bg-blue-500/10 text-blue-500"
                )}>
                  {voice.gender}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 italic">
                &ldquo;{voice.description}&rdquo;
              </p>

              {/* Select Button / Coming soon */}
              {isActive ? (
                <button
                  onClick={() => handleSelectVoice(voice)}
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
        })}
      </div>

      {/* Empty State */}
      {filteredVoices.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy giọng nói</h3>
          <p className="text-muted-foreground text-sm">Thử thay đổi bộ lọc để xem thêm giọng nói.</p>
        </div>
      )}
    </div>
  );
}
