import { describe, it, expect, beforeEach } from "vitest";
import { adminAllowed } from "@/app/api/_lib/db";
import { env, resetInMemStore } from "@/tests/mocks/cloudflare-workers";

describe("Security Boundaries: Admin Authentication (Remediated)", () => {
  beforeEach(() => {
    resetInMemStore();
    env.ADMIN_PASSWORD = "production-configured-secret-key";
  });

  it("AUTH-01: accepts request with valid x-admin-key header", () => {
    const request = new Request("http://localhost/api/admin/participants", {
      headers: { "x-admin-key": "production-configured-secret-key" },
    });
    expect(adminAllowed(request)).toBe(true);
  });

  it("AUTH-02: rejects request with invalid x-admin-key header", () => {
    const request = new Request("http://localhost/api/admin/participants", {
      headers: { "x-admin-key": "wrong-password" },
    });
    expect(adminAllowed(request)).toBe(false);
  });

  it("AUTH-03: rejects request with missing credentials", () => {
    const request = new Request("http://localhost/api/admin/participants");
    expect(adminAllowed(request)).toBe(false);
  });

  it("AUTH-04 (Remediated): rejects credentials in URL query parameter (?key=...)", () => {
    // Proves query parameter authentication is completely disabled
    const request = new Request(
      "http://localhost/api/admin/participants?key=production-configured-secret-key",
    );
    expect(adminAllowed(request)).toBe(false);
  });

  it("AUTH-05 (Remediated): fails closed when ADMIN_PASSWORD is unset (no hardcoded fallback)", () => {
    // When ADMIN_PASSWORD is unset or empty, all attempts must fail closed
    env.ADMIN_PASSWORD = undefined;

    const requestWithDefault = new Request("http://localhost/api/admin/participants", {
      headers: { "x-admin-key": "fashiondate2026" },
    });
    expect(adminAllowed(requestWithDefault)).toBe(false);

    env.ADMIN_PASSWORD = "";
    const requestWithEmpty = new Request("http://localhost/api/admin/participants", {
      headers: { "x-admin-key": "" },
    });
    expect(adminAllowed(requestWithEmpty)).toBe(false);
  });
});
