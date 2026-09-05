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
    const authUserId = (url.searchParams.get("authUserId") || "").trim();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");

    const db = await initialize();
    let registrationsOpen = true;
    try {
      const regState = await db
        .prepare(
          "SELECT vl_configuracao AS value FROM t_settings WHERE cd_configuracao='registrations_open'",
        )
        .first<{ value: string }>();
      if (regState && typeof regState.value === "string") {
        registrationsOpen = regState.value !== "false";
      }
    } catch {}

    // Public health / settings check without params
    if (!authUserId && !email && !phone) {
      return Response.json({
        ok: true,
        registrationsOpen,
      });
    }

    // 1. Direct account lookup for authenticated users (Google/Microsoft)
    if (authUserId || email) {
      try {
        const existing = await db
          .prepare(
            `SELECT ${participantFields} FROM t_participants
             WHERE (auth_user_id IS NOT NULL AND auth_user_id=?)
                OR (ds_email IS NOT NULL AND ds_email=?)
             ORDER BY id_participante DESC LIMIT 1`,
          )
          .bind(authUserId || null, email || null)
          .first<Record<string, unknown>>();

        if (existing) {
          return Response.json({
            ok: true,
            registered: true,
            participant: row(existing),
            registrationsOpen,
          });
        }
      } catch {
        // Graceful fallback if ds_email/auth_user_id columns do not exist
      }

      return Response.json({
        ok: true,
        registered: false,
        participant: null,
        registrationsOpen,
      });
    }

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

    const full = row(existing);
    return Response.json({
      ok: true,
      participant: {
        id: full.id,
        name: full.name,
        store: full.store,
        luckyNumber: full.luckyNumber,
        userType: full.userType,
        tickets: full.tickets,
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
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const authUserId = typeof payload.authUserId === "string" ? payload.authUserId.trim() : "";

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

    // 1. Check if the WhatsApp number is already in use
    const existing = await db
      .prepare(
        `SELECT ${participantFields} FROM t_participants WHERE nr_whatsapp=?`,
      )
      .bind(phone)
      .first<Record<string, unknown>>();

    if (existing) {
      // Check if this WhatsApp is linked to a different authenticated account
      try {
        const fullExisting = await db
          .prepare(
            `SELECT id_participante, ds_email, auth_user_id FROM t_participants WHERE nr_whatsapp=?`,
          )
          .bind(phone)
          .first<{ id_participante: number; ds_email?: string | null; auth_user_id?: string | null }>();

        if (fullExisting) {
          const existingAuth = fullExisting.auth_user_id ? String(fullExisting.auth_user_id).trim() : "";
          const existingEmail = fullExisting.ds_email ? String(fullExisting.ds_email).trim().toLowerCase() : "";

          const isDifferentAccount =
            (authUserId && existingAuth && existingAuth !== authUserId) ||
            (email && existingEmail && existingEmail !== email);

          if (isDifferentAccount) {
            return Response.json(
              {
                error:
                  "Este número de WhatsApp já foi cadastrado por outra conta. Cada número só pode ser vinculado a um único participante.",
              },
              { status: 409 },
            );
          }
        }
      } catch {
        // Continue gracefully if ds_email/auth_user_id columns don't exist yet
      }

      // Same user or previous registration: return existing record
      return Response.json({
        participant: row(existing),
        duplicate: true,
      });
    }

    // 2. Prevent the same authenticated account from registering multiple different phone numbers
    if (authUserId || email) {
      try {
        const existingByAuth = await db
          .prepare(
            `SELECT ${participantFields} FROM t_participants WHERE (auth_user_id IS NOT NULL AND auth_user_id=?) OR (ds_email IS NOT NULL AND ds_email=?)`,
          )
          .bind(authUserId || null, email || null)
          .first<Record<string, unknown>>();

        if (existingByAuth) {
          return Response.json({
            participant: row(existingByAuth),
            duplicate: true,
          });
        }
      } catch {
        // Continue gracefully if columns don't exist yet
      }
    }

    // 3. Generate a unique lucky number with collision retry loop
    let lucky = "";
    for (let i = 0; i < 20; i++) {
      const candidate = String(
        (crypto.getRandomValues(new Uint32Array(1))[0] % 9999) + 1,
      ).padStart(4, "0");
      const used = await db
        .prepare(
          "SELECT id_participante AS id FROM t_participants WHERE nr_sorte=?",
        )
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

    // 4. Insert new participant with auth references
    let inserted: Record<string, unknown> | null = null;
    try {
      inserted = await db
        .prepare(
          `INSERT INTO t_participants(nr_sorte,nm_participante,nm_loja,nr_whatsapp,nm_instagram,user_type,ds_email,auth_user_id)
           VALUES(?,?,?,?,?,?,?,?) RETURNING ${participantFields}`,
        )
        .bind(lucky, name, store, phone, instagram, userType, email || null, authUserId || null)
        .first<Record<string, unknown>>();
    } catch {
      inserted = await db
        .prepare(
          `INSERT INTO t_participants(nr_sorte,nm_participante,nm_loja,nr_whatsapp,nm_instagram,user_type)
           VALUES(?,?,?,?,?,?) RETURNING ${participantFields}`,
        )
        .bind(lucky, name, store, phone, instagram, userType)
        .first<Record<string, unknown>>();
    }

    if (!inserted) {
      return Response.json(
        { error: "Não foi possível concluir o cadastro. Tente novamente." },
        { status: 500 },
      );
    }

    // 5. Auto-gerar bilhetes para todos os sorteios elegíveis do evento
    try {
      const newPid = Number(inserted.id_participante);
      const openDraws = await db
        .prepare(
          "SELECT id_sorteio, target_user_types, tem_limite, nr_limite_maximo FROM t_draw_definitions WHERE st_sorteio IN ('open', 'ready')"
        )
        .all<Record<string, unknown>>();

      for (const draw of openDraws.results) {
        const drawId = String(draw.id_sorteio);
        let targetTypes: string[] = [];
        if (Array.isArray(draw.target_user_types)) {
          targetTypes = draw.target_user_types.map((t) => String(t).toLowerCase());
        } else if (typeof draw.target_user_types === "string") {
          try {
            const parsed = JSON.parse(draw.target_user_types);
            if (Array.isArray(parsed)) targetTypes = parsed.map((t) => String(t).toLowerCase());
          } catch {
            /* ignore */
          }
        }

        if (targetTypes.length === 0 || targetTypes.includes(userType)) {
          const hasLimit = Boolean(draw.tem_limite && draw.nr_limite_maximo && Number(draw.nr_limite_maximo) > 0);
          const maxNumber = hasLimit ? Number(draw.nr_limite_maximo) : 9999;
          let generated = "";

          for (let attempt = 0; attempt < 30; attempt++) {
            const randomNum = hasLimit
              ? Math.floor(Math.random() * maxNumber) + 1
              : Math.floor(Math.random() * 9000) + 1000;
            const candidate = String(randomNum).padStart(4, "0");
            const check = await db
              .prepare("SELECT id_ticket FROM t_draw_tickets WHERE id_sorteio = ? AND nr_bilhete = ?")
              .bind(drawId, candidate)
              .first();
            if (!check) {
              generated = candidate;
              break;
            }
          }

          if (generated) {
            await db
              .prepare("INSERT INTO t_draw_tickets (id_participante, id_sorteio, nr_bilhete) VALUES (?, ?, ?)")
              .bind(newPid, drawId, generated)
              .run()
              .catch(() => {});
          }
        }
      }
    } catch {
      // Continue gracefully
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

export async function DELETE(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Formato de requisição inválido. JSON esperado." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "Payload inválido." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const id = Number(payload.id);
    const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
    const authUserId = typeof payload.authUserId === "string" ? payload.authUserId.trim() : "";

    if ((!Number.isInteger(id) || id <= 0) && (!phone || phone.length < 10) && !authUserId) {
      return Response.json({ error: "Identificação do participante não informada." }, { status: 400 });
    }

    const db = await initialize();

    let targetId = id > 0 ? id : null;
    if (!targetId && authUserId) {
      const p = await db
        .prepare("SELECT id_participante AS id FROM t_participants WHERE auth_user_id = ?")
        .bind(authUserId)
        .first<{ id: number }>();
      if (p) targetId = Number(p.id);
    }
    if (!targetId && phone) {
      const p = await db
        .prepare("SELECT id_participante AS id FROM t_participants WHERE nr_whatsapp = ?")
        .bind(phone)
        .first<{ id: number }>();
      if (p) targetId = Number(p.id);
    }

    if (!targetId) {
      return Response.json({ error: "Participante não encontrado." }, { status: 404 });
    }

    // Atomic cascade deletion: tickets, draws, winners and participant account
    await db.batch([
      db.prepare("DELETE FROM t_draw_tickets WHERE id_participante = ?").bind(targetId),
      db.prepare("DELETE FROM t_draw_winners WHERE id_participante = ?").bind(targetId),
      db.prepare("DELETE FROM t_draws WHERE id_participante = ?").bind(targetId),
      db.prepare("DELETE FROM t_participants WHERE id_participante = ?").bind(targetId),
    ]);

    return Response.json({ ok: true, message: "Conta e dados excluídos com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir conta do participante:", error);
    return Response.json({ error: "Erro ao excluir conta. Tente novamente mais tarde." }, { status: 500 });
  }
}
