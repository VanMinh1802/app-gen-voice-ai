"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { Header, Sidebar } from "@/components/layout";
import { MainContent, AudioPlayer, VoiceLibrary } from "@/components/tts";
import { ToastContainer, ToastProvider, useToast, GlobalToastListener, toast } from "@/components/ui/Toast";
import { TtsProvider } from "@/features/tts/context/TtsContext";
import { useTtsStore } from "@/features/tts/store";
import { HistoryPanel } from "@/features/tts/components/HistoryPanel";
import { VoiceSettings } from "@/features/tts/components/VoiceSettings";

type SidebarTab = "dashboard" | "voice_library" | "history" | "settings";

function HomeContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>("dashboard");
  const [refillText, setRefillText] = useState("");
  const { currentAudioUrl, loadHistory } = useTtsStore();
  const { toasts, removeToast, addToast } = useToast();
  const [playerVisible, setPlayerVisible] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Show toast when redirected back with auth_error (e.g. 400 invalid client credentials)
  useEffect(() => {
    if (searchParams.get("auth_error") !== "true") return;
    const message = searchParams.get("message");
    const decoded = message ? decodeURIComponent(message) : "Lỗi đăng nhập";
    toast("error", decoded, 8000);
    const lower = decoded.toLowerCase();
    if (lower.includes("invalid") && (lower.includes("credential") || lower.includes("client"))) {
      toast(
        "info",
        "Chạy local: thêm NEXT_PUBLIC_GENATION_CLIENT_SECRET vào .env.local (cùng giá trị với GENATION_CLIENT_SECRET), rồi restart npm run dev. Xem docs/cloudflare-pages-env.md.",
        12000
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

  const handleRefillFromHistory = useCallback((text: string) => {
    setRefillText(text);
    setActiveTab("dashboard");
  }, []);

  const handleCreateNewFromHistory = useCallback(() => {
    setActiveTab("dashboard");
  }, []);

  return (
    <>
      <GlobalToastListener addToast={addToast} />
      <TtsProvider>
        <div className="flex h-screen flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              isOpen={sidebarOpen} 
              onClose={handleCloseSidebar} 
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
              {/* Header */}
              <Header
                title={activeTab === "dashboard" ? "Tạo giọng nói mới" : 
                       activeTab === "voice_library" ? "Thư viện giọng" :
                       activeTab === "history" ? "Lịch sử" : "Cài đặt tài khoản"}
              />

              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-20 left-4 z-30 lg:hidden w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-foreground shadow-lg hover:scale-105 active:scale-95 border border-border"
                aria-label="Mở menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Main content */}
              <main className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pb-28 sm:pb-24">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-screen-2xl">
                  {activeTab === "dashboard" ? (
                    <MainContent 
                      key={refillText}
                      initialText={refillText}
                      onViewAllVoices={() => setActiveTab("voice_library")}
                    />
                  ) : activeTab === "voice_library" ? (
                    <VoiceLibrary />
                  ) : activeTab === "history" ? (
                    <HistoryPanel onRefill={handleRefillFromHistory} onCreateNew={handleCreateNewFromHistory} />
                  ) : activeTab === "settings" ? (
                    <VoiceSettings />
                  ) : null}
                </div>
              </main>

              {/* Audio Player */}
              {currentAudioUrl && (
                <AudioPlayer
                  isVisible={playerVisible}
                  onClose={() => setPlayerVisible(false)}
                />
              )}
            </div>
          </div>

          {/* Toast notifications */}
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
      </TtsProvider>
    </>
  );
}

export default function HomePage() {
  return (
    <ToastProvider>
      <Suspense fallback={<LoadingFallback />}>
        <HomeContentInner />
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
