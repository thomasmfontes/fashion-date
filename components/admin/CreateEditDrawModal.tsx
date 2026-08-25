"use client";

import { useState, useEffect } from "react";
import "./draw-config.css";
import type { DrawItem, CreateDrawDTO } from "@/types/drawCollection.types";
import type { UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { Modal } from "@/components/ui/Modal";

interface CreateEditDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDrawDTO) => void;
  initialData?: DrawItem | null;
}

const ALL_USER_TYPES: UserType[] = ["lojista", "influencer", "visitante", "vip"];

export function CreateEditDrawModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CreateEditDrawModalProps) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [prizeTitle, setPrizeTitle] = useState(initialData?.prizeTitle || "");
  const [selectedTypes, setSelectedTypes] = useState<UserType[]>(
    initialData?.targetUserTypes || ALL_USER_TYPES
  );

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setPrizeTitle(initialData.prizeTitle);
      setSelectedTypes(
        initialData.targetUserTypes && initialData.targetUserTypes.length > 0
          ? initialData.targetUserTypes
          : ALL_USER_TYPES
      );
    } else {
      setTitle("");
      setPrizeTitle("");
      setSelectedTypes(ALL_USER_TYPES);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  function toggleType(type: UserType) {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        alert("O sorteio precisa ter pelo menos um tipo de participante selecionado.");
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  function handleSelectAll() {
    setSelectedTypes(ALL_USER_TYPES);
  }

  function handleSelectOnlyLojistas() {
    setSelectedTypes(["lojista"]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Por favor, informe o nome do sorteio.");
      return;
    }

    onSave({
      title: title.trim(),
      prizeTitle: prizeTitle.trim() || "Prêmio Especial",
      targetUserTypes: selectedTypes.length > 0 ? selectedTypes : ALL_USER_TYPES,
    });
    onClose();
  }

  const isAllSelected = selectedTypes.length === ALL_USER_TYPES.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Sorteio" : "Novo Sorteio"}
      badge={
        <span className="edit-ticket-badge">
          {isAllSelected ? "Todos os Públicos" : `${selectedTypes.length} Perfis Selecionados`}
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="collection-modal-form">
        {/* Title Input */}
        <div className="modal-field">
          <label htmlFor="modal-draw-title">Nome / Título da Rodada *</label>
          <input
            id="modal-draw-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Sorteio Provador Fashion / Sorteio Bolsa de Luxo"
            required
          />
        </div>

        {/* Prize Input */}
        <div className="modal-field">
          <label htmlFor="modal-draw-prize">Prêmio da Rodada</label>
          <input
            id="modal-draw-prize"
            type="text"
            value={prizeTitle}
            onChange={(e) => setPrizeTitle(e.target.value)}
            placeholder="Ex: Look Completo Crente Chic / Vaga no Provador"
          />
        </div>

        {/* Target User Types Selection */}
        <div className="target-types-selection-box">
          <div className="target-types-header">
            <div>
              <label>Quem pode participar deste sorteio? *</label>
              <small>Selecione quais perfis de participantes concorrem nesta rodada</small>
            </div>

            <div className="quick-selection-links">
              <button
                type="button"
                className={`quick-type-link ${isAllSelected ? "active" : ""}`}
                onClick={handleSelectAll}
              >
                Todos
              </button>
              <button
                type="button"
                className={`quick-type-link ${selectedTypes.length === 1 && selectedTypes[0] === "lojista" ? "active" : ""}`}
                onClick={handleSelectOnlyLojistas}
              >
                Só Lojistas
              </button>
            </div>
          </div>

          <div className="target-types-grid">
            {ALL_USER_TYPES.map((type) => {
              const isSelected = selectedTypes.includes(type);
              const label = USER_TYPE_LABELS[type];
              const icon = USER_TYPE_ICONS[type];

              return (
                <button
                  key={type}
                  type="button"
                  className={`type-card-select ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleType(type)}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  <div className="type-card-info">
                    <strong>{label}</strong>
                    <small>{isSelected ? "Participa do sorteio" : "Não participa"}</small>
                  </div>
                  <span className={`check-indicator ${isSelected ? "checked" : ""}`}>
                    {isSelected && <span className="material-symbols-outlined">check</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="modal-footer-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-modal-save">
            <span className="material-symbols-outlined">check</span>
            {isEditing ? "Salvar Sorteio" : "Criar Sorteio"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
