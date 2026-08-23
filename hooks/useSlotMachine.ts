import { useState, useRef, useEffect, useCallback } from "react";
import type { SlotDigitState } from "@/types/draw.types";
import type { Participant } from "@/types/participant.types";
import { drawService } from "@/services/drawService";
import { useSoundFx } from "./useSoundFx";

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

  const triggerDraw = useCallback(async () => {
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
      const response = await drawService.performDraw(adminKey);
      if (!isMountedRef.current) return;
      if (!response || !response.winner) {
        throw new Error("Não foi possível realizar o sorteio.");
      }

      const targetNumber = String(response.winner.luckyNumber).padStart(4, "0");
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

      // 5. Pausa de suspense e leitura antes da grande explosão de vitória e confetes
      await delay(1100);
      if (!isMountedRef.current) return;
      setWinner(response.winner);
      playVictory();

      // The phones must only receive the result after the winner is visible
      // on the telão. The polling clients react to this explicit publication.
      await delay(500);
      if (!isMountedRef.current) return;
      let announced = false;
      for (let attempt = 0; attempt < 3 && !announced && isMountedRef.current; attempt += 1) {
        try {
          await drawService.announceDraw(adminKey, response.drawId);
          announced = true;
        } catch {
          if (attempt < 2 && isMountedRef.current) {
            await delay(700);
          }
        }
      }
      if (!announced && isMountedRef.current) {
        setError(
          "O vencedor foi exibido, mas o aviso aos celulares não foi enviado. Verifique a conexão antes do próximo sorteio.",
        );
      }
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
