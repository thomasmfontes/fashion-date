import {
  adminAllowed,
  initialize,
  participantFields,
  row,
} from "../../_lib/db";
import { broadcastWinnerAnnouncement } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let targetTypes: string[] = [];
  try {
    const body = (await request.json()) as { targetUserTypes?: string[] };
    if (body && Array.isArray(body.targetUserTypes) && body.targetUserTypes.length > 0) {
      targetTypes = body.targetUserTypes.map((t) => String(t).toLowerCase());
    }
  } catch {
    // Body is optional (defaults to all active participants)
  }

  const db = await initialize();
  const drawId = crypto.randomUUID();
  const selected = await db.transaction(async (transaction) => {
    const updateQuery = `
      UPDATE t_participants
      SET st_participante='winner'
      WHERE id_participante=(
        SELECT id_participante FROM t_participants
        WHERE st_participante='active'
        ORDER BY RANDOM() LIMIT 1 FOR UPDATE SKIP LOCKED
      ) AND st_participante='active'
      RETURNING ${participantFields}
    `;

    const stmt = transaction.prepare(updateQuery);
    const winner = await stmt.first<Record<string, unknown>>();

    if (winner) {
      await transaction
        .prepare(
          "INSERT INTO t_draws(id_sorteio,id_participante,nr_sorte) VALUES(?,?,?)",
        )
        .bind(drawId, winner.id, String(winner.lucky_number))
        .run();
    }

    return winner;
  });

  if (!selected) {
    return Response.json(
      { error: "Não há participantes ativos disponíveis para sortear." },
      { status: 409 },
    );
  }

  return Response.json({
    ok: true,
    winner: row({
      ...selected,
      status: "winner",
      won_at: new Date().toISOString(),
    }),
    drawId,
  });
}

export async function PATCH(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

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
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const drawId = typeof payload.drawId === "string" ? payload.drawId.trim() : "";
  if (!drawId) {
    return Response.json({ error: "Sorteio inválido." }, { status: 400 });
  }

  const db = await initialize();
  const draw = await db
    .prepare(
      "SELECT id_sorteio AS id, nr_sorte AS lucky_number FROM t_draws WHERE id_sorteio=?",
    )
    .bind(drawId)
    .first<{ id: string; lucky_number: string }>();

  if (!draw) {
    return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
  }

  await db.batch([
    db
      .prepare(
        "INSERT INTO t_settings(cd_configuracao,vl_configuracao) VALUES('latest_draw_id',?) ON CONFLICT(cd_configuracao) DO UPDATE SET vl_configuracao=excluded.vl_configuracao",
      )
      .bind(draw.id),
    db
      .prepare(
        "INSERT INTO t_settings(cd_configuracao,vl_configuracao) VALUES('latest_winner_number',?) ON CONFLICT(cd_configuracao) DO UPDATE SET vl_configuracao=excluded.vl_configuracao",
      )
      .bind(draw.lucky_number),
  ]);

  // Broadcast instant real-time alert via Supabase Realtime (WebSockets)
  await broadcastWinnerAnnouncement(draw.id, draw.lucky_number);

  return Response.json({
    ok: true,
    drawId: draw.id,
    winnerNumber: draw.lucky_number,
  });
}
