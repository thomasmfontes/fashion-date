import { APP_CONFIG } from "@/constants/config";
import { request } from "./apiClient";
import type { DrawRecord, DrawSettings } from "@/types/draw.types";
import type { Participant } from "@/types/participant.types";

export interface PerformDrawResponse {
  ok?: boolean;
  drawId: string;
  winner: Participant;
}

export interface WinnersListResponse {
  winners: DrawRecord[];
}

export const drawService = {
  /**
   * Fetches the current event and registration settings.
   */
  async getSettings(adminKey?: string): Promise<DrawSettings> {
    return request<DrawSettings>(APP_CONFIG.api.adminSettings, {
      method: "GET",
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
   * Triggers a new draw to pick a winner.
   */
  async performDraw(adminKey: string): Promise<PerformDrawResponse> {
    return request<PerformDrawResponse>(APP_CONFIG.api.adminDraw, {
      method: "POST",
      adminKey,
    });
  },

  /**
   * Fetches past winners.
   */
  async getWinners(adminKey?: string): Promise<WinnersListResponse> {
    return request<WinnersListResponse>(APP_CONFIG.api.adminDraw, {
      method: "GET",
      adminKey,
    });
  },
};
