import { adminAllowed, initialize } from "../../_lib/db";

function csv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!adminAllowed(request)) {
    return new Response("Não autorizado", { status: 401 });
  }

  const db = await initialize();
  const result = await db
    .prepare(`
      SELECT 
        COALESCE(
          (
            SELECT string_agg(dt.nr_bilhete, ', ' ORDER BY dt.dt_inscricao ASC)
            FROM t_draw_tickets dt
            WHERE dt.id_participante = p.id_participante
          ),
          'Sem número'
        ) AS lucky_numbers,
        p.nm_participante AS name,
        p.nm_loja AS store,
        p.nr_whatsapp AS phone,
        p.nm_instagram AS instagram,
        COALESCE(p.user_type, 'lojista') AS user_type,
        p.st_participante AS status,
        p.dt_cadastro AS created_at
      FROM t_participants p
      ORDER BY p.id_participante ASC
    `)
    .all<Record<string, unknown>>();

  const header = "Números da Sorte,Nome,Loja,WhatsApp,Instagram,Categoria,Situação,Data/Hora";
  const lines = result.results.map((r: Record<string, unknown>) =>
    [
      r.lucky_numbers,
      r.name,
      r.store,
      r.phone,
      r.instagram,
      r.user_type,
      r.status,
      r.created_at,
    ]
      .map(csv)
      .join(","),
  );

  return new Response(`\uFEFF${[header, ...lines].join("\r\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=participantes-fashion-date.csv",
    },
  });
}

