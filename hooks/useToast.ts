"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ToastMessage } from "@/types/admin.types";

export function useToast(defaultDurationMs: number = 3500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (
      text: string,
      type: "success" | "error" | "info" = "success",
      durationMs: number = defaultDurationMs
    ) => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({ text, type });

      // Auto-dismiss after duration
      if (durationMs > 0) {
        timerRef.current = setTimeout(() => {
          setToast(null);
          timerRef.current = null;
        }, durationMs);
      }
    },
    [defaultDurationMs]
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
    dismissToast,
  };
}
