import { adminAllowed, initialize } from "@/app/api/_lib/db";
import type { CreateDrawDTO, UpdateDrawDTO } from "@/types/drawCollection.types";

export async function POST(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "JSON esperado." }, { status: 400 });
    }

    const payload = body as CreateDrawDTO;
    const title = payload.title?.trim();
    const prizeTitle = payload.prizeTitle?.trim();
    const targetUserTypes = Array.isArray(payload.targetUserTypes) && payload.targetUserTypes.length > 0
      ? payload.targetUserTypes
      : ["lojista", "revendedor", "influencer", "visitante"];
    const hasLimit = Boolean(payload.hasNumberLimit);
    const maxNumber = hasLimit && payload.maxNumber ? Number(payload.maxNumber) : null;

    if (!title || !prizeTitle) {
      return Response.json(
        { error: "Informe o título do sorteio e o prêmio." },
        { status: 400 },
      );
    }

    const db = await initialize();
    const drawId = `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await db
      .prepare(
        `INSERT INTO t_draw_definitions (id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio)
         VALUES (?, ?, ?, ?::jsonb, ?, ?, 'ready')`,
      )
      .bind(
        drawId,
        title,
        prizeTitle,
        JSON.stringify(targetUserTypes),
        hasLimit,
        maxNumber,
      )
      .run();

    return Response.json({
      ok: true,
      draw: {
        id: drawId,
        title,
        prizeTitle,
        targetUserTypes,
        hasNumberLimit: hasLimit,
        maxNumber,
        status: "ready",
        order: 1,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sorteio:", error);
    return Response.json({ error: "Erro ao criar sorteio no banco." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "JSON esperado." }, { status: 400 });
    }

    const payload = body as { drawId: string } & UpdateDrawDTO;
    const drawId = payload.drawId?.trim();
    if (!drawId) {
      return Response.json({ error: "ID do sorteio é obrigatório." }, { status: 400 });
    }

    const db = await initialize();
    const existing = await db
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

    if (!existing) {
      return Response.json({ error: "Sorteio não encontrado." }, { status: 404 });
    }

    const title = payload.title !== undefined ? payload.title.trim() : existing.nm_titulo;
    const prizeTitle = payload.prizeTitle !== undefined ? payload.prizeTitle.trim() : existing.nm_premio;
    const targetUserTypes = payload.targetUserTypes !== undefined ? payload.targetUserTypes : existing.target_user_types;
    const hasLimit = payload.hasNumberLimit !== undefined ? Boolean(payload.hasNumberLimit) : existing.tem_limite;
    const maxNumber = hasLimit ? (payload.maxNumber !== undefined ? (payload.maxNumber ? Number(payload.maxNumber) : null) : existing.nr_limite_maximo) : null;
    const status = payload.status !== undefined ? payload.status : existing.st_sorteio;

    await db
      .prepare(
        `UPDATE t_draw_definitions 
         SET nm_titulo = ?, nm_premio = ?, target_user_types = ?::jsonb, tem_limite = ?, nr_limite_maximo = ?, st_sorteio = ?
         WHERE id_sorteio = ?`,
      )
      .bind(
        title,
        prizeTitle,
        JSON.stringify(targetUserTypes),
        hasLimit,
        maxNumber,
        status,
        drawId,
      )
      .run();

    return Response.json({
      ok: true,
      draw: {
        id: drawId,
        title,
        prizeTitle,
        targetUserTypes,
        hasNumberLimit: hasLimit,
        maxNumber,
        status,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar sorteio:", error);
    return Response.json({ error: "Erro ao atualizar sorteio no banco." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!adminAllowed(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const drawId = url.searchParams.get("drawId")?.trim();

    if (!drawId) {
      return Response.json({ error: "ID do sorteio é obrigatório." }, { status: 400 });
    }

    const db = await initialize();
    await db.prepare("DELETE FROM t_draw_definitions WHERE id_sorteio = ?").bind(drawId).run();

    return Response.json({ ok: true, deletedDrawId: drawId });
  } catch (error) {
    console.error("Erro ao excluir sorteio:", error);
    return Response.json({ error: "Erro ao excluir sorteio do banco." }, { status: 500 });
  }
}
