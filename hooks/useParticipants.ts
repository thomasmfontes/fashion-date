import { useState, useEffect, useMemo, useCallback } from "react";
import { participantService } from "@/services/participantService";
import { drawService } from "@/services/drawService";
import { ApiError } from "@/services/apiClient";
import { exportParticipantsToCSV } from "@/utils/csvExport";
import type {
  Participant,
  DrawWinnerItem,
  StatusFilter,
  SortOption,
  ParticipantStats,
} from "@/types/participant.types";

export function useParticipants(
  adminKey: string,
  onUnauthorized?: () => void,
) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<DrawWinnerItem[]>([]);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [loading, setLoading] = useState(() => Boolean(adminKey));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [error, setError] = useState("");

  const availableUserTypes = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.userType) set.add(p.userType);
    });
    return Array.from(set);
  }, [participants]);

  const loadData = useCallback(async () => {
    if (!adminKey) {
      setParticipants([]);
      setWinners([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [data, winnersData] = await Promise.all([
        participantService.getAll(adminKey),
        participantService.getWinners(adminKey),
      ]);
      setParticipants(data.participants || []);
      setWinners(winnersData || []);
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
        setWinners([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [data, winnersData] = await Promise.all([
          participantService.getAll(adminKey),
          participantService.getWinners(adminKey),
        ]);
        if (!isMounted) return;
        setParticipants(data.participants || []);
        setWinners(winnersData || []);
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

    return {
      total: participants.length,
      today: registeredToday,
      winners: winners.length,
    };
  }, [participants, winners]);

  // Filtered & Sorted participants
  const filteredParticipants = useMemo(() => {
    let list = [...participants];

    if (statusFilter === "active") {
      list = list.filter((p) => !p.wonAt);
    } else if (statusFilter === "winner") {
      list = list.filter((p) => Boolean(p.wonAt));
    }

    if (userTypeFilter !== "all") {
      list = list.filter(
        (p) =>
          (p.userType || "lojista").toLowerCase() ===
          userTypeFilter.toLowerCase(),
      );
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.store.toLowerCase().includes(q) ||
          p.instagram.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.luckyNumber.includes(q) ||
          Boolean(p.tickets?.some((t) => t.ticketNumber.includes(q) || t.drawTitle.toLowerCase().includes(q))),
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
          return a.luckyNumber.localeCompare(b.luckyNumber);
        case "number-desc":
          return b.luckyNumber.localeCompare(a.luckyNumber);
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return list;
  }, [participants, statusFilter, userTypeFilter, query, sortBy]);

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

  const removeLocalWinner = useCallback((winnerId: number) => {
    setWinners((prev) => prev.filter((w) => w.id !== winnerId && w.winnerId !== winnerId));
  }, []);

  return {
    participants,
    filteredParticipants,
    winners,
    setWinners,
    stats,
    registrationsOpen,
    setRegistrationsOpen,
    loading,
    error,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    userTypeFilter,
    setUserTypeFilter,
    availableUserTypes,
    sortBy,
    setSortBy,
    exportToCSV,
    loadData,
    updateLocalParticipant,
    removeLocalParticipant,
    removeLocalWinner,
  };
}
