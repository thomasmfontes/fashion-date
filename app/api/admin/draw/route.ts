import { adminAllowed, initialize, row } from "../../_lib/db";

export async function POST(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const db = await initialize();
  const drawId = crypto.randomUUID();
  const selected = await db.transaction(async (transaction) => {
    const winner = await transaction
      .prepare(
        "UPDATE participants SET status='winner' WHERE id=(SELECT id FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1 FOR UPDATE SKIP LOCKED) AND status='active' RETURNING *",
      )
      .first<Record<string, unknown>>();

    if (winner) {
      await transaction
        .prepare(
          "INSERT INTO draws(id,participant_id,lucky_number) VALUES(?,?,?)",
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
    .prepare("SELECT id, lucky_number FROM draws WHERE id=?")
    .bind(drawId)
    .first<{ id: string; lucky_number: string }>();

  if (!draw) {
    return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
  }

  await db.batch([
    db
      .prepare(
        "INSERT INTO settings(key,value) VALUES('latest_draw_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .bind(draw.id),
    db
      .prepare(
        "INSERT INTO settings(key,value) VALUES('latest_winner_number',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .bind(draw.lucky_number),
  ]);

  return Response.json({
    ok: true,
    drawId: draw.id,
    winnerNumber: draw.lucky_number,
  });
}
