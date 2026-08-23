import type { SlotDigitState } from "@/types/draw.types";

export interface NumericDrawConfig {
  min: number;
  max: number;
  prizeTitle: string;
  eventName: string;
  allowRepeat: boolean;
  digitCount: number; // e.g. 3 para 000-500
}

export interface NumericDrawWinner {
  id: string;
  number: string;
  prizeTitle: string;
  eventName: string;
  drawnAt: string;
}

export interface NumericSlotMachineState {
  digits: string[];
  slotStates: SlotDigitState[];
  lockedCount: number;
  isRunning: boolean;
  winner: NumericDrawWinner | null;
  history: NumericDrawWinner[];
  config: NumericDrawConfig;
  error: string | null;
  isMuted: boolean;
}
