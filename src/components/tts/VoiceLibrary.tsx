"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SlidersHorizontal, SearchX, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { config, CUSTOM_MODEL_PREFIX } from "@/config";
import { voiceMetadata, type VoiceMetadata } from "@/config/voiceData";
import { useTtsStore } from "@/features/tts/store";
import { useTts } from "@/features/tts/context/TtsContext";
import { VoiceCardShared } from "./VoiceCardShared";
import { useAuthContext } from "@/components/AuthProvider";
import { canUseVoiceForPlan } from "@/lib/hooks";

type RegionFilter = "all" | "Miền Bắc" | "Miền Trung" | "Miền Nam";
type GenderFilter = "all" | "Nam" | "Nữ";

interface VoiceLibraryProps {
  onSelectVoice?: (voiceId: string) => void;
  onPreview?: (voiceId: string) => void;
}

export function VoiceLibrary({ onSelectVoice, onPreview }: VoiceLibraryProps) {
  const { settings, setSettings, status } = useTtsStore();
  const { previewVoice } = useTts();
  const { activePlanCode } = useAuthContext();
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const advancedFilterRef = useRef<HTMLDivElement>(null);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const styleOptions = useMemo(() => {
    const set = new Set(voiceMetadata.map((v) => v.style));
    return Array.from(set).sort();
  }, []);

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
        const matchStyle = voice.style.toLowerCase().includes(query);
        if (!matchName && !matchRegion && !matchGender && !matchStyle) return false;
      }
      // Region filter
      if (regionFilter !== "all" && voice.region !== regionFilter) return false;
      // Gender filter
      if (genderFilter !== "all" && voice.gender !== genderFilter) return false;
      // Style filter (lọc nâng cao)
      if (styleFilter !== "all" && voice.style !== styleFilter) return false;
      return true;
    });
  }, [regionFilter, genderFilter, styleFilter, searchQuery]);

  const hasActiveFilters = regionFilter !== "all" || genderFilter !== "all" || styleFilter !== "all" || searchQuery.trim().length > 0;

  const handleClearFilters = useCallback(() => {
    setRegionFilter("all");
    setGenderFilter("all");
    setStyleFilter("all");
    setSearchQuery("");
    setShowAdvancedFilter(false);
  }, []);

  // Click outside to close advanced filter panel
  useEffect(() => {
    if (!showAdvancedFilter) return;
    const handleClick = (e: MouseEvent) => {
      if (advancedFilterRef.current && !advancedFilterRef.current.contains(e.target as Node)) {
        setShowAdvancedFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAdvancedFilter]);

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

          <div className="relative" ref={advancedFilterRef}>
            <button
              type="button"
              onClick={() => setShowAdvancedFilter((v) => !v)}
              className={cn(
                "flex items-center gap-2 bg-card border text-xs rounded-lg px-4 py-2 transition-colors",
                showAdvancedFilter
                  ? "border-primary text-primary"
                  : "border-primary/10 text-muted-foreground hover:text-foreground"
              )}
              aria-expanded={showAdvancedFilter}
              aria-label="Lọc nâng cao"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Lọc nâng cao
            </button>
            {showAdvancedFilter && (
              <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] bg-card border border-primary/10 rounded-xl shadow-xl p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Phong cách</p>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStyleFilter("all");
                    }}
                    className={cn(
                      "text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      styleFilter === "all" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    Tất cả
                  </button>
                  {styleOptions.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setStyleFilter(style)}
                      className={cn(
                        "text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        styleFilter === style ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* Voice Grid - same card as "Chọn giọng đọc" (full variant) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVoices.map((voice) => {
          const isActive = config.activeVoiceIds.includes(voice.id);
          const isSelected = isActive && settings.voice === `${CUSTOM_MODEL_PREFIX}${voice.id}`;
          const isPreviewing = previewingVoice === voice.id;
          const isLockedForPlan = isActive && !canUseVoiceForPlan({ planCode: activePlanCode, voiceId: voice.id });

          return (
            <VoiceCardShared
              key={voice.id}
              voice={voice}
              variant="full"
              isSelected={!!isSelected}
              isPreviewing={isPreviewing}
              isActive={isActive}
              disabled={isLockedForPlan}
              showPopularBadge={false}
              onSelect={() => handleSelectVoice(voice)}
              onPreview={() => handlePreview(voice)}
            />
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
