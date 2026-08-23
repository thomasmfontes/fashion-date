import { consumeRateLimit } from "@/db/runtime";
import { initialize, row } from "../_lib/db";

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
        "SELECT id, lucky_number, name, store FROM participants WHERE phone=?",
      )
      .bind(phone)
      .first<Record<string, unknown>>();

    if (!existing) {
      return Response.json(
        { error: "Nenhuma inscrição encontrada com este WhatsApp." },
        { status: 404 },
      );
    }

    // Privacy-preserving response: returns only public ticket verification fields
    return Response.json({
      ok: true,
      participant: {
        id: Number(existing.id),
        luckyNumber: String(existing.lucky_number),
        name: String(existing.name),
        store: String(existing.store),
      },
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
  const store = typeof payload.store === "string" ? payload.store.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
  const instagram = typeof payload.instagram === "string"
    ? payload.instagram.trim().replace(/^@?/, "@")
    : "";
  const consent = payload.consent === true;

  if (
    !name ||
    !store ||
    phone.length < 10 ||
    instagram.length < 2 ||
    !consent
  ) {
    return Response.json(
      { error: "Preencha todos os campos e aceite o consentimento." },
      { status: 400 },
    );
  }

  try {

    const db = await initialize();
    const state = await db
      .prepare("SELECT value FROM settings WHERE key='registrations_open'")
      .first<{ value: string }>();

    if (state?.value === "false") {
      return Response.json(
        { error: "As inscrições estão temporariamente encerradas." },
        { status: 403 },
      );
    }

    const existing = await db
      .prepare("SELECT * FROM participants WHERE phone=?")
      .bind(phone)
      .first<Record<string, unknown>>();

    if (existing) {
      return Response.json({
        participant: row(existing),
        duplicate: true,
      });
    }

    let lucky = "";
    for (let i = 0; i < 20; i++) {
      const candidate = String(
        (crypto.getRandomValues(new Uint32Array(1))[0] % 9999) + 1,
      ).padStart(4, "0");
      const used = await db
        .prepare("SELECT id FROM participants WHERE lucky_number=?")
        .bind(candidate)
        .first();
      if (!used) {
        lucky = candidate;
        break;
      }
    }

    if (!lucky) {
      return Response.json(
        {
          error:
            "Alta demanda de cadastros. Não foi possível gerar um número único agora. Tente novamente em alguns instantes.",
        },
        { status: 503 },
      );
    }

    const inserted = await db
      .prepare(
        "INSERT INTO participants(lucky_number,name,store,phone,instagram) VALUES(?,?,?,?,?) RETURNING *",
      )
      .bind(lucky, name, store, phone, instagram)
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
