"use client";

import { useEffect } from "react";

/**
 * Desativado conforme solicitado: assegura rolagem natural e irrestrita
 * em todas as telas, modais e tabelas, garantindo que o <body> nunca fique travado.
 */
export function useLockBodyScroll(_isOpen?: boolean) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (document.body.classList.contains("stitch-modal-open")) {
      document.body.classList.remove("stitch-modal-open");
    }
    if (document.body.style.overflow === "hidden") {
      document.body.style.overflow = "";
    }
    if (document.body.style.paddingRight) {
      document.body.style.paddingRight = "";
    }
  }, []);
}
