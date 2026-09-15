"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "./draw-config.css";
import type { DrawItem, CreateDrawDTO } from "@/types/drawCollection.types";
import type { UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { parseBlockedRanges, countUniqueBlockedNumbers } from "@/utils/blockedNumbers";

interface CreateEditDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDrawDTO) => void;
  initialData?: DrawItem | null;
}

const ALL_USER_TYPES: UserType[] = ["lojista", "revendedor", "influencer", "visitante"];

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
    initialData?.targetUserTypes || []
  );
  const [hasNumberLimit, setHasNumberLimit] = useState<boolean | null>(
    initialData ? Boolean(initialData.hasNumberLimit) : null
  );
  const [maxNumber, setMaxNumber] = useState<string>(
    initialData?.maxNumber ? String(initialData.maxNumber) : ""
  );
  const [drawDate, setDrawDate] = useState<string>(
    initialData?.drawDate ? initialData.drawDate.slice(0, 10) : ""
  );
  const [allowTicketGeneration, setAllowTicketGeneration] = useState<boolean>(
    initialData ? initialData.allowTicketGeneration !== false : true
  );
  const [blockedNumberRanges, setBlockedNumberRanges] = useState<string>(
    initialData?.blockedNumberRanges || ""
  );

  // Animation states for smooth sliding enter & exit
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setShouldRender(true);
      // Small timeout ensures the initial translateX(100%) is painted before sliding in
      const timer = setTimeout(() => {
        setIsAnimatedIn(true);
      }, 30);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatedIn(false);
      closeTimerRef.current = setTimeout(() => {
        setShouldRender(false);
      }, 380);
      return () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      };
    }
  }, [isOpen]);

  // Sync data when opening or when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setPrizeTitle(initialData.prizeTitle);
        setSelectedTypes(
          initialData.targetUserTypes && initialData.targetUserTypes.length > 0
            ? initialData.targetUserTypes
            : []
        );
        setHasNumberLimit(
          initialData.hasNumberLimit !== undefined
            ? Boolean(initialData.hasNumberLimit)
            : null
        );
        setMaxNumber(initialData.maxNumber ? String(initialData.maxNumber) : "");
        setDrawDate(initialData.drawDate ? initialData.drawDate.slice(0, 10) : "");
        setAllowTicketGeneration(initialData.allowTicketGeneration !== false);
        setBlockedNumberRanges(initialData.blockedNumberRanges || "");
      } else {
        // Quando for novo sorteio, nenhum campo vem pré-selecionado
        setTitle("");
        setPrizeTitle("");
        setSelectedTypes([]);
        setHasNumberLimit(null);
        setMaxNumber("");
        setDrawDate("");
        setAllowTicketGeneration(true);
        setBlockedNumberRanges("");
      }
    }
  }, [initialData, isOpen]);

  // Lock body scrolling when drawer is open
  useEffect(() => {
    if (shouldRender) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [shouldRender]);

  const handleSmoothClose = useCallback(() => {
    setIsAnimatedIn(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 280);
  }, [onClose]);

  // Escape key handler
  useEffect(() => {
    if (!shouldRender) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSmoothClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, handleSmoothClose]);

  const parsedBlockedList = useMemo(
    () => parseBlockedRanges(blockedNumberRanges),
    [blockedNumberRanges]
  );
  const totalBlockedCount = useMemo(
    () =>
      countUniqueBlockedNumbers(
        parsedBlockedList,
        hasNumberLimit && maxNumber ? parseInt(maxNumber, 10) : undefined
      ),
    [parsedBlockedList, hasNumberLimit, maxNumber]
  );

  if (!shouldRender) return null;

  function toggleType(type: UserType) {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  function handleSelectAll() {
    if (selectedTypes.length === ALL_USER_TYPES.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(ALL_USER_TYPES);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Por favor, informe o nome do sorteio.");
      return;
    }

    if (selectedTypes.length === 0) {
      alert("Por favor, selecione pelo menos um público participante.");
      return;
    }

    if (hasNumberLimit === null) {
      alert("Por favor, escolha se a rodada terá limite de números.");
      return;
    }

    if (hasNumberLimit) {
      const parsedMax = parseInt(maxNumber, 10);
      if (isNaN(parsedMax) || parsedMax <= 0) {
        alert("Por favor, informe um número limite válido maior que 0.");
        return;
      }
    }

    onSave({
      title: title.trim(),
      prizeTitle: prizeTitle.trim() || "Prêmio Especial",
      targetUserTypes: selectedTypes,
      hasNumberLimit: Boolean(hasNumberLimit),
      maxNumber: hasNumberLimit && maxNumber ? parseInt(maxNumber, 10) : null,
      drawDate: drawDate || null,
      allowTicketGeneration,
      blockedNumberRanges: blockedNumberRanges.trim() || null,
    });
    handleSmoothClose();
  }

  const isAllSelected = selectedTypes.length === ALL_USER_TYPES.length;
  const publicsLabel =
    selectedTypes.length === 0
      ? "Nenhum Público"
      : isAllSelected
        ? "Todos os Públicos"
        : `${selectedTypes.length} ${selectedTypes.length === 1 ? "Perfil" : "Perfis"}`;

  const badgeLimitText =
    hasNumberLimit === true && maxNumber
      ? ` · Até Nº ${maxNumber}`
      : hasNumberLimit === false
        ? " · Sem Limite"
        : "";

  return (
    <>
      {/* Backdrop com fade suave */}
      <div
        className={`draw-side-drawer-backdrop ${isAnimatedIn ? "is-open" : ""}`}
        onClick={handleSmoothClose}
        aria-hidden="true"
      />

      {/* Painel lateral que desliza suavemente da direita */}
      <aside
        className={`draw-side-drawer-panel ${isAnimatedIn ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Editar Sorteio" : "Novo Sorteio"}
      >
        <header className="draw-drawer-header">
          <div className="draw-drawer-header-left">
            <span className="edit-ticket-badge">
              {publicsLabel}{badgeLimitText}{!allowTicketGeneration ? " · Sem geração no app" : ""}
            </span>
            <h2>{isEditing ? "Editar Sorteio" : "Novo Sorteio"}</h2>
            <p>Configure os parâmetros desta rodada de sorteio</p>
          </div>

          <button
            type="button"
            className="draw-drawer-close-btn"
            onClick={handleSmoothClose}
            aria-label="Fechar painel lateral"
            title="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="draw-drawer-form-wrapper">
          <div className="draw-drawer-body">
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

            {/* Draw Date Input */}
            <div className="modal-field">
              <label htmlFor="modal-draw-date">Data do Sorteio</label>
              <input
                id="modal-draw-date"
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
              />
              <small>
                Os números da sorte não contemplados ficarão inativos e esmaecidos na carteira 1 dia após a data definida.
              </small>
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
                    {isAllSelected ? "Desmarcar Todos" : "Selecionar Todos"}
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
                      <span className="material-symbols-outlined type-card-icon">{icon}</span>
                      <div className="type-card-info">
                        <strong>{label}</strong>
                        <small>{isSelected ? "Participa do sorteio" : "Não participa"}</small>
                      </div>
                      <span className={`check-indicator ${isSelected ? "checked" : ""}`}>
                        {isSelected && <span className="material-symbols-outlined check-icon">check</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number Limit Selection */}
            <div className="number-limit-selection-box">
              <div className="number-limit-header">
                <div>
                  <label>Limite de Números *</label>
                  <small>Defina se haverá um limite máximo para os números participantes</small>
                </div>
              </div>

              <div className="number-limit-options">
                <button
                  type="button"
                  className={`number-limit-card ${hasNumberLimit === false ? "selected" : ""}`}
                  onClick={() => setHasNumberLimit(false)}
                >
                  <span className="material-symbols-outlined number-card-icon">all_inclusive</span>
                  <div className="number-limit-card-info">
                    <strong>Sem Limite</strong>
                    <small>Todos os números cadastrados participam</small>
                  </div>
                  <span className={`check-indicator ${hasNumberLimit === false ? "checked" : ""}`}>
                    {hasNumberLimit === false && <span className="material-symbols-outlined check-icon">check</span>}
                  </span>
                </button>

                <button
                  type="button"
                  className={`number-limit-card ${hasNumberLimit === true ? "selected" : ""}`}
                  onClick={() => setHasNumberLimit(true)}
                >
                  <span className="material-symbols-outlined number-card-icon">tag</span>
                  <div className="number-limit-card-info">
                    <strong>Com Limite de Números</strong>
                    <small>Sorteia apenas até um número máximo</small>
                  </div>
                  <span className={`check-indicator ${hasNumberLimit === true ? "checked" : ""}`}>
                    {hasNumberLimit === true && <span className="material-symbols-outlined check-icon">check</span>}
                  </span>
                </button>
              </div>

              {hasNumberLimit === true && (
                <div className="number-limit-input-wrapper">
                  <label htmlFor="modal-draw-max-number">
                    Número Limite Máximo *
                  </label>
                  <div className="number-input-field-box">
                    <span className="number-input-prefix">Até o Nº</span>
                    <input
                      id="modal-draw-max-number"
                      type="number"
                      min="1"
                      max="9999"
                      value={maxNumber}
                      onChange={(e) => setMaxNumber(e.target.value)}
                      placeholder="Ex: 500"
                      required={hasNumberLimit === true}
                    />
                  </div>
                  <small className="number-limit-helper">
                    {maxNumber && Number(maxNumber) > 0
                      ? `Concorrem apenas os números da sorte de 0001 até ${String(maxNumber).padStart(4, "0")}.`
                      : "Informe até qual número da sorte concorrerá nesta rodada."}
                  </small>
                </div>
              )}

              {/* Campo: Números Bloqueados (Apenas se geração pelo app estiver ativa) */}
              {allowTicketGeneration && (
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #ebdcc5" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label
                      htmlFor="modal-draw-blocked-ranges"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#453235",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        margin: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9a741a" }}>
                        block
                      </span>
                      Números Bloqueados (Opcional)
                    </label>

                    {totalBlockedCount > 0 && (
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#991b1b",
                          letterSpacing: "0.02em",
                        }}
                      >
                        Total: {totalBlockedCount}
                      </span>
                    )}
                  </div>

                  <input
                    id="modal-draw-blocked-ranges"
                    type="text"
                    value={blockedNumberRanges}
                    onChange={(e) => setBlockedNumberRanges(e.target.value)}
                    placeholder="Ex: 0445-0455, 0120"
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #ebdcc5",
                      background: "#ffffff",
                      fontSize: "12.5px",
                      color: "#332225",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <small style={{ display: "block", fontSize: "11px", color: "#786568", marginTop: "4px", lineHeight: 1.35 }}>
                    Números ou intervalos que <strong>não serão gerados</strong> para nenhum participante (separados por vírgula).
                  </small>

                  {/* Preview em tempo real das faixas interpretadas sem parênteses */}
                  {parsedBlockedList.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                      {parsedBlockedList.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "#fef2f2",
                            border: "1px solid #fca5a5",
                            color: "#991b1b",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                            do_not_disturb_on
                          </span>
                          <span>{r.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Toggle Simples: Permitir geração de número pelo app */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                padding: "16px 18px",
                borderRadius: "10px",
                background: "#fdfaf6",
                border: "1px solid #ebdcc5",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "19px", color: allowTicketGeneration ? "#530017" : "#8c7a7d" }}
                  >
                    smartphone
                  </span>
                  <label
                    htmlFor="toggle-allow-ticket-generation"
                    style={{ fontSize: "12px", color: "#453235", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", margin: 0 }}
                  >
                    Gerar número da sorte pelo app
                  </label>
                </div>
                <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#6d5b5d", lineHeight: 1.4 }}>
                  Permite que os participantes gerem seu número da sorte pelo aplicativo.
                </p>
              </div>

              <button
                id="toggle-allow-ticket-generation"
                type="button"
                role="switch"
                aria-checked={allowTicketGeneration}
                onClick={() => setAllowTicketGeneration(!allowTicketGeneration)}
                style={{
                  position: "relative",
                  width: "48px",
                  height: "26px",
                  borderRadius: "999px",
                  background: allowTicketGeneration ? "#530017" : "#d8cec6",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                  transition: "background 0.2s ease",
                  outline: "none",
                }}
                title={allowTicketGeneration ? "Clique para desativar" : "Clique para ativar"}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: allowTicketGeneration ? "25px" : "3px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </button>
            </div>
          </div>

          <footer className="draw-drawer-footer">
            <button type="button" className="btn-modal-cancel" onClick={handleSmoothClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-modal-save">
              <span className="material-symbols-outlined">check</span>
              {isEditing ? "Salvar Sorteio" : "Criar Sorteio"}
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
}
