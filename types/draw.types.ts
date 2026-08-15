export interface DrawRecord {
  id: number;
  drawnAt: string;
  winnerId: number;
  luckyNumber: number;
  winnerName: string;
  winnerStore: string;
}

export interface DrawSettings {
  registrationsOpen: boolean;
  liveDrawActive?: boolean;
  liveWinnerNumber?: number | null;
  liveWinnerName?: string | null;
  liveWinnerStore?: string | null;
}

export type DrawAnimationPhase =
  | "idle"
  | "spinning"
  | "locking"
  | "celebrating"
  | "revealed";

export interface SlotDigitState {
  digit: string;
  isSpinning: boolean;
  isLocked: boolean;
}
