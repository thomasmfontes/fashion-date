import { useState, useEffect } from "react";
import type { NumericDrawConfig, NumericDrawWinner } from "@/types/numericDraw.types";

interface NumericDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NumericDrawConfig;
  onSaveConfig: (newConfig: Partial<NumericDrawConfig>) => void;
  history: NumericDrawWinner[];
  onClearHistory: () => void;
  onRemoveHistoryItem: (id: string) => void;
}

export function NumericDrawModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  history,
  onClearHistory,
  onRemoveHistoryItem,
}: NumericDrawModalProps) {
  const [min, setMin] = useState(config.min);
  const [max, setMax] = useState(config.max);
  const [prizeTitle, setPrizeTitle] = useState(config.prizeTitle);
  const [eventName, setEventName] = useState(config.eventName);
  const [allowRepeat, setAllowRepeat] = useState(config.allowRepeat);
  const [activeTab, setActiveTab] = useState<"config" | "history">("config");

  useEffect(() => {
    if (isOpen) {
      setMin(config.min);
      setMax(config.max);
      setPrizeTitle(config.prizeTitle);
      setEventName(config.eventName);
      setAllowRepeat(config.allowRepeat);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const minNum = Math.max(0, Number(min) || 0);
    const maxNum = Math.max(minNum, Number(max) || 500);
    const computedDigits = Math.max(String(maxNum).length, 3);

    onSaveConfig({
      min: minNum,
      max: maxNum,
      prizeTitle: prizeTitle.trim() || "Prêmio da Rodada",
      eventName: eventName.trim() || "Sorteio Numérico",
      allowRepeat,
      digitCount: computedDigits,
    });
    onClose();
  }

  const totalPossible = Math.max(0, max - min + 1);
  const drawnCount = history.length;
  const remainingCount = Math.max(0, totalPossible - drawnCount);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-card numeric-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="admin-modal-header">
          <div>
            <h3>Configurações do Sorteio Numérico</h3>
            <p>Personalize o intervalo de números, o prêmio e gerencie os sorteados</p>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="numeric-modal-tabs">
          <button
            type="button"
            className={`numeric-tab-btn ${activeTab === "config" ? "active" : ""}`}
            onClick={() => setActiveTab("config")}
          >
            <span className="material-symbols-outlined">tune</span>
            Configurar Sorteio
          </button>
          <button
            type="button"
            className={`numeric-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span className="material-symbols-outlined">history</span>
            Histórico ({history.length})
          </button>
        </div>

        {activeTab === "config" ? (
          <form onSubmit={handleSubmit} className="admin-modal-form">
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label htmlFor="numeric-min">Número Inicial (Mínimo)</label>
                <input
                  id="numeric-min"
                  type="number"
                  min="0"
                  max="99999"
                  value={min}
                  onChange={(e) => setMin(Number(e.target.value))}
                  required
                />
                <small>Ex: 0 (aparecerá como {String(min).padStart(3, "0")})</small>
              </div>

              <div className="admin-modal-field">
                <label htmlFor="numeric-max">Número Final (Máximo)</label>
                <input
                  id="numeric-max"
                  type="number"
                  min="1"
                  max="99999"
                  value={max}
                  onChange={(e) => setMax(Number(e.target.value))}
                  required
                />
                <small>Ex: 500 (total de {totalPossible} números possíveis)</small>
              </div>
            </div>

            <div className="admin-modal-field">
              <label htmlFor="numeric-prize">Nome do Prêmio Atual</label>
              <input
                id="numeric-prize"
                type="text"
                value={prizeTitle}
                onChange={(e) => setPrizeTitle(e.target.value)}
                placeholder="Ex: Bolsa de Luxo / Vale-Compras R$ 500"
                required
              />
              <small>Este nome aparecerá em destaque na tela quando o número for sorteado</small>
            </div>

            <div className="admin-modal-field">
              <label htmlFor="numeric-event">Título do Sorteio / Evento</label>
              <input
                id="numeric-event"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ex: Sorteio Especial da Tarde"
              />
            </div>

            <div className="numeric-checkbox-field">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={allowRepeat}
                  onChange={(e) => setAllowRepeat(e.target.checked)}
                />
                <span className="checkbox-label">
                  <strong>Permitir repetição de números</strong>
                  <small>Se desmarcado, números já sorteados não sairão novamente.</small>
                </span>
              </label>
            </div>

            <div className="numeric-summary-box">
              <div className="summary-item">
                <span>Intervalo:</span>
                <strong>{String(min).padStart(3, "0")} até {String(max).padStart(3, "0")}</strong>
              </div>
              <div className="summary-item">
                <span>Total de Números:</span>
                <strong>{totalPossible}</strong>
              </div>
              <div className="summary-item">
                <span>Já Sorteados:</span>
                <strong>{drawnCount}</strong>
              </div>
              <div className="summary-item">
                <span>Restantes:</span>
                <strong className="gold-text">{allowRepeat ? "Ilimitados" : remainingCount}</strong>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="admin-button primary">
                <span className="material-symbols-outlined">save</span>
                Salvar Configurações
              </button>
            </div>
          </form>
        ) : (
          <div className="numeric-history-content">
            <div className="numeric-history-header">
              <span>{history.length} número(s) sorteado(s)</span>
              {history.length > 0 && (
                <button
                  type="button"
                  className="admin-button danger small"
                  onClick={() => {
                    if (window.confirm("Deseja realmente limpar todo o histórico de números sorteados?")) {
                      onClearHistory();
                    }
                  }}
                >
                  <span className="material-symbols-outlined">delete_sweep</span>
                  Limpar Histórico
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="numeric-history-empty">
                <span className="material-symbols-outlined">casino</span>
                <p>Nenhum número sorteado ainda nesta sessão.</p>
              </div>
            ) : (
              <div className="numeric-history-list">
                {history.map((item, index) => (
                  <div key={item.id} className="numeric-history-item">
                    <div className="history-badge">#{history.length - index}</div>
                    <div className="history-num">{item.number}</div>
                    <div className="history-info">
                      <strong>{item.prizeTitle}</strong>
                      <small>{item.eventName} · {item.drawnAt}</small>
                    </div>
                    <button
                      type="button"
                      className="history-remove-btn"
                      onClick={() => onRemoveHistoryItem(item.id)}
                      title="Remover este número do histórico"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-button primary"
                onClick={onClose}
              >
                Concluído
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
