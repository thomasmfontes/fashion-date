import { initialize, participantFields, row } from "../../_lib/db";
import { cleanPhone } from "@/utils/formatters";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Payload inválido." }, { status: 400 });
    }

    const id = Number(body.id);
    const authUserId = typeof body.authUserId === "string" ? body.authUserId.trim() : "";
    const phone = typeof body.phone === "string" ? cleanPhone(body.phone) : "";
    const rawAvatar = body.avatarUrl;

    if ((!Number.isInteger(id) || id <= 0) && !authUserId && (!phone || phone.length < 10)) {
      return Response.json(
        { error: "Identificação do participante não informada." },
        { status: 400 },
      );
    }

    const avatarUrl =
      typeof rawAvatar === "string" && rawAvatar.trim() !== ""
        ? rawAvatar.trim()
        : null;

    const db = await initialize();

    const updated = await db
      .prepare(
        `UPDATE t_participants
         SET ds_avatar_url = ?
         WHERE (id_participante = ?)
            OR (auth_user_id IS NOT NULL AND auth_user_id = ?)
            OR (nr_whatsapp = ?)
         RETURNING ${participantFields}`,
      )
      .bind(
        avatarUrl,
        Number.isInteger(id) && id > 0 ? id : -1,
        authUserId || null,
        phone || null,
      )
      .first<Record<string, unknown>>();

    if (!updated) {
      return Response.json(
        { error: "Participante não encontrado para atualização de avatar." },
        { status: 404 },
      );
    }

    const formatted = row(updated);

    return Response.json({
      ok: true,
      avatarUrl: formatted.avatarUrl,
      participant: formatted,
    });
  } catch (err) {
    console.error("Erro ao atualizar avatar do participante:", err);
    return Response.json(
      { error: "Erro interno ao atualizar foto de perfil." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  return POST(request);
}
