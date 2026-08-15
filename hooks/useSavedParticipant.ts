import { useSyncExternalStore, useCallback } from "react";
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

export function useSavedParticipant() {
  const rawData = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  let savedParticipant: Participant | null = null;
  if (rawData) {
    try {
      savedParticipant = JSON.parse(rawData) as Participant;
    } catch {
      savedParticipant = null;
    }
  }

  const saveParticipant = useCallback((participant: Participant) => {
    try {
      const json = JSON.stringify(participant);
      localStorage.setItem(STORAGE_KEYS.registeredUser, json);
      sessionStorage.setItem(STORAGE_KEYS.userParticipant, json);
      window.dispatchEvent(new Event(STORAGE_EVENT));
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

  const lookupByPhone = useCallback(
    async (phone: string): Promise<Participant> => {
      const res = await participantService.lookupByPhone(phone);
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
