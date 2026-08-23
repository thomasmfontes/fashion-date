import { getAdminPassword, getDatabase } from "@/db/runtime";

export type Participant = {
  id: number;
  luckyNumber: string;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  status: string;
  createdAt: string;
  wonAt: string | null;
};

export function database() {
  return getDatabase();
}

/**
 * Fast database accessor for normal request handlers.
 * Assumes the versioned PostgreSQL schema was pre-applied in Supabase.
 * ZERO DDL statements are executed during normal HTTP request processing.
 */
export async function initialize() {
  return database();
}

export function adminAllowed(request: Request): boolean {
  const configured = getAdminPassword();
  if (!configured) return false;
  const provided = request.headers.get("x-admin-key")?.trim();
  return Boolean(provided && provided === configured);
}

export function row(raw: Record<string, unknown>): Participant {
  const createdAt = raw.created_at;
  const wonAt = raw.won_at;
  return {
    id: Number(raw.id),
    luckyNumber: String(raw.lucky_number),
    name: String(raw.name),
    store: String(raw.store),
    phone: String(raw.phone),
    instagram: String(raw.instagram),
    status: String(raw.status),
    createdAt:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    wonAt: wonAt
      ? wonAt instanceof Date
        ? wonAt.toISOString()
        : String(wonAt)
      : null,
  };
}
