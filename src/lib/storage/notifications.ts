import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  title: string;
  description?: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  addNotification: (
    notification: Omit<AppNotification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const generateId = () =>
  `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: AppNotification = {
          ...notification,
          id: generateId(),
          timestamp: Date.now(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount:
              notification && !notification.read
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: "genvoice-notifications",
    },
  ),
);

/**
 * Add notification when TTS generation completes successfully
 */
export function notifyGenerationComplete(text: string, voiceName: string) {
  useNotificationStore.getState().addNotification({
    type: "success",
    title: "Tạo audio hoàn thành",
    description: `Giọng ${voiceName} - "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`,
    link: "/#player",
  });
}

/**
 * Add notification when TTS generation fails
 */
export function notifyGenerationError(error: string) {
  useNotificationStore.getState().addNotification({
    type: "error",
    title: "Tạo audio thất bại",
    description: error,
  });
}

/**
 * Add notification when new voice model is available
 */
export function notifyNewVoiceModel(voiceName: string) {
  useNotificationStore.getState().addNotification({
    type: "info",
    title: "Model giọng mới",
    description: `Giọng ${voiceName} đã sẵn sàng`,
    link: "/#voice-library",
  });
}
