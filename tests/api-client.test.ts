import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { request, ApiError } from "@/services/apiClient";

describe("apiClient Unit Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("performs successful JSON GET request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, count: 42 }),
    });

    const data = await request<{ success: boolean; count: number }>("/api/test");
    expect(data.success).toBe(true);
    expect(data.count).toBe(42);
  });

  it("injects x-admin-key header when adminKey is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock;

    await request("/api/admin/test", { adminKey: "secret-key-123" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].headers["x-admin-key"]).toBe("secret-key-123");
  });

  it("throws ApiError on HTTP 400/500 error with message from payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "Dados inválidos" }),
    });

    await expect(request("/api/test")).rejects.toThrow(ApiError);
    await expect(request("/api/test")).rejects.toMatchObject({
      status: 400,
      message: "Dados inválidos",
    });
  });

  it("aborts and throws status 408 on timeout expiration", async () => {
    // Simula um fetch que demora mais que o timeout especificado
    global.fetch = vi.fn().mockImplementation((_url, options) => {
      return new Promise((_, reject) => {
        const signal = options?.signal as AbortSignal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    await expect(
      request("/api/slow", { timeoutMs: 50 }),
    ).rejects.toThrow(ApiError);

    await expect(
      request("/api/slow", { timeoutMs: 50 }),
    ).rejects.toMatchObject({
      status: 408,
      message: expect.stringContaining("Tempo limite esgotado"),
    });
  });

  it("throws error immediately if navigator.onLine is false", async () => {
    const originalNavigator = global.navigator;
    // @ts-expect-error Mocking navigator for test
    global.navigator = { onLine: false };

    try {
      await expect(request("/api/offline-test")).rejects.toThrow(
        "Você está sem conexão com a internet",
      );
    } finally {
      global.navigator = originalNavigator;
    }
  });
});
