"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_KEY = "fd_pwa_banner_dismissed";

export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [canPromptNative, setCanPromptNative] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Verifica se já está rodando como app instalado (Standalone)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone) ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    // 2. Detecção de SO
    const ua = navigator.userAgent || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /Android/i.test(ua);

    setIsIos(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Verifica se o banner foi dispensado anteriormente
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
      setIsDismissed(dismissed);
    } catch {
      // Ignora erro de localStorage
    }

    // 4. Captura evento nativo do Chrome/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPromptNative(true);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setCanPromptNative(false);
      deferredPromptRef.current = null;
      setIsModalOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPromptRef.current) {
      try {
        await deferredPromptRef.current.prompt();
        const choice = await deferredPromptRef.current.userChoice;
        if (choice.outcome === "accepted") {
          setIsStandalone(true);
          deferredPromptRef.current = null;
          setCanPromptNative(false);
          setIsModalOpen(false);
          return { installed: true };
        }
      } catch (err) {
        console.warn("Erro ao disparar prompt nativo:", err);
      }
    }
    // Caso não haja prompt nativo ou seja iOS, abre o modal instrutivo
    setIsModalOpen(true);
    return { installed: false, openedModal: true };
  }, []);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignora erro de localStorage
    }
  }, []);

  const openGuide = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isStandalone,
    isIos,
    isAndroid,
    canPromptNative,
    isDismissed,
    isModalOpen,
    promptInstall,
    dismissBanner,
    openGuide,
    closeGuide,
  };
}
