"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SavedParticipant } from "@/types/participant.types";
import type { DrawItem } from "@/types/drawCollection.types";
import type { ParticipantTicket } from "@/types/participant.types";
import { TicketConfirmedModal } from "../TicketConfirmedModal";
import { useSoundFx } from "@/hooks/useSoundFx";

interface TicketsTabProps {
  participant: SavedParticipant | null;
  tickets: ParticipantTicket[];
  eligibleDraws: DrawItem[];
  hasTicket: (drawId: string) => boolean;
  getTicket?: (drawId: string) => ParticipantTicket | undefined;
  enterDraw: (draw: DrawItem) => Promise<unknown>;
  onNavigate?: (tab: "tickets" | "live" | "profile") => void;
}

export function TicketsTab({
  participant,
  tickets,
  eligibleDraws,
  hasTicket,
  enterDraw,
  onNavigate,
}: TicketsTabProps) {
  const { playTick, playLock } = useSoundFx();

  const [animatingDrawId, setAnimatingDrawId] = useState<string | null>(null);
  const [cardDigits, setCardDigits] = useState<string[]>(["0", "0", "0", "0"]);
  const [cardLocked, setCardLocked] = useState<boolean[]>([false, false, false, false]);
  const [cardState, setCardState] = useState<"idle" | "spinning" | "locking" | "done">("idle");
  const [confirmedModalData, setConfirmedModalData] = useState<{
    draw: DrawItem;
    ticket: ParticipantTicket;
  } | null>(null);

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardLockedRef = useRef<boolean[]>([false, false, false, false]);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

  const handleClaimDraw = useCallback(
    async (draw: DrawItem) => {
      if (animatingDrawId) return;

      setAnimatingDrawId(draw.id);
      setCardDigits(["0", "0", "0", "0"]);
      cardLockedRef.current = [false, false, false, false];
      setCardLocked([false, false, false, false]);
      setCardState("spinning");

      // Inicia giro rápido dos 4 tambores no card com som de tick
      let tickCount = 0;
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        setCardDigits((prev) =>
          prev.map((d, idx) =>
            cardLockedRef.current[idx] ? d : String(Math.floor(Math.random() * 10))
          )
        );
        tickCount++;
        if (tickCount % 2 === 0) {
          try {
            playTick();
          } catch {
            /* ignore audio */
          }
        }
      }, 70);

      const startTime = Date.now();
      let ticket: ParticipantTicket | null = null;

      try {
        const result = await enterDraw(draw);
        if (result && typeof result === "object" && "ticketNumber" in result) {
          ticket = result as ParticipantTicket;
        } else {
          ticket = tickets.find((t) => t.drawId === draw.id) || null;
        }
      } catch (err) {
        console.error("Erro ao garantir número:", err);
      }

      // Suspense de no mínimo 850ms para criar a expectativa divertida no card
      const elapsed = Date.now() - startTime;
      if (elapsed < 850) {
        await new Promise((r) => setTimeout(r, 850 - elapsed));
      }

      if (!ticket || !isMountedRef.current) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        setAnimatingDrawId(null);
        setCardState("idle");
        return;
      }

      // Extrai os 4 dígitos oficiais do número da sorte
      const targetNum = ticket.ticketNumber.replace(/\D/g, "").padStart(4, "0").slice(-4);
      const targetDigits = targetNum.split("");

      setCardState("locking");

      // Trava progressiva dos dígitos diretamente no card com ritmo dinâmico
      for (let i = 0; i < 4; i++) {
        const stepDelay = i === 3 ? 320 : 230;
        await new Promise((r) => setTimeout(r, stepDelay));
        if (!isMountedRef.current) return;

        cardLockedRef.current[i] = true;
        setCardLocked([...cardLockedRef.current]);
        setCardDigits((prev) => {
          const next = [...prev];
          next[i] = targetDigits[i];
          return next;
        });

        try {
          playLock();
        } catch {
          /* ignore audio */
        }
      }

      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      setCardState("done");

      // Aguarda 650ms para o participante contemplar o número reluzente gerado no card
      await new Promise((r) => setTimeout(r, 650));
      if (!isMountedRef.current) return;

      // Abre o modal limpo com a informação real
      setConfirmedModalData({ draw, ticket });
    },
    [animatingDrawId, enterDraw, tickets, playTick, playLock]
  );

  function handleCloseConfirmedModal() {
    setConfirmedModalData(null);
    setAnimatingDrawId(null);
    setCardState("idle");
    cardLockedRef.current = [false, false, false, false];
  }

  // O bilhete é salvo assim que a API responde, mas só deve aparecer na
  // carteira depois que o participante confirmar o modal.
  const visibleTickets = tickets.filter((t) => t.drawId !== animatingDrawId);

  // Mantém o card que está sendo animado visível até o modal fechar
  const availableDraws = eligibleDraws.filter(
    (d) => !hasTicket(d.id) || d.id === animatingDrawId
  );

  function renderDrawCard(draw: DrawItem) {
    const isThisCardAnimating = animatingDrawId === draw.id;

    return (
      <article
        key={draw.id}
        className="stitch-draw-card-luxury"
        style={{
          boxSizing: "border-box",
          maxWidth: "100%",
          overflow: "hidden",
          ...(isThisCardAnimating
            ? {
                borderColor: "#c79a36",
                boxShadow: "0 12px 35px rgba(83, 0, 23, 0.14), 0 0 20px rgba(199, 154, 54, 0.2)",
                transition: "all 0.3s ease",
              }
            : {}),
        }}
      >
        <div>
          <div style={{ marginBottom: "12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: isThisCardAnimating
                  ? "linear-gradient(135deg, #530017 0%, #720023 100%)"
                  : "rgba(154, 116, 26, 0.08)",
                border: isThisCardAnimating
                  ? "1px solid #c79a36"
                  : "1px solid rgba(154, 116, 26, 0.22)",
                color: isThisCardAnimating ? "#fff2cc" : "#855e09",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                boxShadow: isThisCardAnimating ? "0 2px 8px rgba(83,0,23,0.3)" : "none",
                transition: "all 0.25s ease",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isThisCardAnimating ? "#ffd54f" : "#c79a36",
                  boxShadow: isThisCardAnimating ? "0 0 6px #ffd54f" : "none",
                }}
              />
              {isThisCardAnimating ? "Sorteando..." : "Disponível"}
            </span>
          </div>

          <h4
            style={{
              fontFamily: "var(--font-fashion, serif)",
              fontSize: "19px",
              fontWeight: 700,
              color: "#332225",
              lineHeight: 1.25,
              margin: "0 0 6px",
            }}
          >
            {draw.title}
          </h4>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "12px", color: "#786568" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9a741a", marginTop: "1px", flexShrink: 0 }}>
              workspace_premium
            </span>
            <span>
              Prêmio: <strong style={{ color: "#530017", fontWeight: 600 }}>{draw.prizeTitle || draw.title}</strong>
            </span>
          </div>
        </div>

        <div>
          <div className="stitch-ticket-perforation" />
          {isThisCardAnimating ? (
            <div
              style={{
                maxWidth: "100%",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box",
                background: "radial-gradient(ellipse at 50% 20%, #720023 0%, #460015 55%, #2d000d 100%)",
                border: "2px solid #e7c275",
                borderRadius: "14px",
                padding: "12px 10px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 10px 28px rgba(45, 0, 13, 0.35), 0 0 20px rgba(231, 194, 117, 0.2)",
                animation: "bootCardIn 0.3s ease both",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Feixe de luz superior no container */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "15%",
                  right: "15%",
                  height: "1.5px",
                  background: "linear-gradient(90deg, transparent 0%, #fff2cc 50%, transparent 100%)",
                  boxShadow: "0 0 14px #ffe599",
                }}
              />

              {/* Badge de status com alto contraste e dinamismo */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  background: cardState === "done"
                    ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                    : "linear-gradient(135deg, #fff3d6 0%, #fde68a 100%)",
                  border: cardState === "done" ? "1px solid #22c55e" : "1px solid #f59e0b",
                  color: cardState === "done" ? "#14532d" : "#78350f",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  boxShadow: cardState === "done"
                    ? "0 2px 8px rgba(34, 197, 94, 0.3)"
                    : "0 2px 8px rgba(245, 158, 11, 0.3)",
                  transition: "all 0.3s ease",
                  maxWidth: "100%",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "15px",
                    animation: cardState !== "done" ? "spin 1s linear infinite" : "none",
                  }}
                >
                  {cardState === "done" ? "verified" : "autorenew"}
                </span>
                <span>
                  {cardState === "done"
                    ? "Número Gerado!"
                    : cardState === "locking"
                    ? "Gravando Dígitos..."
                    : "Sorteando seu Número..."}
                </span>
              </div>

              {/* Tambores Centrais de Alta Visibilidade e Contraste */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "2px 0",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: "24px",
                    color: "#ffe599",
                    fontWeight: 900,
                    lineHeight: 1,
                    marginRight: "2px",
                    flexShrink: 0,
                    textShadow: "0 0 10px rgba(255, 229, 153, 0.8), 0 2px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  #
                </span>

                {cardDigits.map((digit, i) => {
                  const isLocked = cardLocked[i];
                  return (
                    <div
                      key={i}
                      style={{
                        flex: "1 1 0",
                        maxWidth: "46px",
                        minWidth: "28px",
                        height: "52px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isLocked
                          ? "linear-gradient(180deg, #ffffff 0%, #fff6e0 100%)"
                          : "linear-gradient(180deg, #ffffff 0%, #fdf8ef 100%)",
                        border: isLocked
                          ? "2px solid #d4af37"
                          : "1.5px solid rgba(212, 175, 55, 0.7)",
                        borderRadius: "10px",
                        boxShadow: isLocked
                          ? "0 0 16px rgba(255, 215, 0, 0.7), 0 6px 14px rgba(0,0,0,0.35)"
                          : "0 4px 10px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.9)",
                        transform: isLocked ? "scale(1.03)" : "scale(1)",
                        transition: "all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                        boxSizing: "border-box",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: '"Bodoni Moda", "Cinzel", Georgia, serif',
                          fontVariantNumeric: "lining-nums tabular-nums",
                          fontFeatureSettings: '"lnum" 1, "tnum" 1',
                          fontSize: "26px",
                          fontWeight: 800,
                          color: "#530017",
                          lineHeight: 1,
                          textShadow: isLocked ? "0 1px 2px rgba(83, 0, 23, 0.25)" : "none",
                        }}
                      >
                        {digit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="stitch-button filled"
              style={{
                width: "100%",
                minHeight: "44px",
                justifyContent: "center",
                fontSize: "11px",
                whiteSpace: "nowrap",
              }}
              onClick={() => handleClaimDraw(draw)}
              disabled={Boolean(animatingDrawId)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                confirmation_number
              </span>
              <span>Garantir Meu Número</span>
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <>
      {/* Cabeçalho Limpo e Direto */}
      <header className="stitch-header">
        <div>
          <h1>Meus Números da Sorte</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            <span className="stitch-status open" role="status" aria-live="polite">
              <i /> {visibleTickets.length} {visibleTickets.length === 1 ? "Número Ativo" : "Números Ativos"}
            </span>
          </div>
        </div>

        <div className="stitch-actions">
          <button
            type="button"
            className="stitch-button filled"
            onClick={() => onNavigate ? onNavigate("live") : (window.location.hash = "live")}
          >
            <span className="material-symbols-outlined">live_tv</span>
            <span>Acompanhar Telão</span>
          </button>
        </div>
      </header>

      {/* Painel Principal */}
      <div className="stitch-panel-card">
        <div className="stitch-controls-header">
          <div className="stitch-header-info">
            <div className="stitch-header-pill">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span>Seus Números</span>
              <span className="stitch-pill-count">{visibleTickets.length}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "clamp(12px, 3.5vw, 24px)" }}>
          {visibleTickets.length > 0 ? (
            <>
              {/* Carteira de Números da Sorte (Talões de Gala Haute Couture) */}
              <div className="stitch-wallet-grid">
                {visibleTickets.map((t) => (
                  <article key={t.drawId} className="stitch-wallet-ticket">
                    <div>
                      <div className="stitch-wallet-ticket-top">
                        <span className="stitch-wallet-ticket-kicker">
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#c79a36" }}>
                            confirmation_number
                          </span>
                          <span>Número da Sorte</span>
                        </span>
                        <span className="stitch-status open" style={{ padding: "2px 8px", fontSize: "10px" }}>
                          <i /> Ativo
                        </span>
                      </div>

                      {/* Selo Central Majestoso do Número */}
                      <div className="stitch-wallet-ticket-badge-box">
                        <div className="stitch-wallet-ticket-num">
                          <span className="hash">#</span>
                          <span>{t.ticketNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="stitch-ticket-perforation" />
                      <div className="stitch-wallet-ticket-draw">{t.drawTitle}</div>
                      <div className="stitch-wallet-ticket-prize">
                        <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#9a741a" }}>
                          workspace_premium
                        </span>
                        <span>Prêmio: <strong>{t.prizeTitle || t.drawTitle}</strong></span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Sorteios Disponíveis para Participar (se houver pendentes) */}
              {availableDraws.length > 0 && (
                <section style={{ marginTop: "32px", borderTop: "1px solid #f1ece4", paddingTop: "24px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "19px", color: "#9a741a" }}>
                      tune
                    </span>
                    <strong style={{ fontSize: "13px", color: "#530017", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Sorteios Disponíveis ({availableDraws.length})
                    </strong>
                  </div>

                  <div className="stitch-wallet-grid">
                    {availableDraws.map((draw) => renderDrawCard(draw))}
                  </div>
                </section>
              )}

              {/* Mensagem de confirmação de todos os sorteios garantidos */}
              {availableDraws.length === 0 && (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "16px 20px",
                    background: "#edf7ef",
                    border: "1px solid #c7e8cf",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: "#1e7239", fontSize: "24px", flexShrink: 0 }}>
                    check_circle
                  </span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#1e7239", fontWeight: 600 }}>
                    Você já garantiu seu número da sorte em todos os sorteios oficiais do evento!
                  </p>
                </div>
              )}
            </>
          ) : availableDraws.length > 0 ? (
            /* Sem números ainda, mas com sorteios disponíveis */
            <div>
              <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto 28px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#fbf7f0",
                    border: "1px solid #ebdcc5",
                    color: "#9a741a",
                    marginBottom: "12px",
                    boxShadow: "0 2px 6px rgba(67, 0, 20, 0.03)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>
                    confirmation_number
                  </span>
                </span>
                <h3 style={{ fontFamily: "var(--font-fashion, serif)", color: "#530017", fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
                  Garanta seus Números da Sorte
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#786568", lineHeight: "1.5" }}>
                  Confirme sua participação nos sorteios oficiais do evento abaixo para gerar seus números exclusivos e concorrer aos prêmios.
                </p>
              </div>

              <div className="stitch-wallet-grid">
                {availableDraws.map((draw) => renderDrawCard(draw))}
              </div>
            </div>
          ) : (
            /* Nenhum sorteio no momento */
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "42px", color: "#9a741a" }}>
                tune
              </span>
              <h3 style={{ margin: "12px 0 6px", fontSize: "16px", color: "#530017", fontFamily: "var(--font-fashion, serif)" }}>
                Nenhum sorteio cadastrado no momento
              </h3>
              <p style={{ color: "#786568", fontSize: "13px", margin: 0 }}>
                Aguarde a liberação de novos sorteios pela equipe da organização.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal sóbrio e limpo com os dados reais do bilhete gerado */}
      {confirmedModalData && (
        <TicketConfirmedModal
          draw={confirmedModalData.draw}
          ticket={confirmedModalData.ticket}
          participant={participant}
          isOpen={Boolean(confirmedModalData)}
          onClose={handleCloseConfirmedModal}
        />
      )}
    </>
  );
}
