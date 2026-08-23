import { adminAllowed, initialize } from "../../_lib/db";

export async function POST(request: Request) {
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
  const registrationsOpen = payload.registrationsOpen === true;

  const db = await initialize();
  await db
    .prepare(
      "INSERT INTO settings(key,value) VALUES('registrations_open',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    )
    .bind(String(registrationsOpen))
    .run();

  return Response.json({ ok: true });
}
