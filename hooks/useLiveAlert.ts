import { useState, useRef, useEffect, useCallback } from "react";
import { useWakeLock } from "./useWakeLock";
import { useSoundFx } from "./useSoundFx";
import { APP_CONFIG } from "@/constants/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CelebrationMode = "test" | "winner" | "not-winner" | null;

export function useLiveAlert(userLuckyNumber?: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isWebSocketActive, setIsWebSocketActive] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationMode>(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [drawnNumber, setDrawnNumber] = useState("");

  const lastDrawRef = useRef<string | null>(null);
  const testTimerRef = useRef<number | null>(null);

  const { playVictory, playAlarmSiren } = useSoundFx();
  useWakeLock(isEnabled);

  const celebrate = useCallback(
    (mode: "test" | "winner" | "not-winner", winnerNumber = "") => {
      setDrawnNumber(winnerNumber);
      setCelebration(mode);
      setAlarmActive(mode !== "not-winner");

      if (testTimerRef.current) window.clearTimeout(testTimerRef.current);
      if (mode === "test") {
        testTimerRef.current = window.setTimeout(() => {
          setAlarmActive(false);
          setCelebration(null);
        }, 4200);
      }
    },
    [],
  );

  const handleWinnerAnnounced = useCallback(
    (drawId: string, winnerNumber: string) => {
      if (!drawId || drawId === lastDrawRef.current) return;
      lastDrawRef.current = drawId;

      const userClean = String(userLuckyNumber || "").trim();
      const winnerClean = String(winnerNumber || "").trim();
      const isWinner =
        Boolean(winnerClean) &&
        (winnerClean === userClean ||
          Number(winnerClean) === Number(userClean));

      if (isWinner) {
        celebrate("winner", winnerNumber);
      } else if (winnerNumber) {
        celebrate("not-winner", winnerNumber);
      }
    },
    [celebrate, userLuckyNumber],
  );

  // 1. Supabase Realtime (WebSockets) Subscription
  useEffect(() => {
    if (!isEnabled || !userLuckyNumber) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel("live-draw", {
      config: {
        broadcast: { ack: false },
      },
    });

    channel
      .on(
        "broadcast",
        { event: "winner-announced" },
        (payload: { payload?: { drawId?: string; winnerNumber?: string } }) => {
          const { drawId, winnerNumber } = payload?.payload || {};
          if (drawId && winnerNumber) {
            handleWinnerAnnounced(drawId, winnerNumber);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsWebSocketActive(true);
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsWebSocketActive(false);
        }
      });

    return () => {
      setIsWebSocketActive(false);
      supabase.removeChannel(channel);
    };
  }, [isEnabled, userLuckyNumber, handleWinnerAnnounced]);

  // 2. HTTP Polling as Fallback & Initial Baseline Sync
  const etagRef = useRef<string | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const pollingTimeoutRef = useRef<number | null>(null);

  const checkDraw = useCallback(
    async (baseline = false) => {
      if (!userLuckyNumber) return;
      try {
        const headers: Record<string, string> = {};
        if (etagRef.current && !baseline) {
          headers["If-None-Match"] = etagRef.current;
        }

        const response = await fetch(APP_CONFIG.api.liveDraw, {
          headers,
          cache: "no-cache",
        });

        const newEtag = response.headers.get("ETag");
        if (newEtag) {
          etagRef.current = newEtag;
        }

        setIsConnected(true);
        consecutiveErrorsRef.current = 0;

        // 304 Not Modified: State unchanged
        if (response.status === 304) {
          return;
        }

        if (!response.ok) throw new Error();
        const data = (await response.json()) as {
          drawId: string | null;
          winnerNumber: string | null;
        };

        if (baseline) {
          lastDrawRef.current = data.drawId;
          return;
        }

        if (data.drawId && data.winnerNumber) {
          handleWinnerAnnounced(data.drawId, data.winnerNumber);
        }
      } catch {
        consecutiveErrorsRef.current += 1;
        if (!isWebSocketActive) {
          setIsConnected(false);
        }
      }
    },
    [handleWinnerAnnounced, isWebSocketActive, userLuckyNumber],
  );

  const enableAlert = useCallback(async () => {
    setIsEnabled(true);
    playVictory();
    await checkDraw(true);
  }, [playVictory, checkDraw]);

  const silenceAlarm = useCallback(() => {
    setAlarmActive(false);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
    setAlarmActive(false);
  }, []);

  // Adaptive polling loop with visibility pause and backoff (active as backup)
  useEffect(() => {
    if (!isEnabled) return;
    let isCancelled = false;

    const scheduleNextPoll = () => {
      if (isCancelled) return;

      // Base interval: 2.5s (or slightly relaxed if WebSocket is active)
      const baseDelay = isWebSocketActive ? 4500 : 2200 + Math.floor(Math.random() * 400);
      const backoffMultiplier = Math.min(Math.pow(1.5, consecutiveErrorsRef.current), 3.5);
      const delay = Math.round(baseDelay * backoffMultiplier);

      pollingTimeoutRef.current = window.setTimeout(async () => {
        if (!isCancelled) {
          if (typeof document === "undefined" || document.visibilityState !== "hidden") {
            await checkDraw();
          }
          scheduleNextPoll();
        }
      }, delay);
    };

    scheduleNextPoll();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isCancelled) {
        checkDraw();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (pollingTimeoutRef.current) {
        window.clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkDraw, isEnabled, isWebSocketActive]);

  // Celebratory audio loop when alert is active
  useEffect(() => {
    if (!celebration || !alarmActive) return;

    playAlarmSiren();
    const fanfareInterval = window.setInterval(() => {
      playAlarmSiren();
    }, 2400);

    return () => {
      window.clearInterval(fanfareInterval);
    };
  }, [alarmActive, celebration, playAlarmSiren]);

  return {
    isEnabled,
    isConnected,
    isWebSocketActive,
    celebration,
    alarmActive,
    drawnNumber,
    enableAlert,
    silenceAlarm,
    dismissCelebration,
    triggerTest: () => celebrate("test", userLuckyNumber || "0000"),
  };
}
