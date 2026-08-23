import type { SlotDigitState } from "@/types/draw.types";

interface NumericLiveSlotMachineProps {
  digits: SlotDigitState[];
}

export function NumericLiveSlotMachine({ digits }: NumericLiveSlotMachineProps) {
  return (
    <div
      className={`draw-slots-wrap numeric-slots-wrap digits-${digits.length}`}
      aria-label={`Tambores do sorteio numérico de ${digits.length} dígitos`}
    >
      {digits.map((slot, idx) => (
        <div
          key={idx}
          className={`draw-slot-digit${slot.isSpinning ? " is-spinning" : ""}${slot.isLocked ? " is-locked" : ""}`}
        >
          <div className="slot-sheen" />
          <span className="slot-num">{slot.digit}</span>
        </div>
      ))}
    </div>
  );
}
