import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/participants/route";
import { resetInMemStore, inMemStore } from "@/tests/mocks/cloudflare-workers";
import { formatLuckyNumber } from "@/utils/formatters";

describe("Business Flow: Lucky Number Allocation & Uniqueness", () => {
  beforeEach(() => {
    resetInMemStore();
  });

  it("LUCK-01: generates a 4-digit string format between '0001' and '9999'", async () => {
    const request = new Request("http://localhost/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aline Ferreira",
        store: "Loja Flor",
        phone: "11988880001",
        instagram: "@flor",
        consent: true,
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(201);
    const data = await res.json();
    const luckyStr = data.participant.luckyNumber;

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

  it("LUCK-03: allocates distinct numbers across sequential registrations", async () => {
    const allocatedNumbers = new Set<string>();

    for (let i = 1; i <= 10; i++) {
      const phone = `1198888${String(i).padStart(4, "0")}`;
      const req = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Participante ${i}`,
          store: `Loja ${i}`,
          phone,
          instagram: `@loja_${i}`,
          consent: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      allocatedNumbers.add(data.participant.luckyNumber);
    }

    expect(allocatedNumbers.size).toBe(10);
  });

  it("LUCK-04: collision retry loop finds an unused number when initial pick is occupied", async () => {
    // Seed participant with lucky_number = '0777'
    inMemStore.participants.push({
      id: 99,
      lucky_number: "0777",
      name: "Pre-existing",
      store: "Store",
      phone: "11900000000",
      instagram: "@seed",
      status: "active",
      created_at: new Date().toISOString(),
      won_at: null,
    });

    // Mock getRandomValues to return 776 (+1 = 777) on first call, and 888 (+1 = 889) on second call
    let callCount = 0;
    vi.spyOn(crypto, "getRandomValues").mockImplementation((arr) => {
      if (arr && "length" in arr) {
        const u32 = arr as unknown as Uint32Array;
        if (callCount === 0) {
          callCount++;
          u32[0] = 776; // 776 % 9999 + 1 = 777 ("0777" which collides)
        } else {
          u32[0] = 888; // 888 % 9999 + 1 = 889 ("0889" which is free)
        }
      }
      return arr;
    });

    const request = new Request("http://localhost/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Juliana Costa",
        store: "Costa Boutique",
        phone: "11987654399",
        instagram: "@costa",
        consent: true,
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.participant.luckyNumber).toBe("0889");

    vi.restoreAllMocks();
  });

  it("LUCK-05 (Remediated - Safe Collision Exhaustion): returns controlled 503 and never persists duplicate when retries exhaust", async () => {
    // Seed participant with lucky_number = '0555'
    inMemStore.participants.push({
      id: 98,
      lucky_number: "0555",
      name: "Pre-existing",
      store: "Store",
      phone: "11900000001",
      instagram: "@seed2",
      status: "active",
      created_at: new Date().toISOString(),
      won_at: null,
    });

    // Force RNG to always return 554 (+1 = 555), causing 20 continuous collisions
    vi.spyOn(crypto, "getRandomValues").mockImplementation((arr) => {
      if (arr && "length" in arr) {
        const u32 = arr as unknown as Uint32Array;
        u32[0] = 554; // produces "0555" continuously
      }
      return arr;
    });

    const request = new Request("http://localhost/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Tatiana Lima",
        store: "Tatiana Fashion",
        phone: "11987654388",
        instagram: "@tatiana",
        consent: true,
      }),
    });

    // Remediated behavior: loop exhausts without picking a candidate,
    // returns a controlled 503 Service Unavailable without attempting duplicate insert.
    const res = await POST(request);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("Não foi possível gerar um número único");

    // Proves database was not corrupted with duplicate lucky number
    expect(inMemStore.participants.length).toBe(1);
    expect(inMemStore.participants[0].name).toBe("Pre-existing");

    vi.restoreAllMocks();
  });
});
