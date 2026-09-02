"use client";

import React, { useState, useCallback } from "react";

interface SlotMachineLeverProps {
  onPull: () => void;
  disabled?: boolean;
  isSpinning?: boolean;
}

export function SlotMachineLever({
  onPull,
  disabled = false,
  isSpinning = false,
}: SlotMachineLeverProps) {
  const [isPulled, setIsPulled] = useState(false);

  const handleTriggerPull = useCallback(() => {
    if (disabled || isSpinning || isPulled) return;

    setIsPulled(true);

    // Dispara o sorteio no ápice da descida mecânica
    setTimeout(() => {
      onPull();
    }, 280);

    // Retorna com recuo elástico suave (spring recoil)
    setTimeout(() => {
      setIsPulled(false);
    }, 850);
  }, [disabled, isSpinning, isPulled, onPull]);

  return (
    <div
      className={`card-rosette-lever ${isPulled ? "is-pulling" : ""} ${
        isSpinning ? "is-spinning" : ""
      } ${disabled ? "is-disabled" : ""}`}
      onClick={handleTriggerPull}
      role="button"
      tabIndex={disabled || isSpinning ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTriggerPull();
        }
      }}
      aria-label="Puxar alavanca de sorteio"
      title={isSpinning ? "Sorteio em andamento..." : "Puxar alavanca para sortear"}
    >
      {/* Roseta / Base Circular de Joalheria Embutida no Card */}
      <div className="lever-rosette-base">
        <div className="rosette-outer-ring" />
        <div className="rosette-inner-hub">
          <div className="hub-center-core" />
        </div>
      </div>

      {/* Braço Mecânico Móvel que gira a partir do centro da roseta */}
      <div className="lever-rosette-arm">
        <div className="lever-metallic-shaft">
          <div className="shaft-specular-glint" />
        </div>
        <div className="lever-ruby-sphere">
          <div className="sphere-specular" />
          <div className="sphere-gold-ring" />
        </div>
      </div>
    </div>
  );
}
