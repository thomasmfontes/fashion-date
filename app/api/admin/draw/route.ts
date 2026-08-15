import { adminAllowed, initialize, row } from "../../_lib/db";

export async function POST(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const db = await initialize();
  const selected = await db
    .prepare(
      "UPDATE participants SET status='winner' WHERE id=(SELECT id FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1) AND status='active' RETURNING *",
    )
    .first<Record<string, unknown>>();

  if (!selected) {
    return Response.json(
      { error: "Não há participantes ativos disponíveis para sortear." },
      { status: 409 },
    );
  }

  const drawId = crypto.randomUUID();
  await db
    .prepare("INSERT INTO draws(id,participant_id,lucky_number) VALUES(?,?,?)")
    .bind(drawId, selected.id, String(selected.lucky_number))
    .run();

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

  const body = (await request.json()) as { drawId?: string };
  const drawId = String(body.drawId || "").trim();
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
