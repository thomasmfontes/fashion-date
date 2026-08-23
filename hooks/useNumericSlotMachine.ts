import { useState, useRef, useEffect, useCallback } from "react";
import type { NumericDrawConfig, NumericDrawWinner } from "@/types/numericDraw.types";
import type { SlotDigitState } from "@/types/draw.types";
import { useSoundFx } from "./useSoundFx";

const STORAGE_KEY_CONFIG = "fashiondate_numeric_draw_config";
const STORAGE_KEY_HISTORY = "fashiondate_numeric_draw_history";

const DEFAULT_CONFIG: NumericDrawConfig = {
  min: 0,
  max: 500,
  prizeTitle: "Prêmio Especial",
  eventName: "Sorteio Numérico",
  allowRepeat: false,
  digitCount: 3,
};

function getInitialConfig(): NumericDrawConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
}

function getInitialHistory(): NumericDrawWinner[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }
  return [];
}

export function useNumericSlotMachine() {
  const [config, setConfigState] = useState<NumericDrawConfig>(getInitialConfig);
  const [history, setHistory] = useState<NumericDrawWinner[]>(getInitialHistory);

  const digitCount = config.digitCount || Math.max(String(config.max).length, 3);
  const [digits, setDigits] = useState<string[]>(() => Array(digitCount).fill("0"));
  const [lockedDigits, setLockedDigits] = useState<boolean[]>(() => Array(digitCount).fill(false));
  const [isRunning, setIsRunning] = useState(false);
  const [winner, setWinner] = useState<NumericDrawWinner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isMuted, toggleMute, playTick, playLock, playVictory } = useSoundFx();
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef<boolean[]>(Array(digitCount).fill(false));
  const isMountedRef = useRef(true);
  const activeTimersRef = useRef<number[]>([]);

  // Update digit arrays if digitCount changes
  useEffect(() => {
    setDigits(Array(digitCount).fill("0"));
    setLockedDigits(Array(digitCount).fill(false));
    lockedRef.current = Array(digitCount).fill(false);
  }, [digitCount]);

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

  const updateConfig = useCallback((newConfig: Partial<NumericDrawConfig>) => {
    setConfigState((prev) => {
      const updated = { ...prev, ...newConfig };
      const computedDigits = Math.max(String(updated.max).length, 3);
      updated.digitCount = updated.digitCount || computedDigits;
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // ignore
    }
  }, []);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const triggerDraw = useCallback(async () => {
    if (isRunning) return;

    setError(null);
    setWinner(null);

    // Calculate eligible numbers
    const minVal = Number(config.min) || 0;
    const maxVal = Number(config.max) || 500;

    if (minVal > maxVal) {
      setError("O número mínimo não pode ser maior que o número máximo.");
      return;
    }

    const drawnSet = new Set(history.map((h) => Number(h.number)));
    const eligible: number[] = [];

    for (let n = minVal; n <= maxVal; n++) {
      if (config.allowRepeat || !drawnSet.has(n)) {
        eligible.push(n);
      }
    }

    if (eligible.length === 0) {
      setError("Todos os números do intervalo já foram sorteados! Limpe o histórico ou altere o intervalo.");
      return;
    }

    // Pick random eligible number
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const chosenNumber = eligible[randomIndex];
    const totalDigits = config.digitCount || Math.max(String(maxVal).length, 3);
    const targetString = String(chosenNumber).padStart(totalDigits, "0");
    const targetDigits = targetString.split("");

    setIsRunning(true);
    lockedRef.current = Array(totalDigits).fill(false);
    setLockedDigits(Array(totalDigits).fill(false));

    // Rolling animation & tick sound
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
      // 1. Initial Suspense Roll (All drums rolling)
      await delay(2200);
      if (!isMountedRef.current) return;

      // Progressively lock digits from left to right
      for (let i = 0; i < totalDigits; i++) {
        const nextLocked = [...lockedRef.current];
        nextLocked[i] = true;
        lockedRef.current = nextLocked;
        setLockedDigits([...nextLocked]);

        setDigits((prev) => {
          const updated = [...prev];
          for (let j = 0; j <= i; j++) {
            updated[j] = targetDigits[j];
          }
          return updated;
        });

        playLock();

        // Delay between locking subsequent digits
        if (i < totalDigits - 1) {
          const stepDelay = i === totalDigits - 2 ? 2000 : 1500;
          await delay(stepDelay);
          if (!isMountedRef.current) return;
        }
      }

      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }

      // 3. Clímax e Revelação do Vencedor
      await delay(900);
      if (!isMountedRef.current) return;

      const newWinner: NumericDrawWinner = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        number: targetString,
        prizeTitle: config.prizeTitle || "Prêmio da Rodada",
        eventName: config.eventName || "Sorteio Numérico",
        drawnAt: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setWinner(newWinner);
      setHistory((prev) => {
        const updated = [newWinner, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      playVictory();
    } catch (err: unknown) {
      cancelTimers();
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Erro ao processar o sorteio.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsRunning(false);
      }
    }
  }, [config, history, isRunning, playTick, playLock, playVictory, delay, cancelTimers]);

  const resetDraw = useCallback(() => {
    setWinner(null);
    setError(null);
    setDigits(Array(digitCount).fill("0"));
    lockedRef.current = Array(digitCount).fill(false);
    setLockedDigits(Array(digitCount).fill(false));
  }, [digitCount]);

  const slotStates: SlotDigitState[] = digits.map((digit, idx) => ({
    digit,
    isSpinning: isRunning && !lockedDigits[idx],
    isLocked: lockedDigits[idx],
  }));

  return {
    config,
    updateConfig,
    digits,
    slotStates,
    lockedCount: lockedDigits.filter(Boolean).length,
    isRunning,
    winner,
    history,
    error,
    isMuted,
    toggleMute,
    triggerDraw,
    resetDraw,
    clearHistory,
    removeHistoryItem,
  };
}
