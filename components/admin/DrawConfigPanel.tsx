"use client";

import { useState } from "react";
import "./draw-config.css";
import type { DrawItem, CreateDrawDTO } from "@/types/drawCollection.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { useDrawCollection } from "@/hooks/useDrawCollection";
import { CreateEditDrawModal } from "@/components/admin/CreateEditDrawModal";
import { DrawTransitionLink } from "@/components/admin/DrawTransitionLink";

interface DrawConfigPanelProps {
  adminKey?: string;
  totalParticipants: number;
  activeParticipants: number;
  totalWinners: number;
  registrationsOpen: boolean;
  onToggleRegistrations: () => void;
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export function DrawConfigPanel({
  adminKey,
  totalParticipants,
  activeParticipants,
  totalWinners,
  onShowToast,
}: DrawConfigPanelProps) {
  const {
    draws,
    activeDraw,
    activeDrawId,
    selectActiveDraw,
    createDraw,
    updateDraw,
    deleteDraw,
    duplicateDraw,
  } = useDrawCollection(adminKey);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDraw, setEditingDraw] = useState<DrawItem | null>(null);

  function handleOpenCreate() {
    setEditingDraw(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(draw: DrawItem) {
    setEditingDraw(draw);
    setIsModalOpen(true);
  }

  async function handleSaveDraw(dto: CreateDrawDTO) {
    if (editingDraw) {
      await updateDraw(editingDraw.id, dto);
      onShowToast(`Sorteio "${dto.title}" atualizado!`, "success");
    } else {
      const created = await createDraw(dto);
      onShowToast(`Sorteio "${created.title}" adicionado!`, "success");
    }
  }

  function handleSelectDraw(drawId: string) {
    selectActiveDraw(drawId);
    const selected = draws.find((d) => d.id === drawId);
    onShowToast(`Sorteio ativo no Telão: "${selected?.title || "Sorteio"}"`, "success");
  }

  async function handleDeleteDraw(drawId: string, title: string) {
    if (window.confirm(`Deseja remover o sorteio "${title}"?`)) {
      await deleteDraw(drawId);
      onShowToast("Sorteio removido.", "info");
    }
  }

  async function handleDuplicate(drawId: string) {
    await duplicateDraw(drawId);
    onShowToast("Sorteio duplicado.", "success");
  }

  return (
    <div className="stitch-draw-management">
      {/* Header Padronizado do Painel */}
      <header className="stitch-header">
        <div>
          <h1>Sorteios do Evento</h1>
          <span className="stitch-status open" role="status" aria-live="polite">
            <i />
            {draws.length} {draws.length === 1 ? "Rodada Cadastrada" : "Rodadas Cadastradas"}
          </span>
        </div>
        <div className="stitch-actions">
          <DrawTransitionLink className="stitch-button outline">
            <span className="material-symbols-outlined">live_tv</span>
            Abrir Telão
          </DrawTransitionLink>
          <button
            type="button"
            className="stitch-button filled"
            onClick={handleOpenCreate}
          >
            <span className="material-symbols-outlined">add</span>
            Novo Sorteio
          </button>
        </div>
      </header>

      {/* Painel Unificado de Rodadas */}
      <div className="stitch-panel-card">
        <div className="stitch-controls-header">
          <div className="stitch-header-info">
            <div className="stitch-header-pill">
              <span className="material-symbols-outlined">collections_bookmark</span>
              <span>Acervo de Rodadas</span>
              <span className="stitch-pill-count">{draws.length}</span>
            </div>
          </div>

          <div className="stitch-controls-meta">
            <DrawTransitionLink className="stitch-export-btn" title="Abrir Telão Oficial">
              <span className="material-symbols-outlined export-icon">live_tv</span>
              <span className="export-text">Telão Oficial</span>
            </DrawTransitionLink>
          </div>
        </div>

        {/* Lista Estruturada de Sorteios */}
        <div className="stitch-draws-list">
          {draws.map((draw) => {
            const isActive = draw.id === activeDrawId;
            const targetTypes = draw.targetUserTypes || ["lojista", "influencer", "visitante", "vip"];
            const isAllTypes = targetTypes.length >= 4;

            return (
              <div
                key={draw.id}
                className={`stitch-draw-item ${isActive ? "is-active-draw" : ""}`}
              >
                {/* Lado Esquerdo: Ícone Joia + Título + Badges */}
                <div className="stitch-draw-item-left">
                  <div className="stat-icon-badge draw-badge-box">
                    <span className="material-symbols-outlined">
                      {targetTypes.includes("lojista") && targetTypes.length === 1 ? "storefront" : "workspace_premium"}
                    </span>
                  </div>

                  <div className="stitch-draw-info">
                    <div className="stitch-draw-title-row">
                      <h3 className="stitch-draw-title">{draw.title}</h3>
                    </div>

                    <div className="stitch-draw-meta-row">
                      <span className="stitch-draw-tag prize">
                        <span className="material-symbols-outlined">card_giftcard</span>
                        <span>Prêmio: <strong>{draw.prizeTitle}</strong></span>
                      </span>

                      {draw.hasNumberLimit && draw.maxNumber && (
                        <span className="stitch-draw-tag limit" title={`Sorteia apenas números até ${draw.maxNumber}`}>
                          <span className="material-symbols-outlined">tag</span>
                          <span>Até Nº <strong>{String(draw.maxNumber).padStart(4, "0")}</strong></span>
                        </span>
                      )}

                      <div className="stitch-audience-tags">
                        {isAllTypes ? (
                          <span className="stitch-user-pill all">
                            <span className="material-symbols-outlined">groups</span>
                            <span>Todos os Participantes</span>
                          </span>
                        ) : (
                          targetTypes.map((type) => (
                            <span key={type} className={`stitch-user-pill ${type}`}>
                              <span className="material-symbols-outlined">
                                {USER_TYPE_ICONS[type]}
                              </span>
                              <span>{USER_TYPE_LABELS[type]}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Status / Transmissão + Ações Rápidas */}
                <div className="stitch-draw-item-right">
                  {isActive ? (
                    <span className="stitch-live-status-pill">
                      <span className="pulse-dot" />
                      <span className="material-symbols-outlined">live_tv</span>
                      <span>No Telão</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="stitch-transmit-btn"
                      onClick={() => handleSelectDraw(draw.id)}
                      title="Definir esta rodada como ativa no telão"
                    >
                      <span className="material-symbols-outlined">play_circle</span>
                      <span>Transmitir</span>
                    </button>
                  )}

                  <div className="participant-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(draw)}
                      aria-label={`Editar sorteio ${draw.title}`}
                      title="Editar rodada"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(draw.id)}
                      aria-label={`Duplicar sorteio ${draw.title}`}
                      title="Duplicar rodada"
                    >
                      <span className="material-symbols-outlined">content_copy</span>
                    </button>

                    {draws.length > 1 && (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDeleteDraw(draw.id, draw.title)}
                        aria-label={`Excluir sorteio ${draw.title}`}
                        title="Excluir rodada"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <CreateEditDrawModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDraw}
        initialData={editingDraw}
      />
    </div>
  );
}
