import { useSyncExternalStore, useCallback, useMemo, useEffect } from "react";
import type { Participant } from "@/types/participant.types";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { participantService } from "@/services/participantService";

// Helper to notify listeners of local storage changes across tabs and within the same tab
const STORAGE_EVENT = "fashion_date_participant_change";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.registeredUser) ||
      sessionStorage.getItem(STORAGE_KEYS.userParticipant) ||
      ""
    );
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

// Throttle lookupByPhone to avoid hitting rate limits on re-renders
const lastValidatedMap = new Map<string, number>();

export function useSavedParticipant() {
  const rawData = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const savedParticipant = useMemo<Participant | null>(() => {
    if (!rawData) return null;
    try {
      return JSON.parse(rawData) as Participant;
    } catch {
      return null;
    }
  }, [rawData]);

  const saveParticipant = useCallback((participant: Participant) => {
    try {
      const json = JSON.stringify(participant);
      const existing = localStorage.getItem(STORAGE_KEYS.registeredUser);
      if (existing !== json) {
        localStorage.setItem(STORAGE_KEYS.registeredUser, json);
        sessionStorage.setItem(STORAGE_KEYS.userParticipant, json);
        window.dispatchEvent(new Event(STORAGE_EVENT));
      }
    } catch {
      // storage quota or private mode
    }
  }, []);

  const clearParticipant = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.registeredUser);
      sessionStorage.removeItem(STORAGE_KEYS.userParticipant);
      window.dispatchEvent(new Event(STORAGE_EVENT));
    } catch {
      // ignore
    }
  }, []);

  // Auto-validate cached participant against database on mount (once per minute per phone)
  useEffect(() => {
    if (!savedParticipant) return;
    const currentPhone = savedParticipant.phone;
    if (!currentPhone) {
      clearParticipant();
      return;
    }

    const now = Date.now();
    const lastValidated = lastValidatedMap.get(currentPhone) || 0;
    if (now - lastValidated < 60000) {
      return;
    }
    lastValidatedMap.set(currentPhone, now);

    let active = true;

    participantService
      .lookupByPhone(currentPhone)
      .then((res) => {
        if (!active) return;
        if (res.ok && res.participant) {
          // Only update if properties differ (e.g. synced userType)
          if (
            res.participant.id !== savedParticipant.id ||
            res.participant.userType !== savedParticipant.userType ||
            res.participant.luckyNumber !== savedParticipant.luckyNumber ||
            res.participant.name !== savedParticipant.name
          ) {
            saveParticipant(res.participant);
          }
        } else {
          clearParticipant();
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const status = typeof err === "object" && err !== null && "status" in err
          ? (err as { status: number }).status
          : 0;
        const msg = err instanceof Error ? err.message : String(err);

        // If participant was deleted from DB (404 / not found), purge local session immediately
        if (status === 404 || msg.includes("não encontrada") || msg.includes("Nenhuma inscrição")) {
          clearParticipant();
        }
      });

    return () => {
      active = false;
    };
  }, [savedParticipant, clearParticipant, saveParticipant]);

  const lookupByPhone = useCallback(
    async (queryPhone: string): Promise<Participant> => {
      const res = await participantService.lookupByPhone(queryPhone);
      if (!res.ok || !res.participant) {
        throw new Error("Inscrição não encontrada para este WhatsApp.");
      }
      saveParticipant(res.participant);
      return res.participant;
    },
    [saveParticipant],
  );

  return {
    savedParticipant,
    hasSavedParticipant: Boolean(savedParticipant),
    saveParticipant,
    clearParticipant,
    lookupByPhone,
  };
}
