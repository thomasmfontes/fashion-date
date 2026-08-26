"use client";

import { useState, useEffect, useCallback } from "react";
import type { DrawItem, CreateDrawDTO, UpdateDrawDTO } from "@/types/drawCollection.types";
import type { UserType } from "@/types/participant.types";

const STORAGE_KEY_COLLECTION = "fashiondate_draw_collection_v2";
const STORAGE_KEY_ACTIVE_ID = "fashiondate_active_draw_id_v2";

const INITIAL_DRAWS: DrawItem[] = [
  {
    id: "draw-provador-1",
    title: "1ª Rodada · Provador Fashion",
    prizeTitle: "Vaga Especial no Provador Fashion",
    targetUserTypes: ["lojista"],
    status: "ready",
    order: 1,
    createdAt: "2026-08-24T00:00:00.000Z",
  },
  {
    id: "draw-look-geral",
    title: "Sorteio · Look Completo Crente Chic",
    prizeTitle: "Look Completo Crente Chic",
    targetUserTypes: ["lojista", "influencer", "visitante", "vip"],
    status: "ready",
    order: 2,
    createdAt: "2026-08-24T00:00:00.000Z",
  },
  {
    id: "draw-bolsa-luxo",
    title: "Sorteio Especial · Bolsa de Luxo",
    prizeTitle: "Bolsa de Luxo Exclusiva",
    targetUserTypes: ["visitante", "influencer", "vip"],
    status: "ready",
    order: 3,
    createdAt: "2026-08-24T00:00:00.000Z",
  },
  {
    id: "draw-provador-final",
    title: "Grande Final · Provador Fashion",
    prizeTitle: "Grande Prêmio Provador Fashion",
    targetUserTypes: ["lojista"],
    status: "ready",
    order: 4,
    createdAt: "2026-08-24T00:00:00.000Z",
  },
];

export function useDrawCollection() {
  const [draws, setDraws] = useState<DrawItem[]>(INITIAL_DRAWS);
  const [activeDrawId, setActiveDrawId] = useState<string>(INITIAL_DRAWS[0].id);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage safely on client mount
  useEffect(() => {
    try {
      const savedCollection = localStorage.getItem(STORAGE_KEY_COLLECTION);
      if (savedCollection) {
        const parsed = JSON.parse(savedCollection);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDraws(parsed);
        }
      }

      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId) {
        setActiveDrawId(savedId);
      }
    } catch {}
    setIsHydrated(true);
  }, []);

  // Save collection changes to localStorage
  const saveCollection = useCallback((items: DrawItem[]) => {
    setDraws(items);
    try {
      localStorage.setItem(STORAGE_KEY_COLLECTION, JSON.stringify(items));
    } catch {}
  }, []);

  // Set active draw
  const selectActiveDraw = useCallback(
    (drawId: string) => {
      const target = draws.find((d) => d.id === drawId);
      if (!target) return;

      setActiveDrawId(drawId);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, drawId);
      } catch {}
    },
    [draws]
  );

  // Add new draw to collection
  const createDraw = useCallback(
    (dto: CreateDrawDTO) => {
      const newDraw: DrawItem = {
        id: `draw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: dto.title.trim() || "Novo Sorteio",
        prizeTitle: dto.prizeTitle.trim() || "Prêmio Especial",
        targetUserTypes:
          dto.targetUserTypes && dto.targetUserTypes.length > 0
            ? dto.targetUserTypes
            : ["lojista", "influencer", "visitante", "vip"],
        hasNumberLimit: Boolean(dto.hasNumberLimit),
        maxNumber: dto.hasNumberLimit && dto.maxNumber ? Number(dto.maxNumber) : null,
        status: "ready",
        order: draws.length + 1,
        createdAt: new Date().toISOString(),
      };

      const updated = [...draws, newDraw];
      saveCollection(updated);
      return newDraw;
    },
    [draws, saveCollection]
  );

  // Update existing draw
  const updateDraw = useCallback(
    (drawId: string, dto: UpdateDrawDTO) => {
      const updated = draws.map((item) => {
        if (item.id !== drawId) return item;
        return {
          ...item,
          ...dto,
          title: dto.title !== undefined ? dto.title.trim() : item.title,
          prizeTitle: dto.prizeTitle !== undefined ? dto.prizeTitle.trim() : item.prizeTitle,
          targetUserTypes:
            dto.targetUserTypes && dto.targetUserTypes.length > 0
              ? dto.targetUserTypes
              : item.targetUserTypes,
          hasNumberLimit:
            dto.hasNumberLimit !== undefined
              ? Boolean(dto.hasNumberLimit)
              : item.hasNumberLimit,
          maxNumber:
            dto.hasNumberLimit === false
              ? null
              : dto.maxNumber !== undefined
                ? (dto.maxNumber ? Number(dto.maxNumber) : null)
                : item.maxNumber,
        };
      });

      saveCollection(updated);
    },
    [draws, saveCollection]
  );

  // Delete draw from collection
  const deleteDraw = useCallback(
    (drawId: string) => {
      if (draws.length <= 1) {
        alert("O acervo deve ter pelo menos um sorteio configurado.");
        return;
      }

      const updated = draws.filter((d) => d.id !== drawId);
      saveCollection(updated);

      if (activeDrawId === drawId) {
        selectActiveDraw(updated[0].id);
      }
    },
    [draws, activeDrawId, saveCollection, selectActiveDraw]
  );

  // Duplicate a draw
  const duplicateDraw = useCallback(
    (drawId: string) => {
      const source = draws.find((d) => d.id === drawId);
      if (!source) return;

      const duplicated: DrawItem = {
        ...source,
        id: `draw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: `${source.title} (Cópia)`,
        status: "ready",
        winnerSummary: undefined,
        order: draws.length + 1,
        createdAt: new Date().toISOString(),
      };

      const updated = [...draws, duplicated];
      saveCollection(updated);
    },
    [draws, saveCollection]
  );

  const activeDraw = draws.find((d) => d.id === activeDrawId) || draws[0];

  return {
    draws,
    activeDraw,
    activeDrawId,
    isHydrated,
    selectActiveDraw,
    createDraw,
    updateDraw,
    deleteDraw,
    duplicateDraw,
  };
}
