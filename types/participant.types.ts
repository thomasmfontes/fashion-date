export interface Participant {
  id: number;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  luckyNumber: string;
  createdAt: string;
  wonAt?: string | null;
  drawId?: number | null;
}

export interface ParticipantFormData {
  name: string;
  store: string;
  phone: string;
  instagram: string;
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
  sortBy: SortOption;
}

export interface ParticipantStats {
  total: number;
  today: number;
  winners: number;
}

export type AdminView = "participants" | "winners";

