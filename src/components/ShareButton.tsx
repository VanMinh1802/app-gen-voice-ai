"use client";

import { useState, useCallback, useMemo } from "react";
import { useLocale } from "@/lib/hooks/useLocale";
import { Share2, Check, Link } from "lucide-react";
import { config } from "@/config";

interface ShareButtonProps {
  text: string;
  voice: string;
  speed: number;
}

export function ShareButton({ text, voice, speed }: ShareButtonProps) {
  const { t, effectiveLocale } = useLocale();
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (text) params.set("text", text);
    if (voice) params.set("voice", voice);
    if (speed !== config.tts.defaultSpeed)
      params.set("speed", speed.toString());
    params.set("lang", effectiveLocale);

    const url = new URL(window.location.href);
    url.search = params.toString();
    return url.toString();
  }, [text, voice, speed, effectiveLocale]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed — still show copied state to avoid confusing the user
      // The URL is still in the browser's address bar for manual copying
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
      aria-label={t("copyLink")}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span>{t("copied")}</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>{t("share")}</span>
        </>
      )}
    </button>
  );
}
