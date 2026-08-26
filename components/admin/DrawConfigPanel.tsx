"use client";

import { useState } from "react";
import "./draw-config.css";
import type { DrawItem, CreateDrawDTO } from "@/types/drawCollection.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { useDrawCollection } from "@/hooks/useDrawCollection";
import { CreateEditDrawModal } from "@/components/admin/CreateEditDrawModal";
import { DrawTransitionLink } from "@/components/admin/DrawTransitionLink";

interface DrawConfigPanelProps {
  totalParticipants: number;
  activeParticipants: number;
  totalWinners: number;
  registrationsOpen: boolean;
  onToggleRegistrations: () => void;
  onShowToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export function DrawConfigPanel({
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
  } = useDrawCollection();

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

  function handleSaveDraw(dto: CreateDrawDTO) {
    if (editingDraw) {
      updateDraw(editingDraw.id, dto);
      onShowToast(`Sorteio "${dto.title}" atualizado!`, "success");
    } else {
      const created = createDraw(dto);
      onShowToast(`Sorteio "${created.title}" adicionado!`, "success");
    }
  }

  function handleSelectDraw(drawId: string) {
    selectActiveDraw(drawId);
    const selected = draws.find((d) => d.id === drawId);
    onShowToast(`Sorteio ativo no Telão: "${selected?.title || "Sorteio"}"`, "success");
  }

  function handleDeleteDraw(drawId: string, title: string) {
    if (window.confirm(`Deseja remover o sorteio "${title}"?`)) {
      deleteDraw(drawId);
      onShowToast("Sorteio removido.", "info");
    }
  }

  function handleDuplicate(drawId: string) {
    duplicateDraw(drawId);
    onShowToast("Sorteio duplicado.", "success");
  }

  return (
    <div className="draw-config-screen">
      {/* Header Unificado e Direto */}
      <header className="clean-config-header">
        <div className="header-text-block">
          <h1>Sorteios do Evento</h1>
          <p>
            Configure as rodadas, defina quais públicos concorrem e escolha qual transmitir no <strong>Telão Oficial</strong>.
          </p>
        </div>

        <div className="header-actions-bar">
          {/* Botão Novo Sorteio */}
          <button type="button" className="btn-clean-create" onClick={handleOpenCreate}>
            <span className="material-symbols-outlined">add</span>
            <span>Novo Sorteio</span>
          </button>

          {/* Botão Abrir Telão */}
          <DrawTransitionLink className="btn-clean-launch">
            <span className="material-symbols-outlined">live_tv</span>
            <span>Abrir Telão</span>
          </DrawTransitionLink>
        </div>
      </header>

      {/* Lista Limpa de Sorteios */}
      <div className="clean-draws-list">
        {draws.map((draw) => {
          const isActive = draw.id === activeDrawId;
          const targetTypes = draw.targetUserTypes || ["lojista", "influencer", "visitante", "vip"];
          const isAllTypes = targetTypes.length >= 4;

          return (
            <div
              key={draw.id}
              className={`clean-draw-row ${isActive ? "is-active-draw" : ""}`}
            >
              {/* Lado Esquerdo: Ícone + Título + Perfis Participantes */}
              <div className="draw-row-left">
                <div className={`draw-type-avatar ${targetTypes.includes("lojista") && targetTypes.length === 1 ? "provador" : "generic"}`}>
                  <span className="material-symbols-outlined">
                    {targetTypes.includes("lojista") && targetTypes.length === 1 ? "storefront" : "workspace_premium"}
                  </span>
                </div>
                <div className="draw-primary-info">
                  <div className="draw-title-line">
                    <h3>{draw.title}</h3>
                  </div>

                  <div className="draw-meta-line">
                    <span className="meta-tag prize">
                      <span className="material-symbols-outlined">card_giftcard</span>
                      Prêmio: <strong>{draw.prizeTitle}</strong>
                    </span>

                    {draw.hasNumberLimit && draw.maxNumber && (
                      <span className="meta-tag limit" title={`Sorteia apenas números até ${draw.maxNumber}`}>
                        <span className="material-symbols-outlined">tag</span>
                        Até Nº <strong>{String(draw.maxNumber).padStart(4, "0")}</strong>
                      </span>
                    )}

                    {/* Tags dos Públicos Participantes */}
                    <div className="target-types-badges-row">
                      <span className="meta-sublabel">Participam:</span>
                      {isAllTypes ? (
                        <span className="meta-user-tag all">
                          <span className="material-symbols-outlined">groups</span>
                          Todos os Participantes
                        </span>
                      ) : (
                        targetTypes.map((type) => (
                          <span key={type} className={`meta-user-tag ${type}`}>
                            <span className="material-symbols-outlined">
                              {USER_TYPE_ICONS[type]}
                            </span>
                            {USER_TYPE_LABELS[type]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Botão de Seleção + Ações Rápidas */}
              <div className="draw-row-right">
                {isActive ? (
                  <span className="active-selected-label">
                    <span className="material-symbols-outlined">check_circle</span>
                    Sorteio Ativo
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-select-for-screen"
                    onClick={() => handleSelectDraw(draw.id)}
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                    Transmitir no Telão
                  </button>
                )}

                <div className="row-action-buttons">
                  <button
                    type="button"
                    className="btn-row-action"
                    onClick={() => handleOpenEdit(draw)}
                    title="Editar sorteio"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>

                  <button
                    type="button"
                    className="btn-row-action"
                    onClick={() => handleDuplicate(draw.id)}
                    title="Duplicar sorteio"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>

                  {draws.length > 1 && (
                    <button
                      type="button"
                      className="btn-row-action delete"
                      onClick={() => handleDeleteDraw(draw.id, draw.title)}
                      title="Remover sorteio"
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
