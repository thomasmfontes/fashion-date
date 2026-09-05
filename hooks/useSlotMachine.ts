import { useState, useRef, useEffect, useCallback } from "react";
import type { SlotDigitState } from "@/types/draw.types";
import type { Participant } from "@/types/participant.types";
import { drawService } from "@/services/drawService";
import { useSoundFx } from "./useSoundFx";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSlotMachine(adminKey: string) {
  const [digits, setDigits] = useState<string[]>(["0", "0", "0", "0"]);
  const [lockedDigits, setLockedDigits] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isMuted, toggleMute, playTick, playLock, playVictory } = useSoundFx();
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef<boolean[]>([false, false, false, false]);
  const isMountedRef = useRef(true);
  const activeTimersRef = useRef<number[]>([]);
  const liveChannelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseBrowserClient>>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel("live-draw", {
      config: {
        broadcast: { ack: false },
      },
    });

    channel.subscribe();
    liveChannelRef.current = channel;

    return () => {
      if (liveChannelRef.current && supabase) {
        supabase.removeChannel(liveChannelRef.current);
        liveChannelRef.current = null;
      }
    };
  }, []);

  const cancelTimers = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    activeTimersRef.current.forEach((id) => window.clearTimeout(id));
    activeTimersRef.current = [];
  }, []);

  const delay = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        activeTimersRef.current = activeTimersRef.current.filter((id) => id !== timer);
        if (isMountedRef.current) {
          resolve();
        }
      }, ms);
      activeTimersRef.current.push(timer);
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelTimers();
    };
  }, [cancelTimers]);

  const triggerDraw = useCallback(
    async (
      targetUserTypes?: string[],
      maxNumber?: number | null,
      drawId?: string,
      drawTitle?: string,
      prizeTitle?: string,
    ) => {
      if (!adminKey || isRunning) return;

      setWinner(null);
      setError(null);
      setIsRunning(true);

      lockedRef.current = [false, false, false, false];
      setLockedDigits([false, false, false, false]);

      // Start rolling animation & tick sounds
      rollIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        setDigits((prev) =>
          prev.map((d, i) =>
            lockedRef.current[i] ? d : String(Math.floor(Math.random() * 10)),
          ),
        );
        playTick();
      }, 65);

      try {
        const response = await drawService.performDraw(
          adminKey,
          targetUserTypes,
          maxNumber,
          drawId,
        );
        if (!isMountedRef.current) return;
        if (!response || !response.winner) {
          throw new Error("Não foi possível realizar o sorteio.");
        }

        const rawLucky =
          response.winner.luckyNumber ||
          (response.winner.tickets && response.winner.tickets[0]?.ticketNumber) ||
          "";
        const targetNumber = String(rawLucky).padStart(4, "0");
        const targetDigits = targetNumber.split("");

        // 1. Initial Suspense Roll (Todos os 4 tambores girando juntos)
        await delay(2400);
        if (!isMountedRef.current) return;
        lockedRef.current = [true, false, false, false];
        setLockedDigits([true, false, false, false]);
        setDigits((prev) => [targetDigits[0], prev[1], prev[2], prev[3]]);
        playLock();

        // 2. Suspense para o 2º Dígito (Tambores 2, 3, 4 girando)
        await delay(1600);
        if (!isMountedRef.current) return;
        lockedRef.current = [true, true, false, false];
        setLockedDigits([true, true, false, false]);
        setDigits((prev) => [
          targetDigits[0],
          targetDigits[1],
          prev[2],
          prev[3],
        ]);
        playLock();

        // 3. Clímax para o 3º Dígito (Tambores 3 e 4 girando)
        await delay(1800);
        if (!isMountedRef.current) return;
        lockedRef.current = [true, true, true, false];
        setLockedDigits([true, true, true, false]);
        setDigits((prev) => [
          targetDigits[0],
          targetDigits[1],
          targetDigits[2],
          prev[3],
        ]);
        playLock();

        // 4. Clímax Máximo para o 4º Dígito Final (Apenas o último tambor girando)
        await delay(2200);
        if (!isMountedRef.current) return;
        lockedRef.current = [true, true, true, true];
        setLockedDigits([true, true, true, true]);
        setDigits(targetDigits);
        playLock();

        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;

        // Brevíssima fração (250ms) para fixação visual do último dígito no telão
        await delay(250);
        if (!isMountedRef.current) return;

        // 5. Apresentação do Vencedor e Vitória
        setWinner(response.winner);
        playVictory();

        // Transmissão Instantânea via WebSocket Direto (latência < 40ms)
        const effectiveTargetDrawId =
          (response as { targetDrawId?: string })?.targetDrawId || drawId || "";

        if (liveChannelRef.current) {
          liveChannelRef.current
            .send({
              type: "broadcast",
              event: "winner-announced",
              payload: {
                drawId: effectiveTargetDrawId,
                drawTitle: drawTitle || undefined,
                prizeTitle: prizeTitle || undefined,
                winnerNumber: targetNumber,
                timestamp: new Date().toISOString(),
              },
            })
            .catch((broadcastErr) => {
              console.warn("Direct WebSocket broadcast warning:", broadcastErr);
            });
        }

        // Concomitantemente, persiste o sorteio no backend sem travar a interface
        drawService
          .announceDraw(adminKey, response.drawId, effectiveTargetDrawId)
          .catch((announceErr) => {
            console.warn("Backend announcement sync warning:", announceErr);
          });
      } catch (err: unknown) {
      cancelTimers();
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Erro ao processar o sorteio.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsRunning(false);
      }
    }
  }, [adminKey, isRunning, playTick, playLock, playVictory, delay, cancelTimers]);

  const resetDraw = useCallback(() => {
    setWinner(null);
    setError(null);
    setDigits(["0", "0", "0", "0"]);
    lockedRef.current = [false, false, false, false];
    setLockedDigits([false, false, false, false]);
  }, []);

  const slotStates: SlotDigitState[] = digits.map((digit, idx) => ({
    digit,
    isSpinning: isRunning && !lockedDigits[idx],
    isLocked: lockedDigits[idx],
  }));

  return {
    digits,
    slotStates,
    lockedCount: lockedDigits.filter(Boolean).length,
    isRunning,
    winner,
    error,
    isMuted,
    toggleMute,
    triggerDraw,
    resetDraw,
  };
}
