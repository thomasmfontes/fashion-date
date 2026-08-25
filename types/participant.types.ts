export type { AdminView, DrawMode } from "@/types/admin.types";

export type UserType = "lojista" | "influencer" | "visitante" | "vip";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  lojista: "Lojista",
  influencer: "Influenciador",
  visitante: "Visitante / Comprador",
  vip: "Convidado VIP",
};

export const USER_TYPE_ICONS: Record<UserType, string> = {
  lojista: "storefront",
  influencer: "person_pin",
  visitante: "shopping_bag",
  vip: "workspace_premium",
};

export interface Participant {
  id: number;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  luckyNumber: string;
  userType?: UserType;
  createdAt: string;
  wonAt?: string | null;
  drawId?: number | null;
}

export interface ParticipantFormData {
  name: string;
  store: string;
  phone: string;
  instagram: string;
  userType?: UserType;
  consent?: boolean;
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
