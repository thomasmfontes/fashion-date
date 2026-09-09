import { getAdminPassword, getDatabase } from "@/db/runtime";
import type { UserType } from "@/types/participant.types";

export type Participant = {
  id: number;
  luckyNumber: string;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  userType?: UserType;
  status: string;
  createdAt: string;
  wonAt: string | null;
  tickets?: import("@/types/participant.types").ParticipantTicket[];
  email?: string;
  authUserId?: string;
  avatarUrl?: string | null;
};

export const participantFields = `
  id_participante AS id,
  nm_participante AS name,
  nm_loja AS store,
  nr_whatsapp AS phone,
  nm_instagram AS instagram,
  user_type AS user_type,
  st_participante AS status,
  dt_cadastro AS created_at,
  ds_email AS email,
  auth_user_id AS auth_user_id
`;

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

export async function getParticipantTickets(
  db: { prepare: (sql: string) => { bind: (...args: unknown[]) => { all: <T>() => Promise<{ results: T[] }> } } },
  participantId: number,
): Promise<import("@/types/participant.types").ParticipantTicket[]> {
  try {
    const res = await db
      .prepare(`
        SELECT 
          dt.id_sorteio AS "drawId",
          COALESCE(def.nm_titulo, dt.id_sorteio) AS "drawTitle",
          COALESCE(def.nm_premio, 'Prêmio') AS "prizeTitle",
          dt.nr_bilhete AS "ticketNumber",
          dt.dt_inscricao AS "enteredAt"
        FROM t_draw_tickets dt
        LEFT JOIN t_draw_definitions def ON def.id_sorteio = dt.id_sorteio
        WHERE dt.id_participante = ?
        ORDER BY dt.dt_inscricao ASC
      `)
      .bind(participantId)
      .all<Record<string, unknown>>();
    return (res?.results || []) as unknown as import("@/types/participant.types").ParticipantTicket[];
  } catch {
    return [];
  }
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
  const rawType = String(raw.user_type || raw.tp_usuario || "lojista").toLowerCase() as UserType;
  const userType: UserType = ["lojista", "revendedor", "influencer", "visitante"].includes(rawType)
    ? rawType
    : "lojista";

  let tickets: import("@/types/participant.types").ParticipantTicket[] = [];
  if (Array.isArray(raw.tickets)) {
    tickets = raw.tickets as import("@/types/participant.types").ParticipantTicket[];
  } else if (typeof raw.tickets === "string") {
    try {
      const parsed = JSON.parse(raw.tickets);
      if (Array.isArray(parsed)) tickets = parsed;
    } catch {}
  }

  let luckyNumber = raw.lucky_number && String(raw.lucky_number) !== "null"
    ? String(raw.lucky_number)
    : "";

  if (!luckyNumber && tickets.length > 0) {
    luckyNumber = tickets.map((t) => t.ticketNumber).join(", ");
  }

  return {
    id: Number(raw.id),
    luckyNumber,
    tickets,
    name: String(raw.name),
    store: String(raw.store),
    phone: String(raw.phone),
    instagram: String(raw.instagram),
    userType,
    status: String(raw.status),
    createdAt:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    wonAt: wonAt
      ? wonAt instanceof Date
        ? wonAt.toISOString()
        : String(wonAt)
      : null,
    email: raw.email ? String(raw.email).trim().toLowerCase() : undefined,
    authUserId: raw.auth_user_id ? String(raw.auth_user_id).trim() : undefined,
  };
}
