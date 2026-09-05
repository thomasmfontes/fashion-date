import { APP_CONFIG } from "@/constants/config";
import { request } from "./apiClient";
import type { DrawSettings } from "@/types/draw.types";
import type { Participant } from "@/types/participant.types";
import type { DrawItem, CreateDrawDTO, UpdateDrawDTO } from "@/types/drawCollection.types";

export interface PerformDrawResponse {
  ok?: boolean;
  drawId: string;
  winner: Participant;
}

export const drawService = {
  /**
   * Fetches official draws from database.
   */
  async getDraws(): Promise<DrawItem[]> {
    try {
      const res = await request<{ ok: boolean; draws: DrawItem[] }>("/api/draws", {
        method: "GET",
      });
      return res.draws || [];
    } catch {
      return [];
    }
  },

  /**
   * Creates a new draw definition in database (Admin).
   */
  async createDraw(adminKey: string, dto: CreateDrawDTO): Promise<DrawItem> {
    const res = await request<{ ok: boolean; draw: DrawItem }>("/api/admin/draws", {
      method: "POST",
      adminKey,
      body: JSON.stringify(dto),
    });
    return res.draw;
  },

  /**
   * Updates an existing draw in database (Admin).
   */
  async updateDraw(adminKey: string, drawId: string, dto: UpdateDrawDTO): Promise<DrawItem> {
    const res = await request<{ ok: boolean; draw: DrawItem }>("/api/admin/draws", {
      method: "PATCH",
      adminKey,
      body: JSON.stringify({ drawId, ...dto }),
    });
    return res.draw;
  },

  /**
   * Deletes a draw from database (Admin).
   */
  async deleteDraw(adminKey: string, drawId: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/admin/draws?drawId=${encodeURIComponent(drawId)}`, {
      method: "DELETE",
      adminKey,
    });
  },

  /**
   * Updates registration open/closed status.
   */
  async updateSettings(
    adminKey: string,
    settings: Partial<DrawSettings>,
  ): Promise<DrawSettings> {
    return request<DrawSettings>(APP_CONFIG.api.adminSettings, {
      method: "POST",
      adminKey,
      body: JSON.stringify(settings),
    });
  },

  /**
   * Triggers a new draw to pick a winner with optional user type filtering and maximum number limit.
   */
  async performDraw(
    adminKey: string,
    targetUserTypes?: string[],
    maxNumber?: number | null,
    drawId?: string,
  ): Promise<PerformDrawResponse> {
    const hasTypes = Boolean(targetUserTypes && targetUserTypes.length > 0);
    const hasLimit = typeof maxNumber === "number" && maxNumber > 0;
    
    const bodyPayload = {
      ...(drawId ? { drawId } : {}),
      ...(hasTypes ? { targetUserTypes } : {}),
      ...(hasLimit ? { maxNumber } : {}),
    };

    return request<PerformDrawResponse>(APP_CONFIG.api.adminDraw, {
      method: "POST",
      adminKey,
      body: JSON.stringify(bodyPayload),
    });
  },

  /**
   * Publishes the selected result only after the telão finishes revealing it.
   */
  async announceDraw(
    adminKey: string,
    drawId: string,
    targetDrawId?: string,
  ): Promise<{
    ok: boolean;
    drawId: string;
    targetDrawId?: string;
    winnerNumber: string;
    drawTitle?: string;
    prizeTitle?: string;
  }> {
    return request<{
      ok: boolean;
      drawId: string;
      targetDrawId?: string;
      winnerNumber: string;
      drawTitle?: string;
      prizeTitle?: string;
    }>(APP_CONFIG.api.adminDraw, {
      method: "PATCH",
      adminKey,
      body: JSON.stringify({ drawId, targetDrawId }),
    });
  },



  /**
   * Checks how many eligible participants exist for a specific draw criteria (Admin).
   */
  async checkEligibility(
    adminKey: string,
    targetUserTypes?: string[],
    maxNumber?: number | null,
    drawId?: string,
  ): Promise<{ eligibleCount: number; hasEligible: boolean }> {
    try {
      const params = new URLSearchParams();
      if (drawId) params.set("drawId", drawId);
      if (targetUserTypes && targetUserTypes.length > 0) {
        params.set("targetUserTypes", targetUserTypes.join(","));
      }
      if (typeof maxNumber === "number" && maxNumber > 0) {
        params.set("maxNumber", String(maxNumber));
      }

      const queryString = params.toString();
      const url = `${APP_CONFIG.api.adminDraw}${queryString ? `?${queryString}` : ""}`;

      const res = await request<{ ok: boolean; eligibleCount: number; hasEligible: boolean }>(url, {
        method: "GET",
        adminKey,
      });

      return {
        eligibleCount: Number(res.eligibleCount || 0),
        hasEligible: Boolean(res.hasEligible),
      };
    } catch {
      return { eligibleCount: 1, hasEligible: true };
    }
  },
};
