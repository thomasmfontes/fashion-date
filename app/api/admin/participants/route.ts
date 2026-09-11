import { adminAllowed, initialize, participantFields, row } from "../../_lib/db";
import { broadcastParticipantUpdate } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const db = await initialize();
    const result = await db
      .prepare(
        `SELECT 
          p.id_participante AS id,
          p.nm_participante AS name,
          p.nm_loja AS store,
          p.nm_cidade AS city,
          p.nr_whatsapp AS phone,
          p.nm_instagram AS instagram,
          p.user_type AS user_type,
          p.st_participante AS status,
          p.dt_cadastro AS created_at,
          (SELECT MAX(d.dt_sorteio) FROM t_draws d WHERE d.id_participante=p.id_participante) AS won_at,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'drawId', dt.id_sorteio,
                  'drawTitle', COALESCE(def.nm_titulo, dt.id_sorteio),
                  'prizeTitle', COALESCE(def.nm_premio, 'Prêmio'),
                  'ticketNumber', dt.nr_bilhete,
                  'enteredAt', dt.dt_inscricao,
                  'drawDate', def.dt_sorteio,
                  'drawStatus', def.st_sorteio,
                  'isWinner', (EXISTS(SELECT 1 FROM t_draw_winners w WHERE w.id_sorteio = dt.id_sorteio AND (w.nr_bilhete = dt.nr_bilhete OR (w.id_participante = dt.id_participante AND (w.nr_bilhete IS NULL OR w.nr_bilhete = '')))) OR EXISTS(SELECT 1 FROM t_draws d WHERE d.id_participante = dt.id_participante AND d.nr_sorte = dt.nr_bilhete)),
                  'isExpired', (
                    NOT (EXISTS(SELECT 1 FROM t_draw_winners w WHERE w.id_sorteio = dt.id_sorteio AND (w.nr_bilhete = dt.nr_bilhete OR (w.id_participante = dt.id_participante AND (w.nr_bilhete IS NULL OR w.nr_bilhete = '')))) OR EXISTS(SELECT 1 FROM t_draws d WHERE d.id_participante = dt.id_participante AND d.nr_sorte = dt.nr_bilhete))
                    AND (def.dt_sorteio IS NOT NULL AND NOW() > (def.dt_sorteio + INTERVAL '2 days'))
                  )
                ) ORDER BY dt.dt_inscricao ASC
              )
              FROM t_draw_tickets dt
              LEFT JOIN t_draw_definitions def ON def.id_sorteio = dt.id_sorteio
              WHERE dt.id_participante = p.id_participante
            ),
            '[]'::json
          ) AS tickets
         FROM t_participants p ORDER BY p.id_participante DESC`,
      )
      .all<Record<string, unknown>>();

    const state = await db
      .prepare(
        "SELECT vl_configuracao AS value FROM t_settings WHERE cd_configuracao='registrations_open'",
      )
      .first<{ value: string }>();

    return Response.json({
      participants: result.results.map(row),
      registrationsOpen: state?.value !== "false",
    });
  } catch (error: unknown) {
    console.error("Erro ao buscar participantes:", error);
    const message = error instanceof Error ? error.message : "Erro ao conectar com o banco de dados.";
    return Response.json({ error: message, participants: [], registrationsOpen: true }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!adminAllowed(request)) return Response.json({ error: "Não autorizado" }, { status: 401 });

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
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const store = typeof payload.store === "string" ? payload.store.trim() : "";
  const city = typeof payload.city === "string" ? payload.city.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.replace(/\D/g, "") : "";
  const instagram = typeof payload.instagram === "string" ? payload.instagram.trim().replace(/^@?/, "@") : "";

  if (!Number.isInteger(id) || id <= 0 || !name || !store || phone.length < 10 || instagram.length < 2) {
    return Response.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
  }

  try {
    const db = await initialize();
    const updated = await db.prepare(
      `UPDATE t_participants
       SET nm_participante=?, nm_loja=?, nm_cidade=?, nr_whatsapp=?, nm_instagram=?
       WHERE id_participante=? RETURNING ${participantFields}`,
    )
      .bind(name, store, city || null, phone, instagram, id).first<Record<string, unknown>>();
    if (!updated) return Response.json({ error: "Participante não encontrado." }, { status: 404 });
    const draw = await db
      .prepare(
        "SELECT MAX(dt_sorteio) AS won_at FROM t_draws WHERE id_participante=?",
      )
      .bind(id)
      .first<{ won_at: string | null }>();

    // Notifica em tempo real o painel administrativo (<50ms)
    broadcastParticipantUpdate("updated").catch(() => {});

    return Response.json({ participant: row({ ...updated, won_at: draw?.won_at || null }) });
  } catch {
    return Response.json({ error: "Este WhatsApp já está vinculado a outro cadastro." }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  if (!adminAllowed(request)) return Response.json({ error: "Não autorizado" }, { status: 401 });

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
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Cadastro inválido." }, { status: 400 });

  const db = await initialize();
  const existing = await db
    .prepare(
      "SELECT id_participante AS id FROM t_participants WHERE id_participante=?",
    )
    .bind(id)
    .first();
  if (!existing) return Response.json({ error: "Participante não encontrado." }, { status: 404 });
  await db.batch([
    db.prepare("DELETE FROM t_draws WHERE id_participante=?").bind(id),
    db.prepare("DELETE FROM t_participants WHERE id_participante=?").bind(id),
  ]);

  // Notifica em tempo real o painel administrativo (<50ms)
  broadcastParticipantUpdate("deleted").catch(() => {});

  return Response.json({ ok: true });
}
