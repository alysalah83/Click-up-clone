"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster, toast } from "sonner";

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

// Durations in the existing API are seconds; sonner uses milliseconds.
// 0 meant "persistent" in the previous toaster, which sonner spells Infinity.
export const toMs = (seconds = 5) => (seconds === 0 ? Infinity : seconds * 1000);

export default function Toaster() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    window.toast = {
      success: (message, duration) => String(toast.success(message, { duration: toMs(duration) })),
      error: (message, duration) => String(toast.error(message, { duration: toMs(duration) })),
      loading: (message) => String(toast.loading(message)),
      dismiss: (id) => toast.dismiss(id),
    };
    return () => {
      delete window.toast;
    };
  }, []);

  return (
    <SonnerToaster
      position="bottom-left"
      offset={{ bottom: 16, left: 128 }}
      theme={resolvedTheme === "light" ? "light" : "dark"}
      closeButton
      // A Radix modal dialog sets pointer-events: none on <body>; keep toasts
      // clickable (close button, hover-to-pause) while one is open.
      style={{ pointerEvents: "auto" }}
      toastOptions={{ classNames: { toast: "!bg-neutral-950 !text-neutral-100 !border-neutral-800" } }}
    />
  );
}
