import type { SlotDigitState } from "@/types/draw.types";

interface LiveSlotMachineProps {
  digits: SlotDigitState[];
}

export function LiveSlotMachine({ digits }: LiveSlotMachineProps) {
  return (
    <div
      className="draw-slots-wrap"
      aria-label="Tambores mecânicos do sorteio de 4 dígitos"
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
