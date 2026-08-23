import { describe, it, expect, beforeEach, vi } from "vitest";
import { initialize, database } from "@/app/api/_lib/db";
import { applyMigrations, MIGRATIONS } from "@/db/migrations";
import {
  resetInMemStore,
  inMemStore,
} from "@/tests/mocks/cloudflare-workers";

describe("Database Versioned Migrations & Zero-DDL Request Path", () => {
  beforeEach(() => {
    resetInMemStore();
  });

  it("MIGRATE-01: versioned migrations apply tables and indexes cleanly", async () => {
    const db = database();
    inMemStore.tables.clear();
    inMemStore.indexes.clear();

    await applyMigrations(db);

    expect(MIGRATIONS.length).toBe(2);
    expect(inMemStore.tables.has("participants")).toBe(true);
    expect(inMemStore.tables.has("settings")).toBe(true);
    expect(inMemStore.tables.has("draws")).toBe(true);
    expect(inMemStore.settings.get("registrations_open")).toBe("true");
  });

  it("MIGRATE-02: repeated migration execution is idempotent and preserves state", async () => {
    const db = database();
    await applyMigrations(db);

    // Mutate state
    inMemStore.settings.set("registrations_open", "false");

    // Re-run migrations
    await applyMigrations(db);

    // Table structure remains, custom value preserved
    expect(inMemStore.tables.has("participants")).toBe(true);
    expect(inMemStore.settings.get("registrations_open")).toBe("false");
  });

  it("MIGRATE-03: initialize() runs zero DDL queries on normal application requests", async () => {
    const db = database();
    const batchSpy = vi.spyOn(db, "batch");

    // Normal API request initialization
    const clientDb = await initialize();
    expect(clientDb).toBeDefined();

    // Verifies ZERO batch / DDL statements executed
    expect(batchSpy).toHaveBeenCalledTimes(0);
  });
});
