import type { Participant } from "@/types/participant.types";
import { formatLuckyNumber, buildWhatsAppUrl, buildInstagramUrl, cleanInstagramHandle } from "@/utils/formatters";

interface DrawWinnerCardProps {
  winner: Participant;
  onNewDraw?: () => void;
  onGoToPanel?: () => void;
}

export function DrawWinnerCard({
  winner,
  onNewDraw,
  onGoToPanel,
}: DrawWinnerCardProps) {
  return (
    <section
      className="winner-panel"
      aria-label="Vencedor do sorteio"
    >
      <div className="winner-confetti" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 4.2) % 100}%`,
              animationDelay: `${(index * 0.12) % 1.5}s`,
              animationDuration: `${2.2 + ((index * 0.15) % 1.2)}s`,
              backgroundColor: index % 2 === 0 ? "#e7c275" : "#530017",
            }}
          />
        ))}
      </div>

      <div className="winner-emblem">
        <span className="material-symbols-outlined">workspace_premium</span>
      </div>

      <span className="winner-tag">Participante Contemplado</span>

      <strong className="lucky-number">
        {formatLuckyNumber(winner.luckyNumber)}
      </strong>

      <h2 className="winner-name">{winner.name}</h2>
      <p className="winner-store">{winner.store}</p>

      <div className="winner-meta">
        <a
          className="meta-badge"
          href={buildWhatsAppUrl(winner.phone, winner.name, winner.store)}
          target="_blank"
          rel="noreferrer"
          title="Abrir conversa no WhatsApp"
        >
          <img
            src="https://cdn.simpleicons.org/whatsapp/128C7E"
            alt=""
            width="14"
            height="14"
          />
          <span>WhatsApp do Ganhador</span>
        </a>
        <a
          className="meta-badge"
          href={buildInstagramUrl(winner.instagram)}
          target="_blank"
          rel="noreferrer"
          title="Ver perfil no Instagram"
        >
          <img
            src="https://cdn.simpleicons.org/instagram/E1306C"
            alt=""
            width="14"
            height="14"
          />
          <span>@{cleanInstagramHandle(winner.instagram)}</span>
        </a>
      </div>

      <div className="winner-actions">
        {onNewDraw && (
          <button
            className="primary-button winner-action-main"
            type="button"
            onClick={onNewDraw}
          >
            <span className="material-symbols-outlined">confirmation_number</span>
            <span>Sortear Próximo</span>
          </button>
        )}
        {onGoToPanel && (
          <button
            className="admin-button"
            type="button"
            onClick={onGoToPanel}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Voltar ao Painel</span>
          </button>
        )}
      </div>
    </section>
  );
}
