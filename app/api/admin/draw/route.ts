import {adminAllowed, initialize, row} from "../../_lib/db";

export async function POST(request: Request) {
  if (!adminAllowed(request)) return Response.json({error:"Não autorizado"}, {status:401});
  const db = await initialize();
  const selected = await db.prepare("UPDATE participants SET status='winner' WHERE id=(SELECT id FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1) AND status='active' RETURNING *").first<Record<string, unknown>>();
  if (!selected) return Response.json({error:"Não há participantes válidos para sortear."}, {status:409});

  const drawId = crypto.randomUUID();
  await db.batch([
    db.prepare("INSERT INTO draws(id,participant_id,lucky_number) VALUES(?,?,?)").bind(drawId, selected.id, String(selected.lucky_number)),
    db.prepare("INSERT INTO settings(key,value) VALUES('latest_draw_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(drawId),
    db.prepare("INSERT INTO settings(key,value) VALUES('latest_winner_number',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(selected.lucky_number)),
  ]);
  return Response.json({winner:row({...selected, status:"winner", won_at:new Date().toISOString()}), drawId});
}
