import { initialize, row } from "../_lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "");

    if (!phone || phone.length < 10) {
      return Response.json(
        { error: "Informe um número de WhatsApp válido com DDD." },
        { status: 400 },
      );
    }

    const db = await initialize();
    const existing = await db
      .prepare("SELECT * FROM participants WHERE phone=?")
      .bind(phone)
      .first<Record<string, unknown>>();

    if (!existing) {
      return Response.json(
        { error: "Nenhuma inscrição encontrada com este WhatsApp." },
        { status: 404 },
      );
    }

    return Response.json({
      ok: true,
      participant: row(existing),
    });
  } catch {
    return Response.json(
      { error: "Erro ao consultar inscrição. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    const store = String(body.store || "").trim();
    const phone = String(body.phone || "").replace(/\D/g, "");
    const instagram = String(body.instagram || "")
      .trim()
      .replace(/^@?/, "@");

    if (
      !name ||
      !store ||
      phone.length < 10 ||
      !instagram ||
      body.consent !== true
    ) {
      return Response.json(
        { error: "Preencha todos os campos e aceite o consentimento." },
        { status: 400 },
      );
    }

    const db = await initialize();
    const state = await db
      .prepare("SELECT value FROM settings WHERE key='registrations_open'")
      .first<{ value: string }>();

    if (state?.value === "false") {
      return Response.json(
        { error: "As inscrições estão temporariamente encerradas." },
        { status: 403 },
      );
    }

    const existing = await db
      .prepare("SELECT * FROM participants WHERE phone=?")
      .bind(phone)
      .first<Record<string, unknown>>();

    if (existing) {
      return Response.json({
        participant: row(existing),
        duplicate: true,
      });
    }

    let lucky = "";
    for (let i = 0; i < 20; i++) {
      lucky = String(
        (crypto.getRandomValues(new Uint32Array(1))[0] % 9999) + 1,
      ).padStart(4, "0");
      const used = await db
        .prepare("SELECT id FROM participants WHERE lucky_number=?")
        .bind(lucky)
        .first();
      if (!used) break;
    }

    const inserted = await db
      .prepare(
        "INSERT INTO participants(lucky_number,name,store,phone,instagram) VALUES(?,?,?,?,?) RETURNING *",
      )
      .bind(lucky, name, store, phone, instagram)
      .first<Record<string, unknown>>();

    return Response.json(
      {
        participant: row(inserted!),
        duplicate: false,
      },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 500 },
    );
  }
}
