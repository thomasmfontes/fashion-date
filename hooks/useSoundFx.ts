import { useState, useRef, useCallback } from "react";
import { SoundSynthesizer } from "@/utils/audio";
import { STORAGE_KEYS } from "@/constants/storageKeys";

export function useSoundFx() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEYS.soundMuted) === "true";
    } catch {
      return false;
    }
  });

  const soundRef = useRef<SoundSynthesizer | null>(null);

  const getSound = useCallback((): SoundSynthesizer | null => {
    if (typeof window === "undefined") return null;
    if (soundRef.current === null) {
      soundRef.current = new SoundSynthesizer(isMuted);
    }
    return soundRef.current;
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      const sound = getSound();
      if (sound) {
        sound.isMuted = next;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.soundMuted, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, [getSound]);

  const playTick = useCallback(() => getSound()?.playTick(), [getSound]);
  const playLock = useCallback(() => getSound()?.playLock(), [getSound]);
  const playVictory = useCallback(() => getSound()?.playVictory(), [getSound]);
  const playAlarmSiren = useCallback(
    () => getSound()?.playAlarmSiren(),
    [getSound],
  );

  return {
    isMuted,
    toggleMute,
    playTick,
    playLock,
    playVictory,
    playAlarmSiren,
  };
}
