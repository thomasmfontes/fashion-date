import {adminAllowed, initialize, row} from "../../_lib/db";

export async function GET(request: Request) {
  if (!adminAllowed(request)) return Response.json({error:"Não autorizado"}, {status:401});
  const db = await initialize();
  const result = await db.prepare("SELECT * FROM participants ORDER BY id DESC").all<Record<string, unknown>>();
  const state = await db.prepare("SELECT value FROM settings WHERE key='registrations_open'").first<{value:string}>();
  return Response.json({participants:result.results.map(row), registrationsOpen:state?.value !== "false"});
}

export async function PATCH(request: Request) {
  if (!adminAllowed(request)) return Response.json({error:"Não autorizado"}, {status:401});
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const name = String(body.name || "").trim();
  const store = String(body.store || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");
  const instagram = String(body.instagram || "").trim().replace(/^@?/, "@");
  if (!Number.isInteger(id) || !name || !store || phone.length < 10 || instagram === "@") {
    return Response.json({error:"Preencha todos os campos corretamente."}, {status:400});
  }

  try {
    const db = await initialize();
    const updated = await db.prepare("UPDATE participants SET name=?, store=?, phone=?, instagram=? WHERE id=? RETURNING *")
      .bind(name, store, phone, instagram, id).first<Record<string, unknown>>();
    if (!updated) return Response.json({error:"Participante não encontrado."}, {status:404});
    return Response.json({participant:row(updated)});
  } catch {
    return Response.json({error:"Este WhatsApp já está vinculado a outro cadastro."}, {status:409});
  }
}

export async function DELETE(request: Request) {
  if (!adminAllowed(request)) return Response.json({error:"Não autorizado"}, {status:401});
  const body = await request.json() as {id?: number};
  const id = Number(body.id);
  if (!Number.isInteger(id)) return Response.json({error:"Cadastro inválido."}, {status:400});
  const db = await initialize();
  const existing = await db.prepare("SELECT id FROM participants WHERE id=?").bind(id).first();
  if (!existing) return Response.json({error:"Participante não encontrado."}, {status:404});
  await db.prepare("DELETE FROM participants WHERE id=?").bind(id).run();
  return Response.json({ok:true});
}
