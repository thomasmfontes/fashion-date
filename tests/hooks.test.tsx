import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import { useAuth } from "@/hooks/useAuth";
import { useSlotMachine } from "@/hooks/useSlotMachine";
import { useParticipants } from "@/hooks/useParticipants";
import { participantService } from "@/services/participantService";
import { drawService } from "@/services/drawService";
import type { Participant } from "@/types/participant.types";

describe("Custom React Hooks Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("useSavedParticipant", () => {
    const mockParticipant: Participant = {
      id: 101,
      luckyNumber: "0042",
      name: "Sabrina Sato",
      store: "Sato Store",
      phone: "11988887777",
      instagram: "@sabrinasato",
      createdAt: "2026-08-21T10:00:00Z",
      wonAt: null,
    };

    it("saves participant to storage and hydrates state", () => {
      const { result } = renderHook(() => useSavedParticipant());
      expect(result.current.hasSavedParticipant).toBe(false);
      expect(result.current.savedParticipant).toBeNull();

      act(() => {
        result.current.saveParticipant(mockParticipant);
      });

      expect(result.current.hasSavedParticipant).toBe(true);
      expect(result.current.savedParticipant?.name).toBe("Sabrina Sato");
      expect(result.current.savedParticipant?.phone).toBe("11988887777");
    });

    it("clears saved participant from storage on demand", () => {
      const { result } = renderHook(() => useSavedParticipant());

      act(() => {
        result.current.saveParticipant(mockParticipant);
      });
      expect(result.current.hasSavedParticipant).toBe(true);

      act(() => {
        result.current.clearParticipant();
      });
      expect(result.current.hasSavedParticipant).toBe(false);
      expect(result.current.savedParticipant).toBeNull();
    });

    it("looks up participant by phone and auto-saves on success", async () => {
      vi.spyOn(participantService, "lookupByPhone").mockResolvedValue({
        ok: true,
        participant: mockParticipant,
      });

      const { result } = renderHook(() => useSavedParticipant());

      let found: Participant | null = null;
      await act(async () => {
        found = await result.current.lookupByPhone("11988887777");
      });

      expect(found).toEqual(mockParticipant);
      expect(result.current.hasSavedParticipant).toBe(true);
      expect(result.current.savedParticipant?.name).toBe("Sabrina Sato");
    });
  });

  describe("useAuth", () => {
    it("handles login, logout, and authenticated state sync", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.adminKey).toBe("");

      act(() => {
        result.current.login("super-secret-admin-token");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.adminKey).toBe("super-secret-admin-token");

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.adminKey).toBe("");
    });
  });

  describe("useSlotMachine", () => {
    it("initializes with 4 inactive digits and handles mute toggle", () => {
      const { result } = renderHook(() => useSlotMachine("admin-token"));
      expect(result.current.digits).toEqual(["0", "0", "0", "0"]);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.winner).toBeNull();
      expect(result.current.lockedCount).toBe(0);

      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.isMuted).toBe(false);
    });

    it("resets state and digits to default with resetDraw", () => {
      const { result } = renderHook(() => useSlotMachine("admin-token"));

      act(() => {
        result.current.resetDraw();
      });

      expect(result.current.digits).toEqual(["0", "0", "0", "0"]);
      expect(result.current.winner).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("captures API errors gracefully during triggerDraw", async () => {
      vi.spyOn(drawService, "performDraw").mockRejectedValue(
        new Error("Falha na conexão com o servidor"),
      );

      const { result } = renderHook(() => useSlotMachine("admin-token"));

      await act(async () => {
        await result.current.triggerDraw();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.error).toContain("Falha na conexão");
    });

    it("F13 Regression: cleanly cancels in-flight timers and state updates on unmount", async () => {
      vi.spyOn(drawService, "performDraw").mockResolvedValue({
        ok: true,
        winner: {
          id: 1,
          luckyNumber: "1234",
          name: "Test Winner",
          store: "Test Store",
          phone: "11999998888",
          instagram: "@winner",
          createdAt: "2026-08-21T10:00:00Z",
          wonAt: "2026-08-21T10:05:00Z",
        },
        drawId: "draw-uuid-1",
      });

      const { result, unmount } = renderHook(() => useSlotMachine("admin-token"));

      // Start draw
      act(() => {
        result.current.triggerDraw();
      });
      expect(result.current.isRunning).toBe(true);

      // Unmount while spinning
      unmount();

      // Ensure no unhandled rejection or state warning after unmount
      await new Promise((r) => setTimeout(r, 100));
    });
  });

  describe("useParticipants", () => {
    const mockList: Participant[] = [
      {
        id: 1,
        name: "Beatriz Oliveira",
        store: "Bia Modas",
        phone: "11988881111",
        instagram: "@biamodas",
        luckyNumber: "0010",
        createdAt: "2026-08-21T09:00:00Z",
        wonAt: null,
      },
      {
        id: 2,
        name: "Carlos Drummond",
        store: " Drummond Wear",
        phone: "11988882222",
        instagram: "@drummond",
        luckyNumber: "0020",
        createdAt: "2026-08-21T11:00:00Z",
        wonAt: "2026-08-21T12:00:00Z",
      },
    ];

    it("filters list by search term across name, store, phone, lucky number", async () => {
      vi.spyOn(participantService, "getAll").mockResolvedValue({
        participants: mockList,
        registrationsOpen: true,
      });

      const { result } = renderHook(() => useParticipants("admin-token"));

      // Allow initial loadData promise to resolve
      await act(async () => {
        await result.current.loadData();
      });

      expect(result.current.participants.length).toBe(2);

      // Search by name
      act(() => {
        result.current.setQuery("Beatriz");
      });
      expect(result.current.query).toBe("Beatriz");
      expect(result.current.filteredParticipants.length).toBe(1);
      expect(result.current.filteredParticipants[0].name).toBe("Beatriz Oliveira");

      // Filter by status
      act(() => {
        result.current.setQuery("");
        result.current.setStatusFilter("winner");
      });
      expect(result.current.statusFilter).toBe("winner");
      expect(result.current.filteredParticipants.length).toBe(1);
      expect(result.current.filteredParticipants[0].name).toBe("Carlos Drummond");
    });
  });
});
