"use client";

import { useEffect } from "react";
import { loadR2Config } from "@/lib/config/r2Config";

/**
 * Loads /r2-config.json on mount so getR2PublicUrl() returns the R2 public URL.
 * Tránh phụ thuộc API /api/models khi deploy Cloudflare Pages (build env có thể không có NEXT_PUBLIC_R2_PUBLIC_URL).
 */
export function R2ConfigProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    loadR2Config();
  }, []);
  return <>{children}</>;
}
