import { describe, it, expect, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/participants/route";
import { resetInMemStore, inMemStore } from "@/tests/mocks/cloudflare-workers";

describe("Business Flow: Participant Registration & Public Lookup", () => {
  beforeEach(() => {
    resetInMemStore();
  });

  describe("POST /api/participants (Registration)", () => {
    it("REG-01: successfully registers a new participant with 201 and 4-digit lucky number", async () => {
      const request = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Renata Castanheira",
          store: "Boutique Crente Chic",
          phone: "(11) 98765-4321",
          instagram: "@renatacastanheira",
          consent: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.duplicate).toBe(false);
      expect(data.participant).toBeDefined();
      expect(data.participant.name).toBe("Renata Castanheira");
      expect(data.participant.store).toBe("Boutique Crente Chic");
      expect(data.participant.phone).toBe("11987654321");
      expect(data.participant.instagram).toBe("@renatacastanheira");
      expect(data.participant.luckyNumber).toMatch(/^\d{4}$/);
      expect(data.participant.status).toBe("active");
    });

    it("REG-02: rejects incomplete or invalid registration payloads with 400", async () => {
      const missingConsent = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Renata Castanheira",
          store: "Loja A",
          phone: "11987654321",
          instagram: "@renata",
          consent: false,
        }),
      });
      const res1 = await POST(missingConsent);
      expect(res1.status).toBe(400);

      const invalidPhone = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Renata Castanheira",
          store: "Loja A",
          phone: "12345",
          instagram: "@renata",
          consent: true,
        }),
      });
      const res2 = await POST(invalidPhone);
      expect(res2.status).toBe(400);
    });

    it("REG-03: handles duplicate phone registration by returning existing record and duplicate: true", async () => {
      // First registration
      const req1 = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Maria Santos",
          store: "Loja Prime",
          phone: "11999998888",
          instagram: "@mariaprime",
          consent: true,
        }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(201);
      const data1 = await res1.json();

      // Second registration with same phone
      const req2 = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Maria Santos Alterado",
          store: "Outra Loja",
          phone: "(11) 99999-8888",
          instagram: "@maria_outro",
          consent: true,
        }),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(200);

      const data2 = await res2.json();
      expect(data2.duplicate).toBe(true);
      expect(data2.participant.id).toBe(data1.participant.id);
      expect(data2.participant.luckyNumber).toBe(data1.participant.luckyNumber);
      expect(data2.participant.phone).toBe("11999998888");
    });

    it("REG-04: blocks registrations when registrations_open setting is 'false' with 403", async () => {
      inMemStore.settings.set("registrations_open", "false");

      const request = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Fernanda Lima",
          store: "Loja Fe",
          phone: "11988887777",
          instagram: "@fe",
          consent: true,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("encerradas");
    });

    it("REG-05 (Runtime Safety): rejects invalid JSON or malformed non-object bodies with 400", async () => {
      const invalidJson = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ malformed json",
      });
      const res1 = await POST(invalidJson);
      expect(res1.status).toBe(400);

      const arrayBody = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(["not", "an", "object"]),
      });
      const res2 = await POST(arrayBody);
      expect(res2.status).toBe(400);
    });
  });

  describe("GET /api/participants (Public Participant Lookup & Privacy)", () => {
    beforeEach(async () => {
      // Seed a participant
      const seedReq = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Carla Silveira",
          store: "Silveira Modas",
          phone: "11977776666",
          instagram: "@carlasilveira",
          consent: true,
        }),
      });
      await POST(seedReq);
    });

    it("LOOKUP-01: finds participant by valid 11-digit phone number", async () => {
      const request = new Request(
        "http://localhost/api/participants?phone=11977776666",
      );
      const response = await GET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.participant.name).toBe("Carla Silveira");
      expect(data.participant.store).toBe("Silveira Modas");
      expect(data.participant.luckyNumber).toMatch(/^\d{4}$/);
    });

    it("LOOKUP-02: returns 404 for unknown phone number", async () => {
      const request = new Request(
        "http://localhost/api/participants?phone=11911112222",
      );
      const response = await GET(request);
      expect(response.status).toBe(404);
    });

    it("LOOKUP-03: returns 400 for malformed phone (< 10 digits)", async () => {
      const request = new Request(
        "http://localhost/api/participants?phone=123",
      );
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it("LOOKUP-04 (Remediated - Privacy Protection): protects sensitive PII by omitting raw phone, instagram, and internal fields", async () => {
      const request = new Request(
        "http://localhost/api/participants?phone=(11) 97777-6666",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.ok).toBe(true);
      // Privacy boundary assertions: raw phone and instagram must NOT be exposed publicly
      expect(data.participant.phone).toBeUndefined();
      expect(data.participant.instagram).toBeUndefined();
      expect(data.participant.createdAt).toBeUndefined();
      expect(data.participant.status).toBeUndefined();
      expect(data.participant.wonAt).toBeUndefined();

      // Only public confirmation fields must be returned
      expect(data.participant.id).toBeDefined();
      expect(data.participant.name).toBe("Carla Silveira");
      expect(data.participant.store).toBe("Silveira Modas");
      expect(data.participant.luckyNumber).toMatch(/^\d{4}$/);
    });

    it("RATE-01: target limiter blocks 11th repeated request for specific target phone", async () => {
      const clientIp = "192.168.1.100";

      // 10 requests allowed within window for this specific target
      for (let i = 0; i < 10; i++) {
        const req = new Request(
          "http://localhost/api/participants?phone=11977776666",
          {
            headers: { "cf-connecting-ip": clientIp },
          },
        );
        const res = await GET(req);
        expect(res.status).toBe(200);
      }

      // 11th request for the same target from same IP is rate-limited (429)
      const blockedReq = new Request(
        "http://localhost/api/participants?phone=11977776666",
        {
          headers: { "cf-connecting-ip": clientIp },
        },
      );
      const blockedRes = await GET(blockedReq);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();

      const body = await blockedRes.json();
      expect(body.error).toContain("Muitas tentativas");
    });

    it("RATE-02 (Carrier NAT Tolerance): distinct phone numbers from same IP are not blocked by target limiter", async () => {
      const sharedVenueIp = "192.168.1.200";

      // Query for target Carla (10 times)
      for (let i = 0; i < 10; i++) {
        const req = new Request(
          "http://localhost/api/participants?phone=11977776666",
          {
            headers: { "cf-connecting-ip": sharedVenueIp },
          },
        );
        const res = await GET(req);
        expect(res.status).toBe(200);
      }

      // Query for a DIFFERENT phone from the same shared NAT IP is allowed by target limiter (returns 404 because not registered, but not 429)
      const otherPhoneReq = new Request(
        "http://localhost/api/participants?phone=11988880000",
        {
          headers: { "cf-connecting-ip": sharedVenueIp },
        },
      );
      const otherRes = await GET(otherPhoneReq);
      expect(otherRes.status).toBe(404);
    });
  });
});
