"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "error" | "success" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({
    toasts,
    addToast,
    removeToast,
  }), [toasts, addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function toast(type: ToastType, message: string, duration = 5000) {
  // This will be handled by the provider through events or we can use a simple event emitter
  // For now, dispatch a custom event
  if (typeof window !== "undefined") {
    const event = new CustomEvent("vietvoice-toast", {
      detail: { type, message, duration },
    });
    window.dispatchEvent(event);
  }
}

// ToastItem Component
interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  // Error toast style - matching mockup with red background #ef4444
  if (toast.type === "error") {
    return (
      <div
        className="flex flex-col gap-3 p-4 rounded-xl border animate-fade-in bg-[#ef4444] border-[#ef4444] text-white shadow-lg"
        role="alert"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
        </div>
        <div className="flex items-center gap-2 ml-8">
          <button
            onClick={() => onClose(toast.id)}
            className="px-4 py-2 text-sm font-medium bg-white text-[#ef4444] rounded-lg hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const colors = {
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border animate-fade-in",
        colors[toast.type as "success" | "info"]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
        aria-label="Đóng thông báo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onRemove} />
      ))}
    </div>
  );
}

// Global toast listener component
export function GlobalToastListener({ addToast }: { addToast: (toast: Omit<Toast, "id">) => void }) {
  useEffect(() => {
    const handleToast = (event: CustomEvent<Omit<Toast, "id">>) => {
      addToast(event.detail);
    };

    window.addEventListener("vietvoice-toast", handleToast as EventListener);
    return () => {
      window.removeEventListener("vietvoice-toast", handleToast as EventListener);
    };
  }, [addToast]);

  return null;
}
