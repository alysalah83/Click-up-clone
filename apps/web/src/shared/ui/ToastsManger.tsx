"use client";

import { ICONS_MAP } from "@/shared/icons/icons-map";
import { IconsMap } from "@/shared/icons/icons.type";
import clsx from "clsx";
import { useCallback, useEffect, useState, useRef } from "react";

type ToastType = "success" | "error" | "loading";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  isEntering?: boolean;
  isExiting?: boolean;
}

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

declare global {
  interface Window {
    toast?: {
      success: (message: string, duration?: number) => string;
      error: (message: string, duration?: number) => string;
      loading: (message: string) => string;
      dismiss: (id: string) => void;
    };
  }
}

function ToastsManger() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast,
      ),
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration = 5) => {
      const newToast: Toast = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        duration,
        isEntering: true,
      };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) =>
          prev.map((toast) =>
            toast.id === newToast.id ? { ...toast, isEntering: false } : toast,
          ),
        );
      }, 50);

      if (type !== "loading" && duration > 0) {
        const timeoutId = setTimeout(
          () => removeToast(newToast.id),
          duration * 1000,
        );
        timeoutRefs.current.set(newToast.id, timeoutId);
      }

      return newToast.id;
    },
    [removeToast],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.toast = {
        success: (message: string, duration?: number) =>
          addToast(message, "success", duration),
        error: (message: string, duration?: number) =>
          addToast(message, "error", duration),
        loading: (message: string) => addToast(message, "loading"),
        dismiss: removeToast,
      };

      return () => {
        window.toast = undefined;
        timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
        timeoutRefs.current.clear();
      };
    }
  }, [addToast, removeToast]);

  return (
    <div className="fixed bottom-4 left-32 z-[9999] flex flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <Toast
          toast={toast}
          key={toast.id}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: ToastProps) {
  const { duration, type, message, isEntering, isExiting } = toast;

  const icons = {
    error: "error" as IconsMap,
    success: "complete" as IconsMap,
    loading: "spinner" as IconsMap,
  };

  const Icon = ICONS_MAP[icons[type]];

  const closeToast = useCallback(() => {
    onClose();
  }, [onClose]);

  const IconClasses = clsx("shrink-0 transition duration-300", {
    "size-4.5 text-red-500 fill-red-500": type === "error",
    "size-5.5 text-green-500 fill-green-500": type === "success",
    "size-4.5 text-blue-500 fill-blue-500 animate-spin": type === "loading",
  });

  const messageClasses = clsx("text-sm max-w-[80%] font-medium flex-1", {
    "text-red-100": type === "error",
    "text-green-100": type === "success",
    "text-blue-100": type === "loading",
  });

  const containerClasses = clsx(
    "relative flex max-w-sm min-w-xs items-start gap-3 rounded-lg bg-neutral-950 p-4 shadow-lg transition-all duration-300 ease-out",
    {
      "translate-y-full opacity-0": isEntering,
      "translate-y-0 opacity-100": !isEntering && !isExiting,
      "translate-y-4 opacity-0 scale-95": isExiting,
    },
  );

  const progressBarClasses = clsx("h-full transition-all ease-linear", {
    "bg-red-500": type === "error",
    "bg-green-500": type === "success",
    "bg-blue-500": type === "loading",
  });

  return (
    <div className={containerClasses} role="alert">
      <Icon className={IconClasses} />
      <p className={messageClasses}>{message}</p>

      {duration > 0 && !isExiting && (
        <div className="absolute right-0 bottom-0 left-0 h-1 w-full overflow-hidden rounded-b-lg bg-neutral-800">
          <div
            style={{
              width: "100%",
              animation: `shrink ${duration}s linear forwards`,
            }}
            className={progressBarClasses}
          />
        </div>
      )}

      <button
        className="absolute top-2 right-2 shrink-0 cursor-pointer p-1 transition duration-300 hover:rotate-180 active:rotate-[360deg]"
        type="button"
        aria-label="close notification"
        onClick={closeToast}
      >
        <ICONS_MAP.close className="size-4.5 text-neutral-500 hover:text-neutral-300" />
      </button>
    </div>
  );
}

export default ToastsManger;
