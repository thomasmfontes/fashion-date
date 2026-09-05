"use client";

import { useSyncExternalStore, useCallback, useMemo, useEffect } from "react";
import type { DrawItem } from "@/types/drawCollection.types";
import type { ParticipantTicket, UserType } from "@/types/participant.types";
import { useSavedParticipant } from "./useSavedParticipant";
import { useDrawCollection } from "./useDrawCollection";
import { ticketService } from "@/services/ticketService";

const TICKET_EVENT = "fashiondate_ticket_wallet_change";

function getWalletStorageKey(participantKey: string | number) {
  return `fashiondate_tickets_${participantKey}`;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(TICKET_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TICKET_EVENT, callback);
  };
}

export function useParticipantWallet() {
  const { savedParticipant } = useSavedParticipant();
  const { draws } = useDrawCollection();

  const participantKey = savedParticipant
    ? String(savedParticipant.id || savedParticipant.phone || "guest")
    : "guest";

  const getSnapshot = useCallback((): string => {
    if (typeof window === "undefined" || !savedParticipant) return "[]";
    try {
      const stored = localStorage.getItem(getWalletStorageKey(participantKey));
      if (stored) return stored;
    } catch {
      /* ignore storage read error */
    }
    return "[]";
  }, [savedParticipant, participantKey]);

  const getServerSnapshot = useCallback(() => "[]", []);

  const rawTickets = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const tickets = useMemo<ParticipantTicket[]>(() => {
    try {
      const parsed = JSON.parse(rawTickets);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawTickets]);

  const userType: UserType = savedParticipant?.userType || "lojista";
  const eligibleDraws = useMemo(() => {
    return draws.filter((draw) => {
      if (!draw.targetUserTypes || draw.targetUserTypes.length === 0) return true;
      return draw.targetUserTypes.includes(userType);
    });
  }, [draws, userType]);

  // Sync with database on mount or when participant changes
  const pId = savedParticipant?.id;
  const pPhone = savedParticipant?.phone;
  useEffect(() => {
    if (!savedParticipant) return;
    let active = true;

    ticketService
      .getParticipantTickets({
        participantId: pId,
        phone: pPhone,
      })
      .then((dbTickets) => {
        if (!active) return;
        const currentTickets = Array.isArray(dbTickets) ? dbTickets : [];

        try {
          const storageKey = getWalletStorageKey(participantKey);
          const currentStored = localStorage.getItem(storageKey);
          const newJson = JSON.stringify(currentTickets);
          if (currentStored !== newJson) {
            localStorage.setItem(storageKey, newJson);
            window.dispatchEvent(new Event(TICKET_EVENT));
          }
        } catch {
          /* ignore storage write error */
        }
      })
      .catch(() => {
        // Keeps local storage fallback if network is slow
      });

    return () => {
      active = false;
    };
  }, [savedParticipant, pId, pPhone, participantKey]);

  const getTicket = useCallback(
    (drawId: string): ParticipantTicket | undefined => {
      return tickets.find((t) => t.drawId === drawId);
    },
    [tickets],
  );

  const hasTicket = useCallback(
    (drawId: string): boolean => {
      return tickets.some((t) => t.drawId === drawId);
    },
    [tickets],
  );

  const enterDraw = useCallback(
    async (draw: DrawItem): Promise<ParticipantTicket | null> => {
      if (!savedParticipant) return null;

      const existing = tickets.find((t) => t.drawId === draw.id);
      if (existing) return existing;

      try {
        // 1. Issue official ticket in PostgreSQL database
        const officialTicket = await ticketService.enterDraw({
          drawId: draw.id,
          participantId: savedParticipant.id,
          phone: savedParticipant.phone,
        });

        // 2. Update local state and storage
        const updated = [...tickets.filter((t) => t.drawId !== draw.id), officialTicket];
        try {
          localStorage.setItem(
            getWalletStorageKey(participantKey),
            JSON.stringify(updated),
          );
          window.dispatchEvent(new Event(TICKET_EVENT));
        } catch {
          /* ignore storage write error */
        }

        return officialTicket;
      } catch (err) {
        const isForbidden =
          (typeof err === "object" && err !== null && "status" in err && (err as { status: number }).status === 403) ||
          (err instanceof Error && err.message.includes("exclusivo para outras categorias"));

        if (isForbidden) {
          console.warn("Participante não é elegível para este sorteio:", err instanceof Error ? err.message : err);
          return null;
        }

        console.error("Erro ao emitir bilhete no banco:", err);
        // Fallback local if DB error occurs
        let ticketNumStr = "";
        if (draw.hasNumberLimit && draw.maxNumber && draw.maxNumber > 0) {
          const randomInRange = Math.floor(Math.random() * draw.maxNumber) + 1;
          ticketNumStr = String(randomInRange).padStart(4, "0");
        } else {
          const randomInRange = Math.floor(Math.random() * 9000) + 1000;
          ticketNumStr = String(randomInRange).padStart(4, "0");
        }

        const fallbackTicket: ParticipantTicket = {
          drawId: draw.id,
          drawTitle: draw.title,
          prizeTitle: draw.prizeTitle,
          ticketNumber: ticketNumStr,
          enteredAt: new Date().toISOString(),
        };

        const updated = [...tickets, fallbackTicket];
        try {
          localStorage.setItem(
            getWalletStorageKey(participantKey),
            JSON.stringify(updated),
          );
          window.dispatchEvent(new Event(TICKET_EVENT));
        } catch {
          /* ignore storage write error */
        }

        return fallbackTicket;
      }
    },
    [savedParticipant, tickets, participantKey],
  );

  return {
    savedParticipant,
    tickets,
    eligibleDraws,
    allDraws: draws,
    hasTicket,
    getTicket,
    enterDraw,
  };
}

