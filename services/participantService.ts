import { APP_CONFIG } from "@/constants/config";
import { request } from "./apiClient";
import { cleanPhone } from "@/utils/formatters";
import type {
  Participant,
  ParticipantFormData,
} from "@/types/participant.types";

export interface RegisterResponse {
  ok: boolean;
  participant: Participant;
  duplicate?: boolean;
}

export interface ParticipantsListResponse {
  ok?: boolean;
  participants: Participant[];
  registrationsOpen?: boolean;
  settings?: {
    registrationsOpen: boolean;
  };
}

export const participantService = {
  /**
   * Registers a new participant from public landing page.
   */
  async register(data: ParticipantFormData): Promise<RegisterResponse> {
    return request<RegisterResponse>(APP_CONFIG.api.participants, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Fast lookup of participant by WhatsApp number.
   */
  async lookupByPhone(
    phone: string,
  ): Promise<{ ok: boolean; participant: Participant }> {
    const digits = cleanPhone(phone);
    return request<{ ok: boolean; participant: Participant }>(
      `${APP_CONFIG.api.participants}?phone=${digits}`,
      {
        method: "GET",
      },
    );
  },

  /**
   * Fetches all registered participants (Admin).
   */
  async getAll(adminKey: string): Promise<ParticipantsListResponse> {
    return request<ParticipantsListResponse>(
      APP_CONFIG.api.adminParticipants,
      {
        method: "GET",
        adminKey,
      },
    );
  },

  /**
   * Updates an existing participant (Admin).
   */
  async update(
    adminKey: string,
    data: {
      id: number;
      name: string;
      store: string;
      phone: string;
      instagram: string;
    },
  ): Promise<{ ok: boolean; participant: Participant }> {
    return request<{ ok: boolean; participant: Participant }>(
      APP_CONFIG.api.adminParticipants,
      {
        method: "PATCH",
        adminKey,
        body: JSON.stringify(data),
      },
    );
  },

  /**
   * Deletes a participant (Admin).
   */
  async delete(
    adminKey: string,
    id: number,
  ): Promise<{ ok: boolean; id: number }> {
    return request<{ ok: boolean; id: number }>(
      APP_CONFIG.api.adminParticipants,
      {
        method: "DELETE",
        adminKey,
        body: JSON.stringify({ id }),
      },
    );
  },
};
