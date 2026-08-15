import { useState, useRef, useEffect, useCallback } from "react";
import { useWakeLock } from "./useWakeLock";
import { useSoundFx } from "./useSoundFx";
import { APP_CONFIG } from "@/constants/config";

export type CelebrationMode = "test" | "winner" | "not-winner" | null;

export function useLiveAlert(userLuckyNumber?: string) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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

  const checkDraw = useCallback(
    async (baseline = false) => {
      if (!userLuckyNumber) return;
      try {
        const response = await fetch(
          `${APP_CONFIG.api.liveDraw}?t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error();
        const data = (await response.json()) as {
          drawId: string | null;
          winnerNumber: string | null;
        };
        setIsConnected(true);

        if (baseline) {
          lastDrawRef.current = data.drawId;
          return;
        }

        if (data.drawId && data.drawId !== lastDrawRef.current) {
          lastDrawRef.current = data.drawId;
          const userClean = String(userLuckyNumber || "").trim();
          const winnerClean = String(data.winnerNumber || "").trim();
          const isWinner =
            Boolean(winnerClean) &&
            (winnerClean === userClean ||
              Number(winnerClean) === Number(userClean));

          if (isWinner) {
            celebrate("winner", data.winnerNumber || "");
          } else if (data.winnerNumber) {
            celebrate("not-winner", data.winnerNumber);
          }
        }
      } catch {
        setIsConnected(false);
      }
    },
    [celebrate, userLuckyNumber],
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

  useEffect(() => {
    if (!isEnabled) return;
    const interval = window.setInterval(() => checkDraw(), 1000);
    const visibility = () => {
      if (document.visibilityState === "visible") {
        checkDraw();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [checkDraw, isEnabled]);

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
    celebration,
    alarmActive,
    drawnNumber,
    enableAlert,
    silenceAlarm,
    dismissCelebration,
    triggerTest: () => celebrate("test", userLuckyNumber || "0000"),
  };
}
