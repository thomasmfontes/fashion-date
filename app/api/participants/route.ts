import { consumeRateLimit } from "@/db/runtime";
import { initialize, participantFields, row } from "../_lib/db";

/**
 * Irreversible stable hash for rate-limiter target keys to avoid plain PII in edge counters.
 */
async function hashTarget(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/**
 * Distributed rate limiting stored in Supabase. Only irreversible hashes are
 * persisted, so neither the IP address nor the queried phone is stored here.
 */
export async function checkLookupRateLimit(
  request: Request,
  phone: string,
): Promise<{ allowed: boolean; retryAfter: number }> {
  try {
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";

    const hashedIp = await hashTarget(ip);
    const ipResult = await consumeRateLimit(`lookup:ip:${hashedIp}`, 50, 60);
    if (!ipResult.allowed) {
      return ipResult;
    }

    if (phone) {
      const hashedTarget = await hashTarget(`${ip}:${phone}`);
      const targetResult = await consumeRateLimit(
        `lookup:target:${hashedTarget}`,
        10,
        60,
      );
      if (!targetResult.allowed) {
        return targetResult;
      }
    }
  } catch (err) {
    console.warn("Rate limit check failed open due to DB connection:", err);
  }

  return { allowed: true, retryAfter: 0 };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");

    const rateCheck = await checkLookupRateLimit(request, phone);
    if (!rateCheck.allowed) {
      return Response.json(
        {
          error:
            "Muitas tentativas de consulta. Aguarde 1 minuto para tentar novamente.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        },
      );
    }

    if (!phone || phone.length < 10) {
      return Response.json(
        { error: "Informe um número de WhatsApp válido com DDD." },
        { status: 400 },
      );
    }

    const db = await initialize();
    const existing = await db
      .prepare(
        `SELECT ${participantFields} FROM t_participants WHERE nr_whatsapp=?`,
      )
      .bind(phone)
      .first<Record<string, unknown>>();

    if (!existing) {
      return Response.json(
        { error: "Nenhuma inscrição encontrada com este WhatsApp." },
        { status: 404 },
      );
    }

    return Response.json({
      ok: true,
      participant: row(existing),
    });
  } catch {
    return Response.json(
      { error: "Erro ao consultar inscrição. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Formato de requisição inválido. JSON esperado." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Payload de inscrição inválido." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const rawStore = typeof payload.store === "string" ? payload.store.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
  const instagram = typeof payload.instagram === "string"
    ? payload.instagram.trim().replace(/^@?/, "@")
    : "";
  const rawType = String(payload.userType || "lojista").toLowerCase();
  const userType = ["lojista", "revendedor", "influencer", "visitante"].includes(rawType)
    ? rawType
    : "lojista";
  const consent = payload.consent === true;

  const isStoreRequired = userType === "lojista" || userType === "revendedor";

  if (!name || name.length < 3) {
    return Response.json(
      { error: "Informe seu nome completo (mínimo 3 caracteres)." },
      { status: 400 },
    );
  }

  if (isStoreRequired && (!rawStore || rawStore.length < 2)) {
    return Response.json(
      { error: "Informe o nome da sua loja ou marca." },
      { status: 400 },
    );
  }

  if (phone.length < 10) {
    return Response.json(
      { error: "Informe um número de WhatsApp válido com DDD." },
      { status: 400 },
    );
  }

  if (instagram.length < 2) {
    return Response.json(
      { error: "Informe um perfil do Instagram válido." },
      { status: 400 },
    );
  }

  if (!consent) {
    return Response.json(
      { error: "É necessário aceitar os termos do sorteio." },
      { status: 400 },
    );
  }

  const store = rawStore || "—";

  try {

    const db = await initialize();
    const state = await db
      .prepare(
        "SELECT vl_configuracao AS value FROM t_settings WHERE cd_configuracao='registrations_open'",
      )
      .first<{ value: string }>();

    if (state?.value === "false") {
      return Response.json(
        { error: "As inscrições estão temporariamente encerradas." },
        { status: 403 },
      );
    }

    const existing = await db
      .prepare(
        `SELECT ${participantFields} FROM t_participants WHERE nr_whatsapp=?`,
      )
      .bind(phone)
      .first<Record<string, unknown>>();

    if (existing) {
      return Response.json({
        participant: row(existing),
        duplicate: true,
      });
    }

    const inserted = await db
      .prepare(
        `INSERT INTO t_participants(nr_sorte,nm_participante,nm_loja,nr_whatsapp,nm_instagram,user_type)
         VALUES(NULL,?,?,?,?,?) RETURNING ${participantFields}`,
      )
      .bind(name, store, phone, instagram, userType)
      .first<Record<string, unknown>>();

    if (!inserted) {
      return Response.json(
        { error: "Não foi possível concluir o cadastro. Tente novamente." },
        { status: 500 },
      );
    }

    return Response.json(
      {
        participant: row(inserted),
        duplicate: false,
      },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 500 },
    );
  }
}
