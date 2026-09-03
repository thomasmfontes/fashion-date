export type { AdminView, DrawMode } from "@/types/admin.types";

export type UserType = "lojista" | "revendedor" | "influencer" | "visitante";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  lojista: "Lojista",
  revendedor: "Revendedor",
  influencer: "Influenciador",
  visitante: "Visitante",
};

export const USER_TYPE_ICONS: Record<UserType, string> = {
  lojista: "storefront",
  revendedor: "local_mall",
  influencer: "person_pin",
  visitante: "group",
};

export interface ParticipantTicket {
  drawId: string;
  drawTitle: string;
  prizeTitle: string;
  ticketNumber: string;
  enteredAt: string;
}

export interface DrawWinnerItem {
  id: number;
  winnerId: number;
  drawId: string;
  drawTitle: string;
  prizeTitle: string;
  participantId: number;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  userType?: UserType;
  luckyNumber: string;
  wonAt: string;
}

export interface Participant {
  id: number;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  luckyNumber: string;
  tickets?: ParticipantTicket[];
  userType?: UserType;
  createdAt: string;
  wonAt?: string | null;
  drawId?: number | null;
  email?: string;
  authUserId?: string;
}

export interface ParticipantFormData {
  name: string;
  store: string;
  phone: string;
  instagram: string;
  consent: boolean;
  userType?: UserType;
  email?: string;
  authUserId?: string;
}

export type StatusFilter = "all" | "active" | "winner";

export type SortOption =
  | "recent"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "number-asc"
  | "number-desc";

export interface ParticipantFilters {
  query: string;
  status: StatusFilter;
  userType?: UserType | "all";
  sortBy: SortOption;
}

export interface ParticipantStats {
  total: number;
  today: number;
  winners: number;
  byType?: Record<UserType, number>;
}
