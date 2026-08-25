"use client";

import { useEffect, useState, useRef } from "react";
import type { ToastMessage } from "@/types/admin.types";

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, onDismiss, durationMs = 3500 }: ToastProps) {
  const [currentMessage, setCurrentMessage] = useState<ToastMessage | null>(message);
  const [isExiting, setIsExiting] = useState(false);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitAnimationTimerRef = useRef<NodeJS.Timeout | null>(null);

  function triggerExit() {
    setIsExiting(true);
    if (exitAnimationTimerRef.current) {
      clearTimeout(exitAnimationTimerRef.current);
    }
    exitAnimationTimerRef.current = setTimeout(() => {
      setIsExiting(false);
      setCurrentMessage(null);
      onDismiss();
    }, 320); // 320ms matches the exit animation duration
  }

  useEffect(() => {
    if (message) {
      // Clear any pending exit animation
      if (exitAnimationTimerRef.current) {
        clearTimeout(exitAnimationTimerRef.current);
      }
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }

      setCurrentMessage(message);
      setIsExiting(false);

      // Auto-dismiss after duration
      if (durationMs > 0) {
        autoDismissTimerRef.current = setTimeout(() => {
          triggerExit();
        }, durationMs);
      }
    } else if (currentMessage && !isExiting) {
      triggerExit();
    }

    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      if (exitAnimationTimerRef.current) clearTimeout(exitAnimationTimerRef.current);
    };
  }, [message, durationMs]);

  if (!currentMessage) return null;

  const isError = currentMessage.type === "error";

  return (
    <div
      className={`app-toast ${isError ? "error" : "success"}${isExiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined">
        {isError ? "error" : "check_circle"}
      </span>
      <p>{currentMessage.text}</p>
      <button
        type="button"
        onClick={triggerExit}
        aria-label="Fechar notificação"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
