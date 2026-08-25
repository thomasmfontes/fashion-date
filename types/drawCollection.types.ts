import type { UserType } from "@/types/participant.types";

export type DrawStatus = "ready" | "in_progress" | "completed";

export interface DrawItem {
  id: string;
  title: string;
  prizeTitle: string;
  targetUserTypes: UserType[]; // Perfis que participam deste sorteio
  status: DrawStatus;
  winnerSummary?: {
    winnerName?: string;
    storeName?: string;
    userType?: UserType;
    number?: string;
    drawnAt: string;
  };
  order: number;
  createdAt: string;
}

export interface CreateDrawDTO {
  title: string;
  prizeTitle: string;
  targetUserTypes: UserType[];
}

export interface UpdateDrawDTO extends Partial<CreateDrawDTO> {
  status?: DrawStatus;
  winnerSummary?: DrawItem["winnerSummary"];
}
