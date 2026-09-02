import { request } from "./apiClient";
import { cleanPhone } from "@/utils/formatters";
import type { ParticipantTicket } from "@/types/participant.types";

export interface TicketsResponse {
  ok: boolean;
  tickets: ParticipantTicket[];
  error?: string;
}

export interface IssueTicketResponse {
  ok: boolean;
  ticket: ParticipantTicket;
  alreadyEntered?: boolean;
  error?: string;
}

export const ticketService = {
  /**
   * Fetches official tickets from database by participantId or phone.
   */
  async getParticipantTickets(params: {
    participantId?: number;
    phone?: string;
  }): Promise<ParticipantTicket[]> {
    let query = "";
    if (params.participantId) {
      query = `participantId=${params.participantId}`;
    } else if (params.phone) {
      query = `phone=${cleanPhone(params.phone)}`;
    } else {
      return [];
    }

    const res = await request<TicketsResponse>(
      `/api/participants/tickets?${query}`,
      { method: "GET" },
    );

    return res.tickets || [];
  },

  /**
   * Issues a new official draw ticket in database.
   */
  async enterDraw(params: {
    drawId: string;
    participantId?: number;
    phone?: string;
  }): Promise<ParticipantTicket> {
    const res = await request<IssueTicketResponse>(
      "/api/participants/tickets",
      {
        method: "POST",
        body: JSON.stringify({
          drawId: params.drawId,
          participantId: params.participantId,
          phone: params.phone ? cleanPhone(params.phone) : undefined,
        }),
      },
    );

    if (!res.ok || !res.ticket) {
      throw new Error(res.error || "Não foi possível emitir o bilhete.");
    }

    return res.ticket;
  },
};
