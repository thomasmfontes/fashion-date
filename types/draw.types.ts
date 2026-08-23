export interface DrawRecord {
  id: number;
  drawnAt: string;
  winnerId: number;
  luckyNumber: string;
  winnerName: string;
  winnerStore: string;
}

export interface DrawSettings {
  registrationsOpen: boolean;
  liveDrawActive?: boolean;
  liveWinnerNumber?: string | null;
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
