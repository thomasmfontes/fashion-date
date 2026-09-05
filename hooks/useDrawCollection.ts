"use client";

import { useState, useEffect, useCallback } from "react";
import type { DrawItem, CreateDrawDTO, UpdateDrawDTO } from "@/types/drawCollection.types";
import { drawService } from "@/services/drawService";

const STORAGE_KEY_COLLECTION = "fashiondate_draw_collection_v3";
const STORAGE_KEY_ACTIVE_ID = "fashiondate_active_draw_id_v3";

export function useDrawCollection(adminKey?: string) {
  const [draws, setDraws] = useState<DrawItem[]>([]);
  const [activeDrawId, setActiveDrawId] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with storage on mount and then DB
  useEffect(() => {
    let active = true;

    try {
      const cached = localStorage.getItem(STORAGE_KEY_COLLECTION);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDraws(parsed);
          const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
          const validActive = parsed.find((d: DrawItem) => d.id === savedActiveId);
          setActiveDrawId(validActive ? validActive.id : parsed[0].id);
        }
      }
    } catch {
      /* ignore storage read errors */
    }

    drawService.getDraws().then((dbDraws) => {
      if (!active) return;
      if (Array.isArray(dbDraws)) {
        setDraws(dbDraws);
        try {
          localStorage.setItem(STORAGE_KEY_COLLECTION, JSON.stringify(dbDraws));
        } catch {
          /* ignore storage quota */
        }

        if (dbDraws.length > 0) {
          const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
          const validActive = dbDraws.find((d) => d.id === savedActiveId);
          const nextActive = validActive ? validActive.id : dbDraws[0].id;
          setActiveDrawId(nextActive);
          try {
            localStorage.setItem(STORAGE_KEY_ACTIVE_ID, nextActive);
          } catch {
            /* ignore storage quota */
          }
        }
      }
      setIsHydrated(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // Set active draw
  const selectActiveDraw = useCallback(
    (drawId: string) => {
      const target = draws.find((d) => d.id === drawId);
      if (!target) return;

      setActiveDrawId(drawId);
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, drawId);
      } catch {
        /* ignore storage quota */
      }
    },
    [draws],
  );

  // Add new draw to collection (persisted in DB if adminKey is provided)
  const createDraw = useCallback(
    async (dto: CreateDrawDTO) => {
      let created: DrawItem;
      if (adminKey) {
        created = await drawService.createDraw(adminKey, dto);
      } else {
        created = {
          id: `draw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: dto.title.trim() || "Novo Sorteio",
          prizeTitle: dto.prizeTitle.trim() || "Prêmio Especial",
          targetUserTypes:
            dto.targetUserTypes && dto.targetUserTypes.length > 0
              ? dto.targetUserTypes
              : ["lojista", "revendedor", "influencer", "visitante"],
          hasNumberLimit: Boolean(dto.hasNumberLimit),
          maxNumber: dto.hasNumberLimit && dto.maxNumber ? Number(dto.maxNumber) : null,
          status: "ready",
          order: draws.length + 1,
          createdAt: new Date().toISOString(),
        };
      }

      setDraws((prev) => [...prev, created]);
      if (!activeDrawId) {
        setActiveDrawId(created.id);
      }
      return created;
    },
    [adminKey, draws.length, activeDrawId],
  );

  // Update existing draw in DB
  const updateDraw = useCallback(
    async (drawId: string, dto: UpdateDrawDTO) => {
      if (adminKey) {
        try {
          await drawService.updateDraw(adminKey, drawId, dto);
        } catch (err) {
          console.error("Erro ao atualizar sorteio no banco:", err);
        }
      }

      setDraws((prev) =>
        prev.map((item) => {
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
        }),
      );
    },
    [adminKey],
  );

  // Delete draw from DB
  const deleteDraw = useCallback(
    async (drawId: string) => {
      if (adminKey) {
        try {
          await drawService.deleteDraw(adminKey, drawId);
        } catch (err) {
          console.error("Erro ao deletar sorteio no banco:", err);
        }
      }

      setDraws((prev) => {
        const updated = prev.filter((d) => d.id !== drawId);
        if (activeDrawId === drawId && updated.length > 0) {
          setActiveDrawId(updated[0].id);
        }
        return updated;
      });
    },
    [adminKey, activeDrawId],
  );

  // Duplicate a draw
  const duplicateDraw = useCallback(
    async (drawId: string) => {
      const source = draws.find((d) => d.id === drawId);
      if (!source) return;

      const dto: CreateDrawDTO = {
        title: `${source.title} (Cópia)`,
        prizeTitle: source.prizeTitle,
        targetUserTypes: source.targetUserTypes,
        hasNumberLimit: source.hasNumberLimit,
        maxNumber: source.maxNumber,
      };

      await createDraw(dto);
    },
    [draws, createDraw],
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

