"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface MobileDrawSliderProps {
  onTrigger: () => void;
  disabled?: boolean;
  isSpinning?: boolean;
  disabledReason?: string;
}

export function MobileDrawSlider({
  onTrigger,
  disabled = false,
  isSpinning = false,
  disabledReason,
}: MobileDrawSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  // Reset when draw ends or resets
  useEffect(() => {
    if (!isSpinning) {
      setDragProgress(0);
      setIsTriggered(false);
      setIsDragging(false);
    }
  }, [isSpinning]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isSpinning || isTriggered) return;

    if (!trackRef.current || !thumbRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbRect = thumbRef.current.getBoundingClientRect();

    maxDragRef.current = Math.max(10, trackRect.width - thumbRect.width - 8); // 4px padding on each side
    startXRef.current = e.clientX;

    setIsDragging(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled || isSpinning || isTriggered) return;

    const deltaX = e.clientX - startXRef.current;
    const maxDrag = maxDragRef.current || 200;
    const clamped = Math.max(0, Math.min(deltaX, maxDrag));
    const progress = clamped / maxDrag;

    setDragProgress(progress);
  };

  const completeTrigger = useCallback(() => {
    setIsTriggered(true);
    setDragProgress(1);
    setIsDragging(false);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([25, 30, 35]);
      } catch {
        // ignore
      }
    }

    onTrigger();
  }, [onTrigger]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragProgress >= 0.72) {
      completeTrigger();
    } else {
      // Spring back
      setIsDragging(false);
      setDragProgress(0);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
    setDragProgress(0);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isSpinning || isTriggered) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
      e.preventDefault();
      completeTrigger();
    }
  };

  const currentTranslateX = isDragging || dragProgress === 1
    ? (maxDragRef.current ? dragProgress * maxDragRef.current : 0)
    : 0;

  return (
    <div
      ref={trackRef}
      className={`mobile-draw-slider-track ${isDragging ? "is-dragging" : ""} ${
        isSpinning ? "is-spinning" : ""
      } ${disabled ? "is-disabled" : ""} ${isTriggered ? "is-triggered" : ""}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled || isSpinning ? -1 : 0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(dragProgress * 100)}
      aria-label="Deslize para sortear"
    >
      {/* Barra de Progresso Dourada Luminosa */}
      <div
        className="slider-fill-progress"
        style={{
          width: isSpinning
            ? "100%"
            : `calc(${dragProgress * 100}% + 48px)`,
        }}
      />

      {/* Rótulo Central com Animação de Brilho */}
      <div
        className="slider-track-text-wrap"
        style={{
          opacity: isSpinning ? 1 : Math.max(0.1, 1 - dragProgress * 1.5),
        }}
      >
        <strong className="slider-track-title">
          {isSpinning
            ? "Girando Tambores..."
            : disabled
              ? disabledReason || "Sem Participantes"
              : "Deslize para Sortear"}
        </strong>
        <span className="slider-track-hint">
          {isSpinning
            ? "Aguarde a apuração..."
            : disabled
              ? "Todos já foram sorteados"
              : "Arraste até o final"}
        </span>
      </div>

      {/* Ícone Indicador de Chegada */}
      <div className="slider-end-target" aria-hidden="true">
        <span className="material-symbols-outlined">
          {isSpinning ? "autorenew" : disabled ? "block" : "stars"}
        </span>
      </div>

      {/* Manopla Rubi Deslizante */}
      <div
        ref={thumbRef}
        className="slider-ruby-thumb"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: isDragging
            ? `translate3d(${currentTranslateX}px, 0, 0)`
            : dragProgress === 1
              ? `translate3d(${maxDragRef.current || 200}px, 0, 0)`
              : "translate3d(0, 0, 0)",
          transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.25)",
        }}
      >
        <div className="thumb-ruby-gem">
          <span className="gem-sheen" />
          <span className="material-symbols-outlined thumb-icon">
            {isSpinning ? "autorenew" : isDragging && dragProgress > 0.5 ? "play_arrow" : "chevron_right"}
          </span>
        </div>
      </div>
    </div>
  );
}
