import { initialize } from "@/app/api/_lib/db";
import type { UserType } from "@/types/participant.types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawParticipantId = url.searchParams.get("participantId");
    const phone = url.searchParams.get("phone")?.replace(/\D/g, "");
    const participantId = rawParticipantId && !isNaN(Number(rawParticipantId)) && Number(rawParticipantId) > 0
      ? Number(rawParticipantId)
      : null;

    if (!participantId && (!phone || phone.length < 10)) {
      return Response.json(
        { error: "Informe o ID do participante ou número de WhatsApp." },
        { status: 400 },
      );
    }

    const db = await initialize();

    // 1. Localizar o participante e seu tipo de usuário
    let pId = participantId;
    let uType: string = "lojista";
    if (participantId) {
      const p = await db
        .prepare("SELECT id_participante AS id, user_type FROM t_participants WHERE id_participante = ?")
        .bind(participantId)
        .first<{ id: number; user_type: string }>();
      if (p) {
        pId = Number(p.id);
        uType = String(p.user_type || "lojista").toLowerCase();
      }
    } else if (phone) {
      const p = await db
        .prepare("SELECT id_participante AS id, user_type FROM t_participants WHERE nr_whatsapp = ?")
        .bind(phone)
        .first<{ id: number; user_type: string }>();
      if (p) {
        pId = Number(p.id);
        uType = String(p.user_type || "lojista").toLowerCase();
      }
    }


    let query = `
      SELECT 
        t.id_ticket AS id,
        t.id_participante AS participant_id,
        t.id_sorteio AS draw_id,
        t.nr_bilhete AS ticket_number,
        t.dt_inscricao AS entered_at,
        d.nm_titulo AS draw_title,
        d.nm_premio AS prize_title
      FROM t_draw_tickets t
      JOIN t_draw_definitions d ON t.id_sorteio = d.id_sorteio
    `;

    let rows: Record<string, unknown>[] = [];
    if (pId) {
      query += " WHERE t.id_participante = ? ORDER BY t.dt_inscricao ASC";
      const result = await db.prepare(query).bind(pId).all<Record<string, unknown>>();
      rows = result.results;
    } else {
      query += `
        JOIN t_participants p ON t.id_participante = p.id_participante
        WHERE p.nr_whatsapp = ?
        ORDER BY t.dt_inscricao ASC
      `;
      const result = await db.prepare(query).bind(phone).all<Record<string, unknown>>();
      rows = result.results;
    }

    const tickets = rows.map((r) => ({
      id: Number(r.id),
      drawId: String(r.draw_id),
      drawTitle: String(r.draw_title),
      prizeTitle: String(r.prize_title),
      ticketNumber: String(r.ticket_number),
      enteredAt: r.entered_at instanceof Date ? r.entered_at.toISOString() : String(r.entered_at),
    }));

    return Response.json({ ok: true, tickets });
  } catch (error) {
    console.error("Erro ao buscar bilhetes:", error);
    return Response.json(
      { error: "Erro ao buscar bilhetes do participante." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "JSON esperado." }, { status: 400 });
    }

    const payload = body as {
      participantId?: number;
      phone?: string;
      drawId?: string;
    };

    const drawId = payload.drawId?.trim();
    const participantId = payload.participantId && !isNaN(Number(payload.participantId)) && Number(payload.participantId) > 0
      ? Number(payload.participantId)
      : null;
    const phone = payload.phone?.replace(/\D/g, "");

    if (!drawId || (!participantId && (!phone || phone.length < 10))) {
      return Response.json(
        { error: "Informe o sorteio e a identificação do participante." },
        { status: 400 },
      );
    }

    const db = await initialize();

    // 1. Localiza o participante
    let participant: Record<string, unknown> | null = null;
    if (participantId) {
      participant = await db
        .prepare("SELECT id_participante AS id, nm_participante AS name, user_type FROM t_participants WHERE id_participante = ?")
        .bind(participantId)
        .first<Record<string, unknown>>();
    } else if (phone) {
      participant = await db
        .prepare("SELECT id_participante AS id, nm_participante AS name, user_type FROM t_participants WHERE nr_whatsapp = ?")
        .bind(phone)
        .first<Record<string, unknown>>();
    }

    if (!participant) {
      return Response.json(
        { error: "Participante não encontrado." },
        { status: 404 },
      );
    }

    const pId = Number(participant.id);
    const userType = String(participant.user_type || "lojista").toLowerCase() as UserType;

    // 2. Localiza o sorteio
    const draw = await db
      .prepare("SELECT id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio FROM t_draw_definitions WHERE id_sorteio = ?")
      .bind(drawId)
      .first<{
        id_sorteio: string;
        nm_titulo: string;
        nm_premio: string;
        target_user_types: unknown;
        tem_limite: boolean;
        nr_limite_maximo: number | null;
        st_sorteio: string;
      }>();

    if (!draw) {
      return Response.json(
        { error: "Sorteio não encontrado." },
        { status: 404 },
      );
    }

    if (draw.st_sorteio !== "open" && draw.st_sorteio !== "ready") {
      return Response.json(
        { error: "Este sorteio já foi encerrado ou finalizado." },
        { status: 400 },
      );
    }

    // 3. Validação de Elegibilidade por Perfil
    let targetTypes: string[] = [];
    if (Array.isArray(draw.target_user_types)) {
      targetTypes = draw.target_user_types.map((t) => String(t).toLowerCase());
    } else if (typeof draw.target_user_types === "string") {
      try {
        const parsed = JSON.parse(draw.target_user_types);
        if (Array.isArray(parsed)) targetTypes = parsed.map((t) => String(t).toLowerCase());
      } catch {
        /* ignore JSON parse error */
      }
    }

    if (targetTypes.length > 0 && !targetTypes.includes(userType)) {
      return Response.json(
        { error: "Este sorteio é exclusivo para outras categorias de participantes." },
        { status: 403 },
      );
    }

    // 4. Se já possui bilhete neste sorteio, retorna o existente
    const existingTicket = await db
      .prepare("SELECT id_ticket, id_sorteio, nr_bilhete, dt_inscricao FROM t_draw_tickets WHERE id_participante = ? AND id_sorteio = ?")
      .bind(pId, drawId)
      .first<Record<string, unknown>>();

    if (existingTicket) {
      return Response.json({
        ok: true,
        ticket: {
          id: Number(existingTicket.id_ticket),
          drawId: String(existingTicket.id_sorteio),
          drawTitle: draw.nm_titulo,
          prizeTitle: draw.nm_premio,
          ticketNumber: String(existingTicket.nr_bilhete),
          enteredAt: existingTicket.dt_inscricao instanceof Date ? existingTicket.dt_inscricao.toISOString() : String(existingTicket.dt_inscricao),
        },
        alreadyEntered: true,
      });
    }

    // 5. Gera um número exclusivo dentro das regras do sorteio
    let generatedTicketNumber = "";
    const hasLimit = Boolean(draw.tem_limite && draw.nr_limite_maximo && draw.nr_limite_maximo > 0);
    const maxNumber = hasLimit ? Number(draw.nr_limite_maximo) : 9999;

    for (let attempt = 0; attempt < 30; attempt++) {
      let candidate = "";
      if (hasLimit) {
        const randomNum = Math.floor(Math.random() * maxNumber) + 1;
        candidate = String(randomNum).padStart(4, "0");
      } else {
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        candidate = String(randomNum).padStart(4, "0");
      }

      const check = await db
        .prepare("SELECT id_ticket FROM t_draw_tickets WHERE id_sorteio = ? AND nr_bilhete = ?")
        .bind(drawId, candidate)
        .first();

      if (!check) {
        generatedTicketNumber = candidate;
        break;
      }
    }

    if (!generatedTicketNumber) {
      return Response.json(
        { error: "Alta concorrência na emissão de bilhetes. Tente novamente em instantes." },
        { status: 503 },
      );
    }

    // 6. Insere o bilhete atômico na tabela oficial
    const inserted = await db
      .prepare(
        "INSERT INTO t_draw_tickets (id_participante, id_sorteio, nr_bilhete) VALUES (?, ?, ?) RETURNING id_ticket, dt_inscricao",
      )
      .bind(pId, drawId, generatedTicketNumber)
      .first<Record<string, unknown>>();

    if (!inserted) {
      return Response.json(
        { error: "Não foi possível emitir o bilhete. Tente novamente." },
        { status: 500 },
      );
    }

    return Response.json({
      ok: true,
      ticket: {
        id: Number(inserted.id_ticket),
        drawId,
        drawTitle: draw.nm_titulo,
        prizeTitle: draw.nm_premio,
        ticketNumber: generatedTicketNumber,
        enteredAt: inserted.dt_inscricao instanceof Date ? inserted.dt_inscricao.toISOString() : String(inserted.dt_inscricao),
      },
      alreadyEntered: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao emitir bilhete:", error);
    return Response.json(
      { error: "Erro interno ao processar bilhete." },
      { status: 500 },
    );
  }
}
