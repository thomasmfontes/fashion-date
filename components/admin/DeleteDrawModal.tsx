"use client";

import { useState, useEffect } from "react";

interface DeleteDrawModalProps {
  isOpen: boolean;
  drawTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function DeleteDrawModal({
  isOpen,
  drawTitle,
  onClose,
  onConfirm,
}: DeleteDrawModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      return;
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // erro tratado no pai
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-draw-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27, 28, 25, 0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: "20px",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={() => !isDeleting && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "28px 24px",
          borderRadius: "16px",
          textAlign: "center",
          background: "#ffffff",
          border: "1px solid #ebdcc5",
          boxShadow: "0 20px 50px rgba(67, 0, 20, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
            warning
          </span>
        </div>

        <h3
          id="delete-draw-title"
          style={{
            margin: "0 0 8px",
            fontSize: "20px",
            fontFamily: "var(--font-fashion, serif)",
            color: "#530017",
            fontWeight: 700,
          }}
        >
          Excluir Sorteio?
        </h3>

        <p style={{ margin: "0 0 20px", fontSize: "13.5px", color: "#6d5b5d", lineHeight: "1.5" }}>
          Tem certeza que deseja remover o sorteio <strong>&ldquo;{drawTitle}&rdquo;</strong>? Esta ação não pode ser desfeita e removerá a rodada do evento.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            type="button"
            className="stitch-button outline"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              minHeight: "44px",
              borderColor: "#ebdcc5",
              color: "#5a474a",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="stitch-button filled"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              minHeight: "44px",
              background: "#991b1b",
              borderColor: "#991b1b",
              color: "#ffffff",
            }}
          >
            {isDeleting ? "Excluindo..." : "Sim, Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
