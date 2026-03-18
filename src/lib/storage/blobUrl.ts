import { logger } from "@/lib/logger";

/**
 * Blob URL Manager
 * Utility for creating and revoking blob URLs to prevent memory leaks
 */

const activeBlobUrls = new Set<string>();

/**
 * Create a blob URL and track it for later cleanup
 */
export function createBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  activeBlobUrls.add(url);
  return url;
}

/**
 * Revoke a blob URL and remove from tracking
 */
export function revokeBlobUrl(url: string | null | undefined): void {
  if (!url || !url.startsWith("blob:")) return;
  
  try {
    URL.revokeObjectURL(url);
    activeBlobUrls.delete(url);
    } catch (e) {
      logger.warn("Failed to revoke blob URL:", url);
  }
}

/**
 * Revoke all tracked blob URLs (useful for cleanup)
 */
export function revokeAllBlobUrls(): void {
  activeBlobUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore errors
    }
  });
  activeBlobUrls.clear();
}

/**
 * Check if a URL is a tracked blob URL
 */
export function isBlobUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith("blob:") && activeBlobUrls.has(url);
}
