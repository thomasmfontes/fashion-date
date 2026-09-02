"use client";

import type { Participant } from "@/types/participant.types";
import { Modal } from "@/components/ui/Modal";

interface ParticipantTicketsModalProps {
  participant: Participant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ParticipantTicketsModal({
  participant,
  isOpen,
  onClose,
}: ParticipantTicketsModalProps) {
  if (!isOpen || !participant) return null;

  const tickets = participant.tickets || [];
  const hasTickets = tickets.length > 0;
  const count = hasTickets ? tickets.length : participant.luckyNumber ? 1 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bilhetes do Participante"
      badge={
        <span className="edit-ticket-badge">
          Bilhetes: <strong>{count}</strong>
        </span>
      }
    >
      <p style={{ color: "#6b585b", fontSize: "13.5px", margin: "-12px 0 18px", lineHeight: 1.4 }}>
        Participante: <strong style={{ color: "#2e1f22" }}>{participant.name}</strong>
        {participant.store && participant.store !== "—" ? ` (${participant.store})` : ""}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {hasTickets ? (
          tickets.map((t) => (
            <div
              key={t.drawId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 15px",
                border: "1px solid #e5dbcf",
                borderRadius: "8px",
                background: "#fcfbfa",
              }}
            >
              <div>
                <strong style={{ color: "#2e1f22", fontSize: "13.5px", display: "block" }}>
                  {t.drawTitle}
                </strong>
                <span style={{ color: "#78686a", fontSize: "12px" }}>
                  Prêmio: {t.prizeTitle || t.drawTitle}
                </span>
              </div>

              <strong
                style={{
                  color: "#530017",
                  fontSize: "16px",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                #{t.ticketNumber}
              </strong>
            </div>
          ))
        ) : participant.luckyNumber ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 15px",
              border: "1px solid #e5dbcf",
              borderRadius: "8px",
              background: "#fcfbfa",
            }}
          >
            <div>
              <strong style={{ color: "#2e1f22", fontSize: "13.5px", display: "block" }}>
                Sorteio Geral
              </strong>
              <span style={{ color: "#78686a", fontSize: "12px" }}>
                Número da sorte cadastrado
              </span>
            </div>

            <strong
              style={{
                color: "#530017",
                fontSize: "16px",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 700,
              }}
            >
              #{participant.luckyNumber}
            </strong>
          </div>
        ) : (
          <p style={{ color: "#78686a", fontSize: "13px", textAlign: "center", padding: "16px 0", margin: 0 }}>
            Nenhum bilhete emitido ainda.
          </p>
        )}
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
