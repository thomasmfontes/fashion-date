import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as registerParticipant } from "@/app/api/participants/route";
import { POST as claimTicket } from "@/app/api/participants/tickets/route";
import { resetInMemStore, inMemStore } from "@/tests/mocks/cloudflare-workers";
import { formatLuckyNumber } from "@/utils/formatters";

describe("Business Flow: Lucky Number Allocation & Uniqueness", () => {
  beforeEach(() => {
    resetInMemStore();
  });

  async function registerAndClaim(participantData: {
    name: string;
    store: string;
    city?: string;
    phone: string;
    instagram: string;
    consent: boolean;
  }, drawId = "draw-default") {
    const regReq = new Request("http://localhost/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(participantData),
    });
    const regRes = await registerParticipant(regReq);
    const regData = await regRes.json();

    const claimReq = new Request("http://localhost/api/participants/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: regData.participant?.id,
        drawId,
      }),
    });
    return claimTicket(claimReq);
  }

  it("LUCK-01: generates a 4-digit string format between '0001' and '9999' upon claiming draw number", async () => {
    const res = await registerAndClaim({
      name: "Aline Ferreira",
      store: "Loja Flor",
      city: "São Paulo - SP",
      phone: "11988880001",
      instagram: "@flor",
      consent: true,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    const luckyStr = data.ticket.ticketNumber;

    expect(typeof luckyStr).toBe("string");
    expect(luckyStr).toMatch(/^\d{4}$/);
    const numeric = parseInt(luckyStr, 10);
    expect(numeric).toBeGreaterThanOrEqual(1);
    expect(numeric).toBeLessThanOrEqual(9999);
  });

  it("LUCK-02: preserves leading zeros in formatting", () => {
    expect(formatLuckyNumber("0001")).toBe("0001");
    expect(formatLuckyNumber(1)).toBe("0001");
    expect(formatLuckyNumber(42)).toBe("0042");
    expect(formatLuckyNumber("750")).toBe("0750");
    expect(formatLuckyNumber("9999")).toBe("9999");
  });

  it("LUCK-03: allocates distinct numbers across sequential claims", async () => {
    const allocatedNumbers = new Set<string>();

    for (let i = 1; i <= 10; i++) {
      const phone = `1198888${String(i).padStart(4, "0")}`;
      const res = await registerAndClaim({
        name: `Participante ${i}`,
        store: `Loja ${i}`,
        city: "São Paulo - SP",
        phone,
        instagram: `@loja_${i}`,
        consent: true,
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      allocatedNumbers.add(data.ticket.ticketNumber);
    }

    expect(allocatedNumbers.size).toBe(10);
  });

  it("LUCK-04: collision retry loop finds an unused number when initial pick is occupied", async () => {
    // Seed existing ticket with nr_bilhete = '2500'
    inMemStore.drawTickets.push({
      id_ticket: 99,
      id_participante: 99,
      id_sorteio: "draw-default",
      nr_bilhete: "2500",
      dt_inscricao: new Date().toISOString(),
    });

    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      if (callCount === 0) {
        callCount++;
        return (2500 - 1000) / 9000; // generates "2500" which collides
      }
      return (3500 - 1000) / 9000; // generates "3500" which is free
    });

    const res = await registerAndClaim({
      name: "Juliana Costa",
      store: "Costa Boutique",
      city: "São Paulo - SP",
      phone: "11987654399",
      instagram: "@costa",
      consent: true,
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ticket.ticketNumber).toBe("3500");

    vi.restoreAllMocks();
  });

  it("LUCK-05 (Safe Collision Exhaustion): returns controlled 503 when retries exhaust", async () => {
    // Seed existing ticket with nr_bilhete = '2500'
    inMemStore.drawTickets.push({
      id_ticket: 98,
      id_participante: 98,
      id_sorteio: "draw-default",
      nr_bilhete: "2500",
      dt_inscricao: new Date().toISOString(),
    });

    // Force RNG to always return 2500, causing 30 continuous collisions
    vi.spyOn(Math, "random").mockImplementation(() => (2500 - 1000) / 9000);

    const res = await registerAndClaim({
      name: "Tatiana Lima",
      store: "Tatiana Fashion",
      city: "São Paulo - SP",
      phone: "11987654388",
      instagram: "@tatiana",
      consent: true,
    });

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("Alta concorrência na emissão de bilhetes");

    // Proves duplicate ticket was never created
    expect(inMemStore.drawTickets.length).toBe(1);
    expect(inMemStore.drawTickets[0].id_participante).toBe(98);

    vi.restoreAllMocks();
  });
});
