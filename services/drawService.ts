import { APP_CONFIG } from "@/constants/config";
import { request } from "./apiClient";
import type { DrawSettings } from "@/types/draw.types";
import type { Participant } from "@/types/participant.types";

export interface PerformDrawResponse {
  ok?: boolean;
  drawId: string;
  winner: Participant;
}

export const drawService = {
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
    maxNumber?: number | null
  ): Promise<PerformDrawResponse> {
    const hasTypes = Boolean(targetUserTypes && targetUserTypes.length > 0);
    const hasLimit = typeof maxNumber === "number" && maxNumber > 0;
    
    const bodyPayload = hasTypes || hasLimit
      ? {
          ...(hasTypes ? { targetUserTypes } : {}),
          ...(hasLimit ? { maxNumber } : {}),
        }
      : undefined;

    return request<PerformDrawResponse>(APP_CONFIG.api.adminDraw, {
      method: "POST",
      adminKey,
      body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
    });
  },

  /**
   * Publishes the selected result only after the telão finishes revealing it.
   */
  async announceDraw(
    adminKey: string,
    drawId: string,
  ): Promise<{ ok: boolean; drawId: string; winnerNumber: string }> {
    return request<{ ok: boolean; drawId: string; winnerNumber: string }>(
      APP_CONFIG.api.adminDraw,
      {
        method: "PATCH",
        adminKey,
        body: JSON.stringify({ drawId }),
      },
    );
  },
};
