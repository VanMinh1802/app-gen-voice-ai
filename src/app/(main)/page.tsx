"use client";

import { useState, useCallback, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header, Sidebar } from "@/components/layout";
import { BottomNav } from "@/components/layout/BottomNav";
import { MainContent, AudioPlayer, VoiceLibrary } from "@/components/tts";
import {
  ToastContainer,
  ToastProvider,
  useToast,
  GlobalToastListener,
  toast,
} from "@/components/ui/Toast";
import { TtsProvider } from "@/features/tts/context/TtsContext";
import { useTtsStore } from "@/features/tts/store";
import { useTts } from "@/features/tts/context/TtsContext";
import { HistoryPanel } from "@/features/tts/components/HistoryPanel";
import { VoiceSettings } from "@/features/tts/components/VoiceSettings";
import { useAuth } from "@/lib/hooks";
import type { VoiceId } from "@/config";

type SidebarTab = "dashboard" | "voice_library" | "history" | "settings";

function HomeContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [refillText, setRefillText] = useState("");
  /** inputText được persist vào sessionStorage qua Zustand store — không cần local state */
  const {
    currentAudioUrl,
    loadHistory,
    inputText,
    setInputText,
    clearInputText,
    setSettings,
    setCurrentUserId,
    currentUserId,
  } = useTtsStore();
  const { pauseAudio } = useTts();
  const { toasts, removeToast, addToast } = useToast();
  const [playerVisible, setPlayerVisible] = useState(true);

  // Get auth state
  const { user, isAuthenticated } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);

  // Set userId and reload history when auth state changes
  useEffect(() => {
    const userId = isAuthenticated && user?.sub ? user.sub : null;

    // Only reload if user changed
    if (userId !== prevUserIdRef.current) {
      prevUserIdRef.current = userId;
      setCurrentUserId(userId);

      // If user changed (login/logout), reload history to get only user's history
      if (
        userId !== currentUserId ||
        (userId === null && currentUserId !== null)
      ) {
        loadHistory();
      }
    }
  }, [user, isAuthenticated, currentUserId, setCurrentUserId, loadHistory]);

  // Initial load
  useEffect(() => {
    if (!currentUserId) {
      loadHistory();
    }
  }, [loadHistory, currentUserId]);

  // Show toast when redirected back with auth_error (e.g. 400 invalid client credentials)
  useEffect(() => {
    if (searchParams.get("auth_error") !== "true") return;
    const message = searchParams.get("message");
    const decoded = message ? decodeURIComponent(message) : "Lỗi đăng nhập";
    toast("error", decoded, 8000);
    const lower = decoded.toLowerCase();
    if (
      lower.includes("invalid") &&
      (lower.includes("credential") || lower.includes("client"))
    ) {
      toast(
        "info",
        "Chạy local: thêm NEXT_PUBLIC_GENATION_CLIENT_SECRET vào .env.local (cùng giá trị với GENATION_CLIENT_SECRET), rồi restart npm run dev. Xem docs/cloudflare-pages-env.md.",
        12000,
      );
    }
    router.replace("/", { scroll: false });
  }, [searchParams, router]);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleTabChange = useCallback((tab: SidebarTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  }, []);

  const handleRefillFromHistory = useCallback(
    (text: string, voice?: string, speed?: number) => {
      // H-2: Pause any playing audio before refilling text
      pauseAudio();
      // H-9: Preserve voice and speed from history item
      if (voice) {
        setSettings({ voice: voice as VoiceId });
      }
      if (speed !== undefined) {
        setSettings({ speed });
      }
      setRefillText(text);
      setInputText(text);
      setActiveTab("dashboard");
    },
    [pauseAudio, setInputText, setSettings],
  );

  const handleCreateNewFromHistory = useCallback(() => {
    setActiveTab("dashboard");
  }, []);

  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);
    },
    [setInputText],
  );

  const handleTextClear = useCallback(() => {
    clearInputText();
  }, [clearInputText]);

  const headerEyebrow =
    activeTab === "dashboard"
      ? "Trang chủ"
      : activeTab === "voice_library"
        ? "Thư viện"
        : activeTab === "history"
          ? "Lịch sử"
          : "Tài khoản";

  return (
    <>
      <GlobalToastListener addToast={addToast} />
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isOpen={sidebarOpen}
            onClose={handleCloseSidebar}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />

          {/* Main Area - margin trái theo trạng thái thu gọn sidebar (desktop only) */}
          <div
            className={cn(
              "flex-1 flex flex-col overflow-hidden lg:transition-[margin] lg:duration-300 lg:ease-out",
              "lg:pt-4 lg:pr-4 lg:pb-4",
              sidebarCollapsed ? "lg:ml-[120px]" : "lg:ml-[320px]",
            )}
          >
            {/* Header — nút menu gần trong header để title không bị đè/tràn khi resize */}
            <Header
              eyebrow={headerEyebrow}
              title={
                activeTab === "dashboard"
                  ? "Tạo giọng nói mới"
                  : activeTab === "voice_library"
                    ? "Thư viện giọng"
                    : activeTab === "history"
                      ? "Lịch sử"
                      : "Cài đặt tài khoản"
              }
              leftContent={
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl glass-card flex items-center justify-center text-foreground shadow-lg hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 border border-border transition-transform"
                  aria-label="Mở menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              }
            />

            {/* Main content — min-h-0 để flex shrink đúng, overflow-y-auto để scroll khi nội dung dài */}
            {/* pb-20 for BottomNav on mobile, pb-4 sm:pb-6 on desktop */}
            <main className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden custom-scrollbar main-content-scroll pb-20 md:pb-4 sm:pb-6 lg:pt-3">
              <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                {activeTab === "dashboard" ? (
                  <MainContent
                    text={inputText}
                    onTextChange={handleTextChange}
                    onTextClear={handleTextClear}
                    onViewAllVoices={() => setActiveTab("voice_library")}
                    onViewHistory={() => setActiveTab("history")}
                  />
                ) : activeTab === "voice_library" ? (
                  <VoiceLibrary />
                ) : activeTab === "history" ? (
                  <HistoryPanel
                    onRefill={handleRefillFromHistory}
                    onCreateNew={handleCreateNewFromHistory}
                  />
                ) : activeTab === "settings" ? (
                  <VoiceSettings />
                ) : null}
              </div>
              {/* Spacer cố định: flex+overflow đôi khi làm padding-bottom không đủ vùng cuộn; spacer đảm bảo Dashboard / Lịch sử / Thư viện không bị che bởi thanh phát fixed + BottomNav on mobile */}
              {currentAudioUrl ? (
                <div
                  aria-hidden
                  className="pointer-events-none shrink-0 select-none h-[22rem] sm:h-[16rem] lg:h-[14rem] md:h-[14rem]"
                />
              ) : null}
            </main>

            {/* Audio Player */}
            {currentAudioUrl && (
              <AudioPlayer
                isVisible={playerVisible}
                onClose={() => setPlayerVisible(false)}
                sidebarCollapsed={sidebarCollapsed}
              />
            )}
          </div>

          {/* Bottom Navigation - Mobile only */}
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <Suspense fallback={<LoadingFallback />}>
        <TtsProvider>
          <HomeContentInner />
        </TtsProvider>
      </Suspense>
    </ToastProvider>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    </div>
  );
}
