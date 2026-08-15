import { useState } from "react";
import type { Participant } from "@/types/participant.types";
import { formatLuckyNumber } from "@/utils/formatters";

interface LuckyTicketCardProps {
  participant: Participant;
  isDuplicate?: boolean;
}

export function LuckyTicketCard({
  participant,
  isDuplicate = false,
}: LuckyTicketCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      ?.writeText(String(participant.luckyNumber))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        // clipboard permission fallback
      });
  }

  return (
    <div className="ticket-card" aria-label="Comprovante do Número da Sorte">
      <div className="ticket-header">
        <span className="ticket-kicker">
          {isDuplicate ? "Cadastro Já Confirmado" : "Inscrição Garantida"}
        </span>
        <span className="ticket-badge">Fashion Date 2026</span>
      </div>

      <div className="ticket-body">
        <span className="ticket-label">Seu Número da Sorte</span>
        <strong className="ticket-number">
          {formatLuckyNumber(participant.luckyNumber)}
        </strong>
        <p className="ticket-participant">
          <strong>{participant.name}</strong> • <em>{participant.store}</em>
        </p>
      </div>

      <div className="ticket-footer">
        <button
          type="button"
          className="ticket-copy-btn"
          onClick={handleCopy}
          title="Copiar número da sorte"
        >
          <span className="material-symbols-outlined">
            {copied ? "check" : "content_copy"}
          </span>
          <span>{copied ? "Copiado!" : "Copiar Número"}</span>
        </button>
      </div>
    </div>
  );
}
