import { describe, it, expect, beforeEach } from "vitest";
import { POST as triggerDraw, PATCH as announceDraw } from "@/app/api/admin/draw/route";
import { GET as getLiveDraw } from "@/app/api/live-draw/route";
import { POST as registerParticipant } from "@/app/api/participants/route";
import { resetInMemStore, inMemStore, env } from "@/tests/mocks/cloudflare-workers";

describe("Business Flow: Live Draw State Machine & Winner Lifecycle", () => {
  beforeEach(() => {
    resetInMemStore();
    env.ADMIN_PASSWORD = "test-secret-admin-key";
  });

  const adminHeaders = {
    "x-admin-key": "test-secret-admin-key",
    "Content-Type": "application/json",
  };

  async function seedParticipants(count: number) {
    for (let i = 1; i <= count; i++) {
      const req = new Request("http://localhost/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Participante ${i}`,
          store: `Loja ${i}`,
          phone: `1197777000${i}`,
          instagram: `@participante_${i}`,
          consent: true,
        }),
      });
      await registerParticipant(req);
    }
  }

  it("DRAW-01: executes random draw on active pool, creates winner, and returns drawId", async () => {
    await seedParticipants(3);

    const request = new Request("http://localhost/api/admin/draw", {
      method: "POST",
      headers: adminHeaders,
    });

    const response = await triggerDraw(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.drawId).toBeDefined();
    expect(data.winner).toBeDefined();
    expect(data.winner.status).toBe("winner");
    expect(data.winner.wonAt).toBeDefined();
    expect(data.winner.luckyNumber).toMatch(/^\d{4}$/);

    // Verify record in draws table
    expect(inMemStore.draws.length).toBe(1);
    expect(inMemStore.draws[0].id).toBe(data.drawId);
  });

  it("DRAW-02: returns 409 Conflict when attempting to draw from an empty active pool", async () => {
    // 0 participants in database
    const request = new Request("http://localhost/api/admin/draw", {
      method: "POST",
      headers: adminHeaders,
    });

    const response = await triggerDraw(request);
    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data.error).toContain("Não há participantes ativos disponíveis");
  });

  it("DRAW-03: excludes previous winners from subsequent draws (no duplicate winners)", async () => {
    await seedParticipants(2);

    // First draw
    const req1 = new Request("http://localhost/api/admin/draw", {
      method: "POST",
      headers: adminHeaders,
    });
    const res1 = await triggerDraw(req1);
    const data1 = await res1.json();
    const winner1Id = data1.winner.id;

    // Second draw
    const req2 = new Request("http://localhost/api/admin/draw", {
      method: "POST",
      headers: adminHeaders,
    });
    const res2 = await triggerDraw(req2);
    const data2 = await res2.json();
    const winner2Id = data2.winner.id;

    // Must be distinct winners
    expect(winner1Id).not.toBe(winner2Id);

    // Third draw should fail (only 2 participants existed, both are now winners)
    const req3 = new Request("http://localhost/api/admin/draw", {
      method: "POST",
      headers: adminHeaders,
    });
    const res3 = await triggerDraw(req3);
    expect(res3.status).toBe(409);
  });

  it("DRAW-04: announces draw to public telão via PATCH /api/admin/draw", async () => {
    await seedParticipants(1);

    // 1. Draw winner
    const drawReq = new Request("http://localhost/api/admin/draw", {
      method: "POST",
      headers: adminHeaders,
    });
    const drawRes = await triggerDraw(drawReq);
    const { drawId, winner } = await drawRes.json();

    // 2. Announce draw
    const patchReq = new Request("http://localhost/api/admin/draw", {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ drawId }),
    });
    const patchRes = await announceDraw(patchReq);
    expect(patchRes.status).toBe(200);

    const patchData = await patchRes.json();
    expect(patchData.ok).toBe(true);
    expect(patchData.drawId).toBe(drawId);
    expect(patchData.winnerNumber).toBe(winner.luckyNumber);

    // Verify settings updated
    expect(inMemStore.settings.get("latest_draw_id")).toBe(drawId);
    expect(inMemStore.settings.get("latest_winner_number")).toBe(winner.luckyNumber);
  });

  it("DRAW-05: attendee public polling endpoint GET /api/live-draw returns active draw state", async () => {
    inMemStore.settings.set("latest_draw_id", "test-uuid-1234");
    inMemStore.settings.set("latest_winner_number", "0142");
    inMemStore.settings.set("registrations_open", "true");

    const response = await getLiveDraw();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.drawId).toBe("test-uuid-1234");
    expect(data.winnerNumber).toBe("0142");
    expect(data.registrationsOpen).toBe(true);
  });

  it("DRAW-06: rejects unauthenticated trigger or announce requests with 401", async () => {
    const unauthPost = new Request("http://localhost/api/admin/draw", { method: "POST" });
    const resPost = await triggerDraw(unauthPost);
    expect(resPost.status).toBe(401);

    const unauthPatch = new Request("http://localhost/api/admin/draw", {
      method: "PATCH",
      body: JSON.stringify({ drawId: "draw-1" }),
    });
    const resPatch = await announceDraw(unauthPatch);
    expect(resPatch.status).toBe(401);
  });

  it("DRAW-07 (Performance & ETag): returns ETag header and 304 Not Modified when If-None-Match matches", async () => {
    inMemStore.settings.set("latest_draw_id", "draw-etag-1");
    inMemStore.settings.set("latest_winner_number", "0555");
    inMemStore.settings.set("registrations_open", "true");

    const req1 = new Request("http://localhost/api/live-draw");
    const res1 = await getLiveDraw(req1);
    expect(res1.status).toBe(200);

    const etag = res1.headers.get("ETag");
    expect(etag).toBeDefined();

    // Repeated request with If-None-Match returns 304
    const req2 = new Request("http://localhost/api/live-draw", {
      headers: { "If-None-Match": etag! },
    });
    const res2 = await getLiveDraw(req2);
    expect(res2.status).toBe(304);

    // After state changes, If-None-Match returns 200 with new ETag
    inMemStore.settings.set("latest_winner_number", "0999");
    const req3 = new Request("http://localhost/api/live-draw", {
      headers: { "If-None-Match": etag! },
    });
    const res3 = await getLiveDraw(req3);
    expect(res3.status).toBe(200);
    const data3 = await res3.json();
    expect(data3.winnerNumber).toBe("0999");
  });
});
