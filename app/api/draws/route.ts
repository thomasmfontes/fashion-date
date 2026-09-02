import { initialize } from "@/app/api/_lib/db";
import type { DrawItem } from "@/types/drawCollection.types";

export async function GET() {
  try {
    const db = await initialize();
    const result = await db
      .prepare(
        "SELECT id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio, dt_criacao FROM t_draw_definitions ORDER BY dt_criacao ASC",
      )
      .all<Record<string, unknown>>();

    const draws: DrawItem[] = result.results.map((r, index) => {
      let targetUserTypes = ["lojista", "revendedor", "influencer", "visitante"];
      if (Array.isArray(r.target_user_types)) {
        targetUserTypes = r.target_user_types as string[];
      } else if (typeof r.target_user_types === "string") {
        try {
          const parsed = JSON.parse(r.target_user_types);
          if (Array.isArray(parsed)) targetUserTypes = parsed;
        } catch {}
      }

      const rawStatus = String(r.st_sorteio || "ready");
      const status = rawStatus === "finished" || rawStatus === "completed"
        ? "completed"
        : rawStatus === "drawing" || rawStatus === "in_progress"
          ? "in_progress"
          : "ready";

      return {
        id: String(r.id_sorteio),
        title: String(r.nm_titulo),
        prizeTitle: String(r.nm_premio),
        targetUserTypes: targetUserTypes as DrawItem["targetUserTypes"],
        hasNumberLimit: Boolean(r.tem_limite),
        maxNumber: r.nr_limite_maximo ? Number(r.nr_limite_maximo) : undefined,
        status,
        order: index + 1,
        createdAt: r.dt_criacao instanceof Date ? r.dt_criacao.toISOString() : String(r.dt_criacao),
      };
    });

    return Response.json({ ok: true, draws });
  } catch (error) {
    console.error("Erro ao listar sorteios:", error);
    return Response.json(
      { error: "Erro ao buscar sorteios cadastrados." },
      { status: 500 },
    );
  }
}
