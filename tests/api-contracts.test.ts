import { describe, it, expect, beforeEach } from "vitest";
import { GET as getParticipants, PATCH as updateParticipant, DELETE as deleteParticipant } from "@/app/api/admin/participants/route";
import { POST as updateSettings } from "@/app/api/admin/settings/route";
import { POST as registerParticipant } from "@/app/api/participants/route";
import * as adminSettingsRoute from "@/app/api/admin/settings/route";
import * as adminDrawRoute from "@/app/api/admin/draw/route";
import { drawService } from "@/services/drawService";
import { resetInMemStore, inMemStore, env } from "@/tests/mocks/cloudflare-workers";

describe("API Contracts & Service Mismatch Regression Suite", () => {
  beforeEach(() => {
    resetInMemStore();
    env.ADMIN_PASSWORD = "test-secret-admin-key";
  });

  const adminHeaders = {
    "x-admin-key": "test-secret-admin-key",
    "Content-Type": "application/json",
  };

  describe("Admin Participants API (/api/admin/participants)", () => {
    it("CONTRACT-01: GET returns participant list and registration open state", async () => {
      // Seed participant
      const seedReq = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Roberta Alves",
          store: "Alves Store",
          phone: "11988884444",
          instagram: "@roberta",
          consent: true,
        }),
      });
      await registerParticipant(seedReq);

      const getReq = new Request("http://localhost/api/admin/participants", {
        method: "GET",
        headers: adminHeaders,
      });
      const response = await getParticipants(getReq);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.participants)).toBe(true);
      expect(data.participants.length).toBe(1);
      expect(data.participants[0].name).toBe("Roberta Alves");
      expect(data.registrationsOpen).toBe(true);
    });

    it("CONTRACT-02: PATCH updates an existing participant", async () => {
      // Seed participant
      const seedReq = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Lucas Silva",
          store: "Lucas Store",
          phone: "11988883333",
          instagram: "@lucas",
          consent: true,
        }),
      });
      const seedRes = await registerParticipant(seedReq);
      const seedData = await seedRes.json();
      const id = seedData.participant.id;

      const patchReq = new Request("http://localhost/api/admin/participants", {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({
          id,
          name: "Lucas Silva Atualizado",
          store: "Lucas Modas Prime",
          phone: "(11) 98888-3333",
          instagram: "@lucasprime",
        }),
      });

      const response = await updateParticipant(patchReq);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.participant.name).toBe("Lucas Silva Atualizado");
      expect(data.participant.store).toBe("Lucas Modas Prime");
      expect(data.participant.instagram).toBe("@lucasprime");
    });

    it("CONTRACT-03: DELETE removes a participant and associated draws", async () => {
      // Seed participant
      const seedReq = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Gisele Souza",
          store: "Gisele Boutique",
          phone: "11988882222",
          instagram: "@gisele",
          consent: true,
        }),
      });
      const seedRes = await registerParticipant(seedReq);
      const { participant } = await seedRes.json();

      const deleteReq = new Request("http://localhost/api/admin/participants", {
        method: "DELETE",
        headers: adminHeaders,
        body: JSON.stringify({ id: participant.id }),
      });

      const response = await deleteParticipant(deleteReq);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);

      // Verify deletion in database
      expect(inMemStore.participants.find((p) => p.id === participant.id)).toBeUndefined();
    });
  });

  describe("Admin Settings API (/api/admin/settings)", () => {
    it("CONTRACT-04: POST updates registrations_open state", async () => {
      const postReq = new Request("http://localhost/api/admin/settings", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ registrationsOpen: false }),
      });

      const response = await updateSettings(postReq);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(inMemStore.settings.get("registrations_open")).toBe("false");
    });
  });

  describe("Contract Alignment & Minimal Surface (SCORECARD_V2 F21 Remediated)", () => {
    it("CONTRACT-05 (Remediated): verifies drawService does not expose dead getSettings and settings route exposes POST", () => {
      // Proves dead contract method getSettings was removed from client service
      expect((drawService as Record<string, unknown>).getSettings).toBeUndefined();
      expect(typeof drawService.updateSettings).toBe("function");

      // Verifies route handlers align with active endpoints
      expect((adminSettingsRoute as Record<string, unknown>).GET).toBeUndefined();
      expect(typeof (adminSettingsRoute as Record<string, unknown>).POST).toBe("function");
    });

    it("CONTRACT-06 (Remediated): verifies drawService does not expose dead getWinners and draw route exposes POST and PATCH", () => {
      // Proves dead contract method getWinners was removed from client service
      expect((drawService as Record<string, unknown>).getWinners).toBeUndefined();
      expect(typeof drawService.performDraw).toBe("function");
      expect(typeof drawService.announceDraw).toBe("function");

      // Verifies route handlers align with active endpoints
      expect((adminDrawRoute as Record<string, unknown>).GET).toBeUndefined();
      expect(typeof (adminDrawRoute as Record<string, unknown>).POST).toBe("function");
      expect(typeof (adminDrawRoute as Record<string, unknown>).PATCH).toBe("function");
    });
  });
});
