import { createClient } from "@supabase/supabase-js";

export interface WinnerBroadcastPayload {
  drawId: string;
  drawTitle?: string;
  prizeTitle?: string;
  winnerNumber: string;
  timestamp?: string;
}

export async function broadcastWinnerAnnouncement(
  drawIdOrPayload: string | WinnerBroadcastPayload,
  maybeWinnerNumber?: string,
): Promise<void> {
  const payload: WinnerBroadcastPayload =
    typeof drawIdOrPayload === "string"
      ? {
          drawId: drawIdOrPayload,
          winnerNumber: maybeWinnerNumber || "",
          timestamp: new Date().toISOString(),
        }
      : {
          ...drawIdOrPayload,
          timestamp: drawIdOrPayload.timestamp || new Date().toISOString(),
        };

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://ehgbrsnjwfdgxazhdhnr.supabase.co";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return;
  }

  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const channel = supabase.channel("live-draw");
    
    // Subscribe and send broadcast payload
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(); // Don't block the API response if broadcast times out
      }, 2500);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.send({
              type: "broadcast",
              event: "winner-announced",
              payload,
            });
            clearTimeout(timeout);
            resolve();
          } catch (sendErr) {
            clearTimeout(timeout);
            reject(sendErr);
          }
        }
      });
    });

    await supabase.removeChannel(channel);
  } catch (err) {
    // Non-blocking error logging (polling fallback ensures delivery)
    console.warn("Supabase Realtime broadcast warning:", err);
  }
}
