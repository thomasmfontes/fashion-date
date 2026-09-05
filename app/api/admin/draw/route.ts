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
  let maxNumber: number | undefined;
  let drawIdTarget: string | undefined;

  try {
    const body = (await request.json()) as {
      drawId?: string;
      targetUserTypes?: string[];
      maxNumber?: number;
    };
    if (body && typeof body.drawId === "string" && body.drawId.trim()) {
      drawIdTarget = body.drawId.trim();
    }
    if (body && Array.isArray(body.targetUserTypes) && body.targetUserTypes.length > 0) {
      targetTypes = body.targetUserTypes.map((t) => String(t).toLowerCase());
    }
    if (body && typeof body.maxNumber === "number" && body.maxNumber > 0) {
      maxNumber = Math.floor(body.maxNumber);
    }
  } catch {
    // Body is optional
  }

  const db = await initialize();
  const sessionDrawId = crypto.randomUUID();

  const selected = await db.transaction(async (transaction) => {
    let winnerRow: Record<string, unknown> | null = null;
    let winningTicketNumber = "";

    // 1. Try selecting from t_draw_tickets if drawIdTarget is provided
    if (drawIdTarget) {
      let ticketFilter = "WHERE t.id_sorteio = ?";
      if (maxNumber) {
        ticketFilter += ` AND t.nr_bilhete ~ '^[0-9]+$' AND CAST(t.nr_bilhete AS INTEGER) <= ${maxNumber}`;
      }
      if (targetTypes.length > 0) {
        const typesStr = targetTypes.map((t) => `'${t}'`).join(",");
        ticketFilter += ` AND LOWER(COALESCE(p.user_type, 'lojista')) IN (${typesStr})`;
      }

      // Exclude previous winners of this specific draw
      ticketFilter += ` AND t.id_participante NOT IN (SELECT id_participante FROM t_draw_winners WHERE id_sorteio = '${drawIdTarget}')`;

      const ticketWinner = await transaction
        .prepare(`
          SELECT 
            t.id_ticket,
            t.nr_bilhete AS lucky_number,
            p.id_participante AS id,
            p.nm_participante AS name,
            p.nm_loja AS store,
            p.nr_whatsapp AS phone,
            p.nm_instagram AS instagram,
            p.user_type,
            'winner' AS status,
            p.dt_cadastro AS created_at
          FROM t_draw_tickets t
          JOIN t_participants p ON t.id_participante = p.id_participante
          ${ticketFilter}
          ORDER BY RANDOM() LIMIT 1 FOR UPDATE SKIP LOCKED
        `)
        .bind(drawIdTarget)
        .first<Record<string, unknown>>();

      if (ticketWinner) {
        winnerRow = ticketWinner;
        winningTicketNumber = String(ticketWinner.lucky_number || "").padStart(4, "0");
        winnerRow.lucky_number = winningTicketNumber;

        // Record in t_draw_winners
        await transaction
          .prepare(
            "INSERT INTO t_draw_winners (id_sorteio, id_participante, nr_bilhete) VALUES (?, ?, ?)",
          )
          .bind(drawIdTarget, Number(ticketWinner.id), winningTicketNumber)
          .run();
      }
    }

    // 2. Fallback to active participants if no ticket was found or no drawIdTarget
    if (!winnerRow) {
      let filterClause = "WHERE st_participante='active'";
      if (maxNumber) {
        filterClause += ` AND nr_sorte ~ '^[0-9]+$' AND CAST(nr_sorte AS INTEGER) <= ${maxNumber}`;
      }
      if (targetTypes.length > 0) {
        const typesStr = targetTypes.map((t) => `'${t}'`).join(",");
        filterClause += ` AND LOWER(COALESCE(user_type, 'lojista')) IN (${typesStr})`;
      }

      const updateQuery = `
        UPDATE t_participants
        SET st_participante='winner'
        WHERE id_participante=(
          SELECT id_participante FROM t_participants
          ${filterClause}
          ORDER BY RANDOM() LIMIT 1 FOR UPDATE SKIP LOCKED
        ) AND st_participante='active'
        RETURNING ${participantFields}
      `;

      winnerRow = await transaction.prepare(updateQuery).first<Record<string, unknown>>();
      if (winnerRow) {
        winningTicketNumber = String(winnerRow.lucky_number || "").padStart(4, "0");
        winnerRow.lucky_number = winningTicketNumber;
      }
    }

    if (winnerRow) {
      winningTicketNumber = String(winnerRow.lucky_number || "").padStart(4, "0");
      winnerRow.lucky_number = winningTicketNumber;

      await transaction
        .prepare(
          "INSERT INTO t_draws(id_sorteio,id_participante,nr_sorte) VALUES(?,?,?)",
        )
        .bind(sessionDrawId, Number(winnerRow.id), winningTicketNumber)
        .run();
    }

    return winnerRow;
  });

  if (!selected) {
    const errorMsg = drawIdTarget
      ? "Não há participantes inscritos neste sorteio disponíveis para apuração."
      : maxNumber
        ? `Não há participantes ativos disponíveis com número até ${maxNumber} para sortear.`
        : "Não há participantes ativos disponíveis para sortear.";
    return Response.json({ error: errorMsg }, { status: 409 });
  }

  const winnerNumber = String(selected.lucky_number || "").padStart(4, "0");

  return Response.json({
    ok: true,
    winner: row({
      ...selected,
      lucky_number: winnerNumber,
      status: "winner",
      won_at: new Date().toISOString(),
    }),
    drawId: sessionDrawId,
    targetDrawId: drawIdTarget || null,
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
  const targetDrawId =
    typeof payload.targetDrawId === "string" && payload.targetDrawId.trim()
      ? payload.targetDrawId.trim()
      : "";

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

  // Obter dados da definição do sorteio (Título e Prêmio) se houver targetDrawId
  let drawTitle = "";
  let prizeTitle = "";
  const effectiveTargetId = targetDrawId || draw.id;

  if (effectiveTargetId) {
    try {
      const def = await db
        .prepare(
          "SELECT nm_titulo, nm_premio FROM t_draw_definitions WHERE id_sorteio=?",
        )
        .bind(effectiveTargetId)
        .first<{ nm_titulo: string; nm_premio: string }>();
      if (def) {
        drawTitle = def.nm_titulo || "";
        prizeTitle = def.nm_premio || "";
      }
    } catch {
      // Ignora se tabela t_draw_definitions não estiver disponível no ambiente
    }
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
    db
      .prepare(
        "INSERT INTO t_settings(cd_configuracao,vl_configuracao) VALUES('latest_target_draw_id',?) ON CONFLICT(cd_configuracao) DO UPDATE SET vl_configuracao=excluded.vl_configuracao",
      )
      .bind(effectiveTargetId),
    db
      .prepare(
        "INSERT INTO t_settings(cd_configuracao,vl_configuracao) VALUES('latest_draw_title',?) ON CONFLICT(cd_configuracao) DO UPDATE SET vl_configuracao=excluded.vl_configuracao",
      )
      .bind(drawTitle),
    db
      .prepare(
        "INSERT INTO t_settings(cd_configuracao,vl_configuracao) VALUES('latest_prize_title',?) ON CONFLICT(cd_configuracao) DO UPDATE SET vl_configuracao=excluded.vl_configuracao",
      )
      .bind(prizeTitle),
  ]);

  // Broadcast instant real-time alert via Supabase Realtime (WebSockets)
  // Agora transmitido estritamente no momento do anúncio público com metadados do sorteio!
  await broadcastWinnerAnnouncement({
    drawId: effectiveTargetId,
    drawTitle: drawTitle || undefined,
    prizeTitle: prizeTitle || undefined,
    winnerNumber: draw.lucky_number,
    timestamp: new Date().toISOString(),
  });

  return Response.json({
    ok: true,
    drawId: draw.id,
    targetDrawId: effectiveTargetId,
    winnerNumber: draw.lucky_number,
    drawTitle,
    prizeTitle,
  });
}

