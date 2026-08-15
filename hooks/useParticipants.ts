import { useState, useEffect, useMemo, useCallback } from "react";
import { participantService } from "@/services/participantService";
import { ApiError } from "@/services/apiClient";
import { exportParticipantsToCSV } from "@/utils/csvExport";
import type {
  Participant,
  StatusFilter,
  SortOption,
  ParticipantStats,
} from "@/types/participant.types";

export function useParticipants(
  adminKey: string,
  onUnauthorized?: () => void,
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [loading, setLoading] = useState(() => Boolean(adminKey));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!adminKey) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await participantService.getAll(adminKey);
      setParticipants(data.participants || []);
      const regState = data.registrationsOpen ?? data.settings?.registrationsOpen;
      if (typeof regState === "boolean") {
        setRegistrationsOpen(regState);
      }
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setError("Sua sessão expirou. Entre novamente para acessar o painel.");
        onUnauthorized?.();
      } else {
        setError("Não foi possível carregar os participantes. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, onUnauthorized]);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      if (!adminKey) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await participantService.getAll(adminKey);
        if (!isMounted) return;
        setParticipants(data.participants || []);
        const regState =
          data.registrationsOpen ?? data.settings?.registrationsOpen;
        if (typeof regState === "boolean") {
          setRegistrationsOpen(regState);
        }
      } catch (requestError) {
        if (!isMounted) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          setError("Sua sessão expirou. Entre novamente para acessar o painel.");
          onUnauthorized?.();
        } else {
          setError("Não foi possível carregar os participantes. Tente novamente.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [adminKey, onUnauthorized]);

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
    error,
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
