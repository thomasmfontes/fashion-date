import { useState, useCallback } from "react";
import type { ToastMessage } from "@/types/admin.types";

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "error" | "info" = "success") => {
      setToast({ text, type });
    },
    [],
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    dismissToast,
  };
}
