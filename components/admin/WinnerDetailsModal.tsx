"use client";

import type { DrawWinnerItem } from "@/types/participant.types";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/utils/formatters";

interface WinnerDetailsModalProps {
  winner: DrawWinnerItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WinnerDetailsModal({
  winner,
  isOpen,
  onClose,
}: WinnerDetailsModalProps) {
  if (!isOpen || !winner) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Sorteio"
      badge={
        <span className="edit-ticket-badge">
          Bilhete: <strong>#{winner.luckyNumber}</strong>
        </span>
      }
    >
      <p style={{ color: "#6b585b", fontSize: "13.5px", margin: "-12px 0 18px", lineHeight: 1.4 }}>
        Ganhador: <strong style={{ color: "#2e1f22" }}>{winner.name}</strong>
        {winner.store && winner.store !== "—" ? ` (${winner.store})` : ""}
      </p>

      {/* Card do Sorteio no padrão exato do sistema */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          border: "1px solid #e5dbcf",
          borderRadius: "8px",
          background: "#fcfbfa",
        }}
      >
        <div>
          <strong style={{ color: "#2e1f22", fontSize: "14px", display: "block" }}>
            {winner.drawTitle}
          </strong>
          <span style={{ color: "#78686a", fontSize: "12px" }}>
            Prêmio: {winner.prizeTitle || winner.drawTitle}
          </span>
        </div>

        <strong
          style={{
            color: "#530017",
            fontSize: "17px",
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          #{winner.luckyNumber}
        </strong>
      </div>

      {/* Data da apuração discreta */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px",
          padding: "0 2px",
          fontSize: "12px",
          color: "#8c787a",
        }}
      >
        <span>Data da Apuração:</span>
        <strong style={{ color: "#372729", fontWeight: 600 }}>
          {formatDate(winner.wonAt)}
        </strong>
      </div>

      <footer className="edit-modal-footer">
        <button
          type="button"
          className="stitch-button outline"
          onClick={onClose}
        >
          Fechar
        </button>
      </footer>
    </Modal>
  );
}
