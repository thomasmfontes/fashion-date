import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useWakeLock } from "./useWakeLock";
import { useSoundFx } from "./useSoundFx";
import { APP_CONFIG } from "@/constants/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CelebrationMode = "test" | "winner" | "not-winner" | null;

export interface LiveAlertTicket {
  drawId?: string;
  drawTitle?: string;
  prizeTitle?: string;
  ticketNumber: string;
}

export function useLiveAlert(
  userTicketsOrNumbers?: (LiveAlertTicket | string)[] | string,
) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("fashiondate_live_alert_enabled") === "true";
    }
    return false;
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isWebSocketActive, setIsWebSocketActive] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationMode>(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [drawnNumber, setDrawnNumber] = useState("");
  const [winningTicket, setWinningTicket] = useState<LiveAlertTicket | null>(null);
  const [activeDrawTitle, setActiveDrawTitle] = useState<string>("");
  const [activePrizeTitle, setActivePrizeTitle] = useState<string>("");

  const ticketsList = useMemo<LiveAlertTicket[]>(() => {
    if (!userTicketsOrNumbers) return [];
    const list = Array.isArray(userTicketsOrNumbers)
      ? userTicketsOrNumbers
      : [userTicketsOrNumbers];
    return list
      .map((item) => {
        if (typeof item === "string") {
          return {
            drawId: "",
            drawTitle: "",
            ticketNumber: item.trim(),
          };
        }
        return {
          drawId: item.drawId || "",
          drawTitle: item.drawTitle || "",
          prizeTitle: item.prizeTitle || "",
          ticketNumber: String(item.ticketNumber || "").trim(),
        };
      })
      .filter((t) => Boolean(t.ticketNumber));
  }, [userTicketsOrNumbers]);

  const primaryTicket = ticketsList[0] || null;
  const primaryNumber = primaryTicket?.ticketNumber || "";
  const hasUserNumbers = ticketsList.length > 0;

  const lastDrawRef = useRef<string | null>(null);
  const testTimerRef = useRef<number | null>(null);

  const { playTick, playVictory, playAlarmSiren } = useSoundFx();
  useWakeLock(isEnabled);

  const celebrate = useCallback(
    (mode: "test" | "winner" | "not-winner", winnerNumber = "") => {
      setDrawnNumber(winnerNumber);
      setCelebration(mode);
      setAlarmActive(mode !== "not-winner");

      // Vibração tátil instantânea no aparelho
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          if (mode === "winner") {
            navigator.vibrate([350, 100, 350, 100, 600]);
          } else if (mode === "test") {
            navigator.vibrate([150, 75, 150]);
          }
        } catch {
          // Ignora caso restrito pelas políticas do navegador
        }
      }

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
    (
      announcedDrawId: string,
      winnerNumber: string,
      announcedDrawTitle?: string,
      announcedPrizeTitle?: string,
    ) => {
      if (!announcedDrawId || announcedDrawId === lastDrawRef.current) return;
      lastDrawRef.current = announcedDrawId;

      const cleanWinner = String(winnerNumber || "").trim().replace(/^#/, "");
      const cleanWinnerInt = Number(cleanWinner);

      // 1. Procura se o participante possui bilhete vinculado a este sorteio específico
      const ticketForThisDraw = ticketsList.find(
        (t) =>
          t.drawId &&
          (t.drawId === announcedDrawId ||
            announcedDrawId.includes(t.drawId) ||
            t.drawId.includes(announcedDrawId)),
      );

      let matchedWin: LiveAlertTicket | null = null;

      if (ticketForThisDraw) {
        // Validação escopada: somente o bilhete DESTE sorteio pode ganhar!
        const userNum = ticketForThisDraw.ticketNumber.replace(/^#/, "").trim();
        if (userNum === cleanWinner || Number(userNum) === cleanWinnerInt) {
          matchedWin = ticketForThisDraw;
        }
      } else {
        // Se nenhum bilhete do participante tem drawId (modo legado de número único),
        // ou se o sorteio anunciado não tem drawId específico
        const hasAnyDrawIds = ticketsList.some((t) => Boolean(t.drawId));
        if (!hasAnyDrawIds) {
          matchedWin =
            ticketsList.find((t) => {
              const userNum = t.ticketNumber.replace(/^#/, "").trim();
              return (
                userNum === cleanWinner || Number(userNum) === cleanWinnerInt
              );
            }) || null;
        }
      }

      if (matchedWin) {
        setWinningTicket(matchedWin);
        setActiveDrawTitle(matchedWin.drawTitle || announcedDrawTitle || "");
        setActivePrizeTitle(matchedWin.prizeTitle || announcedPrizeTitle || "");
        celebrate("winner", winnerNumber);
      } else if (ticketForThisDraw) {
        setWinningTicket(ticketForThisDraw);
        setActiveDrawTitle(ticketForThisDraw.drawTitle || announcedDrawTitle || "");
        setActivePrizeTitle(ticketForThisDraw.prizeTitle || announcedPrizeTitle || "");
        celebrate("not-winner", winnerNumber);
      } else {
        // O sorteio anunciado era de outra rodada na qual o participante não possui bilhete.
        // Não disparamos falso alarme nem confetes indevidos.
      }
    },
    [celebrate, ticketsList],
  );

  // 1. Supabase Realtime (WebSockets) Subscription
  // Conecta imediatamente no canal assim que a tela abre, garantindo zero latência de conexão
  useEffect(() => {
    if (!hasUserNumbers) return;

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
        (payload: {
          payload?: {
            drawId?: string;
            winnerNumber?: string;
            drawTitle?: string;
            prizeTitle?: string;
          };
        }) => {
          const { drawId, winnerNumber, drawTitle, prizeTitle } =
            payload?.payload || {};
          if (drawId && winnerNumber) {
            handleWinnerAnnounced(drawId, winnerNumber, drawTitle, prizeTitle);
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
  }, [hasUserNumbers, handleWinnerAnnounced]);

  // 2. HTTP Polling as Fallback & Initial Baseline Sync
  const etagRef = useRef<string | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const pollingTimeoutRef = useRef<number | null>(null);

  const checkDraw = useCallback(
    async (baseline = false) => {
      if (!hasUserNumbers) return;
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
          drawTitle?: string | null;
          prizeTitle?: string | null;
        };

        if (baseline) {
          lastDrawRef.current = data.drawId;
          return;
        }

        if (data.drawId && data.winnerNumber) {
          handleWinnerAnnounced(
            data.drawId,
            data.winnerNumber,
            data.drawTitle || undefined,
            data.prizeTitle || undefined,
          );
        }
      } catch {
        consecutiveErrorsRef.current += 1;
        if (!isWebSocketActive) {
          setIsConnected(false);
        }
      }
    },
    [handleWinnerAnnounced, isWebSocketActive, hasUserNumbers],
  );

  const enableAlert = useCallback(async () => {
    setIsEnabled(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("fashiondate_live_alert_enabled", "true");
      } catch {
        // Ignora restrições de storage
      }
    }
    playTick();
    await checkDraw(true);
  }, [playTick, checkDraw]);

  const silenceAlarm = useCallback(() => {
    setAlarmActive(false);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
    setAlarmActive(false);
    setWinningTicket(null);
  }, []);

  // Adaptive polling loop with visibility pause and backoff (active as backup)
  useEffect(() => {
    if (!hasUserNumbers) return;
    let isCancelled = false;

    const scheduleNextPoll = () => {
      if (isCancelled) return;

      // Base interval: 2.5s (or slightly relaxed if WebSocket is active)
      const baseDelay = isWebSocketActive
        ? 4500
        : 2200 + Math.floor(Math.random() * 400);
      const backoffMultiplier = Math.min(
        Math.pow(1.5, consecutiveErrorsRef.current),
        3.5,
      );
      const delay = Math.round(baseDelay * backoffMultiplier);

      pollingTimeoutRef.current = window.setTimeout(async () => {
        if (!isCancelled) {
          if (
            typeof document === "undefined" ||
            document.visibilityState !== "hidden"
          ) {
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
    winningTicket,
    activeDrawTitle,
    activePrizeTitle,
    enableAlert,
    silenceAlarm,
    dismissCelebration,
    triggerTest: () => {
      setWinningTicket(primaryTicket);
      setActiveDrawTitle(primaryTicket?.drawTitle || "Sorteio Oficial");
      setActivePrizeTitle(primaryTicket?.prizeTitle || "Prêmio Especial");
      celebrate("test", primaryNumber || "0000");
    },
  };
}
