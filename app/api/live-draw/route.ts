import { initialize } from "../_lib/db";

export async function GET(request?: Request) {
  const db = await initialize();
  const result = await db
    .prepare(
      "SELECT key, value FROM settings WHERE key IN ('latest_draw_id','latest_winner_number','registrations_open')",
    )
    .all<{ key: string; value: string }>();
  const settings = Object.fromEntries(
    result.results.map((item: { key: string; value: string }) => [item.key, item.value]),
  );

  const drawId = settings.latest_draw_id || null;
  const winnerNumber = settings.latest_winner_number || null;
  const registrationsOpen = settings.registrations_open !== "false";

  // Deterministic ETag representing the live state
  const rawState = `${drawId || "none"}:${winnerNumber || "none"}:${registrationsOpen}`;
  const etag = `"${btoa(rawState)}"`;

  const ifNoneMatch = request?.headers?.get?.("if-none-match");
  if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === rawState)) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache, must-revalidate",
      },
    });
  }

  return Response.json(
    {
      drawId,
      winnerNumber,
      registrationsOpen,
    },
    {
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache, must-revalidate",
      },
    },
  );
}
