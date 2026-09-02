import { adminAllowed, initialize } from "@/app/api/_lib/db";
import type { DrawWinnerItem, UserType } from "@/types/participant.types";

export async function GET(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const db = await initialize();
    const result = await db
      .prepare(
        `SELECT 
          w.id_vencedor AS id,
          w.id_sorteio AS draw_id,
          COALESCE(d.nm_titulo, w.id_sorteio) AS draw_title,
          COALESCE(d.nm_premio, 'Prêmio Especial') AS prize_title,
          w.id_participante AS participant_id,
          COALESCE(p.nm_participante, 'Participante') AS name,
          COALESCE(p.nm_loja, '—') AS store,
          COALESCE(p.nr_whatsapp, '') AS phone,
          COALESCE(p.nm_instagram, '') AS instagram,
          p.user_type AS user_type,
          w.nr_bilhete AS lucky_number,
          w.dt_apuracao AS won_at
        FROM t_draw_winners w
        LEFT JOIN t_draw_definitions d ON d.id_sorteio = w.id_sorteio
        LEFT JOIN t_participants p ON p.id_participante = w.id_participante
        ORDER BY w.dt_apuracao DESC`,
      )
      .all<Record<string, unknown>>();

    const winners: DrawWinnerItem[] = result.results.map((r) => {
      const wonAt = r.won_at;
      const rawType = String(r.user_type || "lojista").toLowerCase() as UserType;
      const userType: UserType = ["lojista", "revendedor", "influencer", "visitante"].includes(rawType)
        ? rawType
        : "lojista";

      return {
        id: Number(r.id),
        winnerId: Number(r.id),
        drawId: String(r.draw_id || ""),
        drawTitle: String(r.draw_title || "Sorteio Oficial"),
        prizeTitle: String(r.prize_title || "Prêmio Especial"),
        participantId: Number(r.participant_id || 0),
        name: String(r.name || "Participante"),
        store: String(r.store || "—"),
        phone: String(r.phone || ""),
        instagram: String(r.instagram || ""),
        userType,
        luckyNumber: String(r.lucky_number || ""),
        wonAt: wonAt instanceof Date ? wonAt.toISOString() : String(wonAt),
      };
    });

    return Response.json({ ok: true, winners });
  } catch (error) {
    console.error("Erro ao listar ganhadores:", error);
    return Response.json(
      { error: "Erro ao buscar histórico de sorteios.", winners: [] },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const winnerId = Number(url.searchParams.get("winnerId"));
    if (!winnerId || !Number.isInteger(winnerId)) {
      return Response.json({ error: "ID de vencedor inválido." }, { status: 400 });
    }

    const db = await initialize();
    await db.prepare("DELETE FROM t_draw_winners WHERE id_vencedor = ?").bind(winnerId).run();

    return Response.json({ ok: true, deletedWinnerId: winnerId });
  } catch (error) {
    console.error("Erro ao remover ganhador:", error);
    return Response.json({ error: "Erro ao excluir vencedor." }, { status: 500 });
  }
}
