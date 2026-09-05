import { initialize } from "../_lib/db";

export async function GET(request?: Request) {
  try {
    const db = await initialize();
    const result = await db
      .prepare(
        "SELECT cd_configuracao AS key, vl_configuracao AS value FROM t_settings WHERE cd_configuracao IN ('latest_draw_id','latest_winner_number','registrations_open','latest_target_draw_id','latest_draw_title','latest_prize_title')",
      )
      .all<{ key: string; value: string }>();
    const settings = Object.fromEntries(
      result.results.map((item: { key: string; value: string }) => [item.key, item.value]),
    );

    const drawId = settings.latest_target_draw_id || settings.latest_draw_id || null;
    const winnerNumber = settings.latest_winner_number || null;
    const drawTitle = settings.latest_draw_title || null;
    const prizeTitle = settings.latest_prize_title || null;
    const registrationsOpen = settings.registrations_open !== "false";

    // Deterministic ETag representing the live state
    const rawState = `${drawId || "none"}:${winnerNumber || "none"}:${registrationsOpen}:${drawTitle || ""}:${prizeTitle || ""}`;
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
        drawTitle,
        prizeTitle,
        registrationsOpen,
      },
      {
        headers: {
          ETag: etag,
          "Cache-Control": "no-cache, must-revalidate",
        },
      },
    );
  } catch (err) {
    console.warn("Live draw fetch fallback due to DB connection:", err);
    return Response.json(
      {
        drawId: null,
        winnerNumber: null,
        registrationsOpen: true,
      },
      {
        headers: {
          "Cache-Control": "no-cache, must-revalidate",
        },
      },
    );
  }
}
