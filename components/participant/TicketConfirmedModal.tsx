"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DrawItem } from "@/types/drawCollection.types";
import type { ParticipantTicket, SavedParticipant } from "@/types/participant.types";

interface TicketConfirmedModalProps {
  draw: DrawItem;
  ticket: ParticipantTicket;
  participant?: SavedParticipant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketConfirmedModal({
  draw,
  ticket,
  isOpen,
  onClose,
}: TicketConfirmedModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const rawNum = ticket.ticketNumber.replace(/^#/, "");

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(45, 0, 13, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "liveOverlayIn 0.25s ease both",
        overscrollBehavior: "contain",
        touchAction: "none",
      }}
      onClick={onClose}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "min(400px, calc(100vw - 32px))",
          width: "100%",
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          boxSizing: "border-box",
          background: "#ffffff",
          borderRadius: "20px",
          border: "1.5px solid #ebdcc5",
          padding: "32px 24px 28px",
          boxShadow: "0 24px 60px rgba(67, 0, 20, 0.22)",
          textAlign: "center",
          animation: "bootCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kicker Superior */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "#edf7ef",
            border: "1px solid #c7e8cf",
            color: "#1e7239",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "14px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            check_circle
          </span>
          <span>Número Garantido</span>
        </div>

        {/* Título do Sorteio */}
        <h3
          style={{
            fontFamily: "var(--font-fashion, serif)",
            color: "#530017",
            fontSize: "22px",
            fontWeight: 700,
            lineHeight: 1.25,
            margin: "0 0 4px",
          }}
        >
          {draw.title}
        </h3>

        {/* Prêmio Real */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#786568",
            marginBottom: "18px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9a741a" }}>
            workspace_premium
          </span>
          <span>
            Prêmio: <strong style={{ color: "#530017" }}>{draw.prizeTitle || draw.title}</strong>
          </span>
        </div>

        {/* Cartão de Destaque do Número Gerado */}
        <div
          style={{
            background: "radial-gradient(circle at 50% 30%, #fffdfa 0%, #f7f1e6 100%)",
            border: "1.5px solid #e2cfb4",
            borderRadius: "16px",
            padding: "18px 20px",
            marginBottom: "20px",
            boxShadow: "0 4px 14px rgba(67, 0, 20, 0.04)",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "10.5px",
              fontWeight: 700,
              color: "#9a741a",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Seu Número da Sorte
          </span>

          <div
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              justifyContent: "center",
              fontFamily: '"Bodoni Moda", "Cinzel", Georgia, serif',
              fontVariantNumeric: "lining-nums tabular-nums",
              fontFeatureSettings: '"lnum" 1, "tnum" 1',
              fontWeight: 800,
              fontSize: "48px",
              lineHeight: 1,
              color: "#530017",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: "0.55em",
                color: "#855e09",
                fontWeight: 800,
                marginRight: "4px",
                transform: "translateY(-0.06em)",
              }}
            >
              #
            </span>
            <span>{rawNum}</span>
          </div>
        </div>

        <p
          style={{
            margin: "0 0 22px",
            fontSize: "12.5px",
            color: "#786568",
            lineHeight: 1.5,
          }}
        >
          Este número está registrado na sua conta e participará do sorteio.
        </p>

        {/* Botão de Fechar */}
        <button
          type="button"
          className="stitch-button filled"
          style={{
            width: "100%",
            minHeight: "44px",
            justifyContent: "center",
            fontSize: "12px",
          }}
          onClick={onClose}
        >
          <span>Entendi e Fechar</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
