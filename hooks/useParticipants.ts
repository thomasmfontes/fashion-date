import { useState, useEffect, useMemo, useCallback } from "react";
import { participantService } from "@/services/participantService";
import { exportParticipantsToCSV } from "@/utils/csvExport";
import type {
  Participant,
  StatusFilter,
  SortOption,
  ParticipantStats,
} from "@/types/participant.types";

export function useParticipants(adminKey: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [loading, setLoading] = useState(() => Boolean(adminKey));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const loadData = useCallback(async () => {
    if (!adminKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await participantService.getAll(adminKey);
      setParticipants(data.participants || []);
      const regState = data.registrationsOpen ?? data.settings?.registrationsOpen;
      if (typeof regState === "boolean") {
        setRegistrationsOpen(regState);
      }
    } catch {
      // Error handled by caller
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    let isMounted = true;
    if (!adminKey) return;

    participantService
      .getAll(adminKey)
      .then((data) => {
        if (!isMounted) return;
        setParticipants(data.participants || []);
        const regState = data.registrationsOpen ?? data.settings?.registrationsOpen;
        if (typeof regState === "boolean") {
          setRegistrationsOpen(regState);
        }
      })
      .catch(() => {
        // error handling
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [adminKey]);

  // Derived statistics
  const stats: ParticipantStats = useMemo(() => {
    const today = new Date().toDateString();
    const registeredToday = participants.filter(
      (p) => new Date(p.createdAt).toDateString() === today,
    ).length;
    const totalWinners = participants.filter((p) => Boolean(p.wonAt)).length;

    return {
      total: participants.length,
      today: registeredToday,
      winners: totalWinners,
    };
  }, [participants]);

  // Filtered & Sorted participants
  const filteredParticipants = useMemo(() => {
    let list = [...participants];

    if (statusFilter === "active") {
      list = list.filter((p) => !p.wonAt);
    } else if (statusFilter === "winner") {
      list = list.filter((p) => Boolean(p.wonAt));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.store.toLowerCase().includes(q) ||
          p.instagram.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          String(p.luckyNumber).includes(q),
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name-asc":
          return a.name.localeCompare(b.name, "pt-BR");
        case "name-desc":
          return b.name.localeCompare(a.name, "pt-BR");
        case "number-asc":
          return a.luckyNumber - b.luckyNumber;
        case "number-desc":
          return b.luckyNumber - a.luckyNumber;
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return list;
  }, [participants, statusFilter, query, sortBy]);

  // Export helper
  const exportToCSV = useCallback(() => {
    exportParticipantsToCSV(filteredParticipants);
  }, [filteredParticipants]);

  const updateLocalParticipant = useCallback(
    (updated: {
      id: number;
      name: string;
      store: string;
      phone: string;
      instagram: string;
    }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
      );
    },
    [],
  );

  const removeLocalParticipant = useCallback((id: number) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    participants,
    filteredParticipants,
    stats,
    registrationsOpen,
    setRegistrationsOpen,
    loading,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    exportToCSV,
    loadData,
    updateLocalParticipant,
    removeLocalParticipant,
  };
}
