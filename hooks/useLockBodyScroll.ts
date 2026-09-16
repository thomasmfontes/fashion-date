"use client";

import { useEffect } from "react";

let activeModalsCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

/**
 * Bloqueia a rolagem do elemento <body> enquanto o modal ou gaveta estiver aberto.
 * Suporta modais aninhados/múltiplos com contagem de referência e compensa
 * a barra de rolagem no desktop para evitar layout shift.
 */
export function useLockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    if (activeModalsCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.style.overflow = "hidden";
      document.body.classList.add("stitch-modal-open");
    }

    activeModalsCount++;

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);
      if (activeModalsCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.classList.remove("stitch-modal-open");
      }
    };
  }, [isOpen]);
}
