import { useState, useEffect, useMemo, useCallback } from "react";
import { participantService } from "@/services/participantService";
import { drawService } from "@/services/drawService";
import { ApiError } from "@/services/apiClient";
import { exportParticipantsToCSV } from "@/utils/csvExport";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
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
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(true);

  const availableUserTypes = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.userType) set.add(p.userType);
    });
    return Array.from(set);
  }, [participants]);

  const loadData = useCallback(
    async (silent = false) => {
      if (!adminKey) {
        setParticipants([]);
        setWinners([]);
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const [data, winnersData] = await Promise.all([
          participantService.getAll(adminKey),
          participantService.getWinners(adminKey),
        ]);

        const newParticipants = data.participants || [];
        setParticipants((prev) => {
          if (
            prev.length === newParticipants.length &&
            JSON.stringify(prev) === JSON.stringify(newParticipants)
          ) {
            return prev;
          }
          return newParticipants;
        });

        const newWinners = winnersData || [];
        setWinners((prev) => {
          if (
            prev.length === newWinners.length &&
            JSON.stringify(prev) === JSON.stringify(newWinners)
          ) {
            return prev;
          }
          return newWinners;
        });

        const regState =
          data.registrationsOpen ?? data.settings?.registrationsOpen;
        if (typeof regState === "boolean") {
          setRegistrationsOpen(regState);
        }
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          setError("Sua sessão expirou. Entre novamente para acessar o painel.");
          onUnauthorized?.();
        } else if (!silent) {
          setError("Não foi possível carregar os participantes. Tente novamente.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [adminKey, onUnauthorized],
  );

  // 1. Supabase Realtime (WebSockets) para push instantâneo (<50ms)
  useEffect(() => {
    if (!adminKey) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel("admin-participants-sync", {
      config: {
        broadcast: { ack: false },
      },
    });

    channel
      .on("broadcast", { event: "participant-updated" }, () => {
        loadData(true);
      })
      .on("broadcast", { event: "winner-announced" }, () => {
        loadData(true);
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "t_participants" },
        () => {
          loadData(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "t_draw_tickets" },
        () => {
          loadData(true);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "t_draws" },
        () => {
          loadData(true);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLiveSyncActive(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsLiveSyncActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminKey, loadData]);

  // 2. Smart Polling contínuo em segundo plano (a cada 4.5s quando ativo, e ao focar na aba)
  useEffect(() => {
    if (!adminKey) return;

    // Carregamento inicial explícito com loader
    loadData(false);

    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        loadData(true);
      }
    }, 4500);

    const handleVisibilityOrFocus = () => {
      if (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
      ) {
        loadData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [adminKey, loadData]);

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
    isLiveSyncActive,
    loadData,
    updateLocalParticipant,
    removeLocalParticipant,
    removeLocalWinner,
  };
}
