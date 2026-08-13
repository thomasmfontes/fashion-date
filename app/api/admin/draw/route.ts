import {adminAllowed, initialize, row} from "../../_lib/db";

export async function POST(request: Request) {
  if (!adminAllowed(request)) return Response.json({error:"Não autorizado"}, {status:401});
  const db = await initialize();
  const selected = await db.prepare("SELECT * FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1").first<Record<string, unknown>>();
  if (!selected) return Response.json({error:"Não há participantes válidos para sortear."}, {status:409});

  const drawId = crypto.randomUUID();
  await db.batch([
    db.prepare("UPDATE participants SET status='winner' WHERE id=?").bind(selected.id),
    db.prepare("INSERT INTO settings(key,value) VALUES('latest_draw_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(drawId),
    db.prepare("INSERT INTO settings(key,value) VALUES('latest_winner_number',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(selected.lucky_number)),
  ]);
  return Response.json({winner:row({...selected, status:"winner"}), drawId});
}
