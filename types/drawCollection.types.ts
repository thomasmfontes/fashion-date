import type { UserType } from "@/types/participant.types";

export type DrawStatus = "ready" | "in_progress" | "completed";

export interface DrawItem {
  id: string;
  title: string;
  prizeTitle: string;
  targetUserTypes: UserType[]; // Perfis que participam deste sorteio
  hasNumberLimit?: boolean;
  maxNumber?: number | null; // Limite superior dos números da sorte
  drawDate?: string | null; // Data prevista do sorteio / evento
  allowTicketGeneration?: boolean; // Se false, modalidade pulseira física (não permite gerar número no app)
  blockedNumberRanges?: string | null; // Faixas/números excluídos (ex: "0445-0455, 0120")
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
  hasNumberLimit?: boolean;
  maxNumber?: number | null;
  drawDate?: string | null;
  allowTicketGeneration?: boolean;
  blockedNumberRanges?: string | null;
}

export interface UpdateDrawDTO extends Partial<CreateDrawDTO> {
  status?: DrawStatus;
  winnerSummary?: DrawItem["winnerSummary"];
}
