"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  renotify?: boolean;
  silent?: boolean;
}

interface UseNotificationReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  showNotification: (title: string, options?: NotificationOptions) => void;
  requestPermission: () => Promise<NotificationPermission>;
}

/**
 * Hook for browser native notifications
 * Provides real desktop notifications beyond in-app toasts
 */
export function useNotification(): UseNotificationReturn {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check support
    const supported = "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) return "denied";

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        logger.error("Failed to request notification permission:", error);
        return "denied";
      }
    }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported) {
        logger.warn("Notifications not supported");
        return;
      }

      if (permission !== "granted") {
        logger.warn("Notification permission not granted");
        return;
      }

      try {
        const notification = new Notification(title, {
          icon: "/logo.png",
          badge: "/logo.png",
          silent: options?.silent ?? true,
          ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        logger.error("Failed to show notification:", error);
      }
    },
    [isSupported, permission],
  );

  return {
    permission,
    isSupported,
    showNotification,
    requestPermission,
  };
}

/**
 * Utility function to show notifications from anywhere
 * Use within React components via useNotification hook
 */
export function notify(title: string, options?: NotificationOptions): void {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/logo.png",
      badge: "/logo.png",
      silent: options?.silent ?? true,
      ...options,
    });
  }
}
