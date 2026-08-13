import {initialize} from "../_lib/db";

export async function GET() {
  const db = await initialize();
  const result = await db.prepare("SELECT key, value FROM settings WHERE key IN ('latest_draw_id','latest_winner_number')").all<{key:string; value:string}>();
  const settings = Object.fromEntries(result.results.map(item => [item.key, item.value]));
  return Response.json({drawId:settings.latest_draw_id || null, winnerNumber:settings.latest_winner_number || null}, {headers:{"cache-control":"no-store, max-age=0"}});
}