export async function GET(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const drawId = searchParams.get("drawId")?.trim();
  const rawTargetTypes = searchParams.get("targetUserTypes");
  const rawMaxNumber = searchParams.get("maxNumber");

  let targetTypes: string[] = [];
  if (rawTargetTypes) {
    targetTypes = rawTargetTypes
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  let maxNumber: number | undefined;
  if (rawMaxNumber && !isNaN(Number(rawMaxNumber)) && Number(rawMaxNumber) > 0) {
    maxNumber = Math.floor(Number(rawMaxNumber));
  }

  const db = await initialize();
  let count = 0;

  try {
    if (drawId) {
      let ticketFilter = "WHERE t.id_sorteio = ?";
      if (maxNumber) {
        ticketFilter += ` AND t.nr_bilhete ~ '^[0-9]+$' AND CAST(t.nr_bilhete AS INTEGER) <= ${maxNumber}`;
      }
      if (targetTypes.length > 0) {
        const typesStr = targetTypes.map((t) => `'${t}'`).join(",");
        ticketFilter += ` AND LOWER(COALESCE(p.user_type, 'lojista')) IN (${typesStr})`;
      }
      ticketFilter += ` AND t.id_participante NOT IN (SELECT id_participante FROM t_draw_winners WHERE id_sorteio = '${drawId}')`;

      const res = await db
        .prepare(`
          SELECT COUNT(*)::integer AS count
          FROM t_draw_tickets t
          JOIN t_participants p ON t.id_participante = p.id_participante
          ${ticketFilter}
        `)
        .bind(drawId)
        .first<{ count: number }>();

      count = Number(res?.count || 0);

      // Se não houver bilhetes avulsos em t_draw_tickets para este sorteio, usa os participantes cadastrados
      if (count === 0) {
        let pFilter = "WHERE st_participante = 'active'";
        if (maxNumber) {
          pFilter += ` AND nr_sorte ~ '^[0-9]+$' AND CAST(nr_sorte AS INTEGER) <= ${maxNumber}`;
        }
        if (targetTypes.length > 0) {
          const typesStr = targetTypes.map((t) => `'${t}'`).join(",");
          pFilter += ` AND LOWER(COALESCE(user_type, 'lojista')) IN (${typesStr})`;
        }
        pFilter += ` AND id_participante NOT IN (SELECT id_participante FROM t_draw_winners WHERE id_sorteio = '${drawId}')`;

        const pRes = await db
          .prepare(`
            SELECT COUNT(*)::integer AS count
            FROM t_participants
            ${pFilter}
          `)
          .first<{ count: number }>();
        count = Number(pRes?.count || 0);
      }
    } else {
      let filterClause = "WHERE st_participante = 'active'";
      if (maxNumber) {
        filterClause += ` AND nr_sorte ~ '^[0-9]+$' AND CAST(nr_sorte AS INTEGER) <= ${maxNumber}`;
      }
      if (targetTypes.length > 0) {
        const typesStr = targetTypes.map((t) => `'${t}'`).join(",");
        filterClause += ` AND LOWER(COALESCE(user_type, 'lojista')) IN (${typesStr})`;
      }

      const res = await db
        .prepare(`
          SELECT COUNT(*)::integer AS count
          FROM t_participants
          ${filterClause}
        `)
        .first<{ count: number }>();

      count = Number(res?.count || 0);
    }
  } catch (err) {
    console.error("Erro ao verificar elegibilidade de sorteio:", err);
    // Em caso de fallback, assume que há participantes
    count = 1;
  }

  return Response.json({
    ok: true,
    eligibleCount: count,
    hasEligible: count > 0,
  });
}
