/**
 * Mock for cloudflare:workers in Vitest environment.
 * Provides an in-memory D1 Database implementation and configurable env variables.
 */

export interface ParticipantRecord {
  id: number;
  lucky_number: string;
  name: string;
  store: string;
  phone: string;
  instagram: string;
  status: string;
  created_at: string;
  won_at?: string | null;
}

export interface DrawRecord {
  id: string;
  participant_id: number;
  lucky_number: string;
  drawn_at: string;
}

export interface InMemStore {
  participants: ParticipantRecord[];
  settings: Map<string, string>;
  draws: DrawRecord[];
  autoIncrementId: number;
  tables: Set<string>;
  indexes: Set<string>;
}

export interface MockPreparedStatement {
  bind(...values: unknown[]): MockPreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }>;
  run(): Promise<{ results: unknown[]; success: boolean }>;
}

export interface MockD1Database {
  prepare(sql: string): MockPreparedStatement;
  batch(statements: MockPreparedStatement[]): Promise<unknown[]>;
  transaction<T>(
    callback: (database: MockD1Database) => Promise<T>,
  ): Promise<T>;
}

export const inMemStore: InMemStore = {
  participants: [],
  settings: new Map<string, string>(),
  draws: [],
  autoIncrementId: 1,
  tables: new Set(["participants", "settings", "draws"]),
  indexes: new Set([
    "participants_lucky_number_unique",
    "participants_phone_unique",
    "idx_participants_status",
    "idx_draws_participant_id",
  ]),
};

export function createMockRateLimiter(maxRequests = 10) {
  const counts = new Map<string, number>();

  return {
    async limit({ key }: { key: string }) {
      const current = counts.get(key) || 0;
      if (current >= maxRequests) {
        return { success: false };
      }
      counts.set(key, current + 1);
      return { success: true };
    },
    reset() {
      counts.clear();
    },
  };
}

export const mockLookupIpLimiter = createMockRateLimiter(50);
export const mockLookupTargetLimiter = createMockRateLimiter(10);
export const mockRateLimiter = createMockRateLimiter(10);
const runtimeRateCounts = new Map<string, number>();

export function resetInMemStore() {
  inMemStore.participants = [];
  inMemStore.settings = new Map<string, string>([["registrations_open", "true"]]);
  inMemStore.draws = [];
  inMemStore.autoIncrementId = 1;
  inMemStore.tables = new Set(["participants", "settings", "draws"]);
  inMemStore.indexes = new Set([
    "participants_lucky_number_unique",
    "participants_phone_unique",
    "idx_participants_status",
    "idx_draws_participant_id",
  ]);
  mockLookupIpLimiter.reset();
  mockLookupTargetLimiter.reset();
  mockRateLimiter.reset();
  runtimeRateCounts.clear();
}

export function createMockD1Database(): MockD1Database {
  function executeSql(sql: string, bindings: unknown[] = []) {
    const trimmed = sql
      .trim()
      .replace(/\s+/g, " ")
      .replace(/INSERT INTO t_draws\(id_sorteio,id_participante/gi, "INSERT INTO draws(id,participant_id")
      .replace(/FROM t_draws WHERE id_participante/gi, "FROM draws WHERE participant_id")
      .replace(/DELETE FROM t_draws WHERE id_participante/gi, "DELETE FROM draws WHERE participant_id")
      .replace(/\bd\.id_participante\b/gi, "d.participant_id")
      .replace(/\bt_request_rate_limits\b/gi, "request_rate_limits")
      .replace(/\bt_participants\b/gi, "participants")
      .replace(/\bt_settings\b/gi, "settings")
      .replace(/\bt_draws\b/gi, "draws")
      .replace(/\bid_sorteio\b/gi, "id")
      .replace(/\bid_participante\b/gi, "id")
      .replace(/\bnr_sorte\b/gi, "lucky_number")
      .replace(/\bnm_participante\b/gi, "name")
      .replace(/\bnm_loja\b/gi, "store")
      .replace(/\bnr_whatsapp\b/gi, "phone")
      .replace(/\bnm_instagram\b/gi, "instagram")
      .replace(/\bst_participante\b/gi, "status")
      .replace(/\bdt_cadastro\b/gi, "created_at")
      .replace(/\bdt_sorteio\b/gi, "drawn_at")
      .replace(/\bcd_configuracao\b/gi, "key")
      .replace(/\bvl_configuracao\b/gi, "value")
      .replace(/\b([a-z_]+)\s+AS\s+\1\b/gi, "$1");

    // CREATE TABLE
    const createTableMatch = trimmed.match(/CREATE TABLE (?:IF NOT EXISTS )?`?([a-zA-Z0-9_]+)`?/i);
    if (createTableMatch) {
      inMemStore.tables.add(createTableMatch[1]);
      return { results: [], success: true };
    }

    // CREATE INDEX
    const createIndexMatch = trimmed.match(/CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?`?([a-zA-Z0-9_]+)`?/i);
    if (createIndexMatch) {
      inMemStore.indexes.add(createIndexMatch[1]);
      return { results: [], success: true };
    }

    // INSERT OR IGNORE INTO settings
    if (trimmed.startsWith("INSERT OR IGNORE INTO settings") || trimmed.startsWith("INSERT OR IGNORE INTO `settings`")) {
      const keyMatch = trimmed.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
      let key = bindings[0] as string || "registrations_open";
      let val = bindings[1] as string || "true";
      if (keyMatch) {
        key = keyMatch[1];
        val = keyMatch[2];
      }
      if (!inMemStore.settings.has(key)) {
        inMemStore.settings.set(key, val);
      }
      return { results: [], success: true };
    }

    // INSERT INTO settings ON CONFLICT
    if (trimmed.startsWith("INSERT INTO settings") || trimmed.startsWith("INSERT INTO `settings`")) {
      const matchLiteralKey = trimmed.match(/VALUES\s*\(\s*'([^']+)'\s*,\s*\?\s*\)/i);
      if (matchLiteralKey && bindings.length >= 1) {
        inMemStore.settings.set(matchLiteralKey[1], String(bindings[0]));
      } else if (bindings.length >= 2) {
        for (let i = 0; i < bindings.length; i += 2) {
          const k = String(bindings[i]);
          const v = String(bindings[i + 1]);
          inMemStore.settings.set(k, v);
        }
      }
      return { results: [], success: true };
    }

    // SELECT value FROM settings WHERE key=?
    if (trimmed.startsWith("SELECT value FROM settings WHERE key=?") || trimmed.startsWith("SELECT value FROM settings WHERE key = ?")) {
      const key = String(bindings[0]);
      const value = inMemStore.settings.get(key);
      return {
        results: value !== undefined ? [{ value }] : [],
        success: true,
      };
    }

    // SELECT value FROM settings WHERE key='...'
    const settingsKeyMatch = trimmed.match(/SELECT value FROM settings WHERE key\s*=\s*'([^']+)'/i);
    if (settingsKeyMatch) {
      const key = settingsKeyMatch[1];
      const value = inMemStore.settings.get(key);
      return {
        results: value !== undefined ? [{ value }] : [],
        success: true,
      };
    }

    // SELECT ... FROM participants WHERE phone=?
    if (trimmed.includes("FROM participants WHERE phone=?") || trimmed.includes("FROM participants WHERE phone = ?")) {
      const phone = String(bindings[0]);
      const p = inMemStore.participants.find((item) => item.phone === phone);
      return {
        results: p ? [p] : [],
        success: true,
      };
    }

    // SELECT id FROM participants WHERE lucky_number=?
    if (trimmed.startsWith("SELECT id FROM participants WHERE lucky_number=?") || trimmed.startsWith("SELECT id FROM participants WHERE lucky_number = ?")) {
      const lucky = String(bindings[0]);
      const p = inMemStore.participants.find((item) => item.lucky_number === lucky);
      return {
        results: p ? [{ id: p.id }] : [],
        success: true,
      };
    }

    // SELECT key, value FROM settings WHERE key IN (...)
    if (trimmed.startsWith("SELECT key, value FROM settings WHERE key IN") || trimmed.startsWith("SELECT key,value FROM settings WHERE key IN")) {
      const results: { key: string; value: string }[] = [];
      inMemStore.settings.forEach((val, k) => {
        results.push({ key: k, value: val });
      });
      return { results, success: true };
    }

    // SELECT id, lucky_number FROM draws WHERE id=?
    if (trimmed.startsWith("SELECT id, lucky_number FROM draws WHERE id=?") || trimmed.startsWith("SELECT id, lucky_number FROM draws WHERE id = ?")) {
      const id = String(bindings[0]);
      const d = inMemStore.draws.find((item) => item.id === id);
      return {
        results: d ? [{ id: d.id, lucky_number: d.lucky_number }] : [],
        success: true,
      };
    }

    // UPDATE participants SET status='winner' WHERE id=(SELECT id FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1)
    if (
      trimmed.startsWith("UPDATE participants SET status='winner'") &&
      trimmed.includes("FROM participants") &&
      trimmed.includes("WHERE status='active'")
    ) {
      const active = inMemStore.participants.filter((p) => p.status === "active");
      if (active.length === 0) return { results: [], success: true };
      const randomIndex = Math.floor(Math.random() * active.length);
      const winner = active[randomIndex];
      winner.status = "winner";
      winner.won_at = new Date().toISOString();
      return { results: [winner], success: true };
    }

    // SELECT * FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1
    if (trimmed.includes("FROM participants WHERE status='active' ORDER BY RANDOM() LIMIT 1") || trimmed.includes("FROM participants WHERE status = 'active' ORDER BY RANDOM() LIMIT 1")) {
      const active = inMemStore.participants.filter((p) => p.status === "active");
      if (active.length === 0) return { results: [], success: true };
      const randomIndex = Math.floor(Math.random() * active.length);
      return { results: [active[randomIndex]], success: true };
    }

    // SELECT p.*, ... FROM participants p ORDER BY p.id DESC
    if (trimmed.startsWith("SELECT p.*") || trimmed.startsWith("SELECT * FROM participants ORDER BY id DESC") || trimmed.startsWith("SELECT * FROM participants ORDER BY p.id DESC") || trimmed.includes("FROM participants p ORDER BY p.id DESC")) {
      const sorted = [...inMemStore.participants].sort((a, b) => b.id - a.id);
      return { results: sorted, success: true };
    }

    // SELECT id FROM participants WHERE id=? or SELECT * FROM participants WHERE id=?
    if (trimmed.startsWith("SELECT id FROM participants WHERE id=?") || trimmed.startsWith("SELECT * FROM participants WHERE id=?") || trimmed.startsWith("SELECT id FROM participants WHERE id = ?")) {
      const id = Number(bindings[0]);
      const p = inMemStore.participants.find((item) => item.id === id);
      return {
        results: p ? [p] : [],
        success: true,
      };
    }

    // SELECT MAX(drawn_at) AS won_at FROM draws WHERE participant_id=?
    if (trimmed.startsWith("SELECT MAX(drawn_at)")) {
      const pId = Number(bindings[0]);
      const lastDraw = inMemStore.draws.filter((d) => d.participant_id === pId).pop();
      return {
        results: lastDraw ? [{ won_at: lastDraw.drawn_at }] : [],
        success: true,
      };
    }

    // DELETE FROM draws WHERE participant_id=?
    if (trimmed.startsWith("DELETE FROM draws WHERE participant_id=?") || trimmed.startsWith("DELETE FROM draws WHERE participant_id = ?")) {
      const pId = Number(bindings[0]);
      inMemStore.draws = inMemStore.draws.filter((d) => d.participant_id !== pId);
      return { results: [], success: true };
    }

    // INSERT INTO participants
    if (trimmed.startsWith("INSERT INTO participants") || trimmed.startsWith("INSERT INTO `participants`")) {
      const [lucky_number, name, store, phone, instagram] = bindings as string[];

      // Check unique constraints
      if (inMemStore.participants.some((p) => p.phone === phone)) {
        throw new Error("UNIQUE constraint failed: participants.phone");
      }
      if (inMemStore.participants.some((p) => p.lucky_number === lucky_number)) {
        throw new Error("UNIQUE constraint failed: participants.lucky_number");
      }

      const id = inMemStore.autoIncrementId++;
      const newParticipant: ParticipantRecord = {
        id,
        lucky_number,
        name,
        store,
        phone,
        instagram,
        status: "active",
        created_at: new Date().toISOString(),
        won_at: null,
      };
      inMemStore.participants.push(newParticipant);
      return { results: [newParticipant], success: true };
    }

    // INSERT INTO draws
    if (trimmed.startsWith("INSERT INTO draws") || trimmed.startsWith("INSERT INTO `draws`")) {
      const [id, participant_id, lucky_number] = bindings as [string, number, string];
      const newDraw: DrawRecord = {
        id,
        participant_id,
        lucky_number,
        drawn_at: new Date().toISOString(),
      };
      inMemStore.draws.push(newDraw);
      return { results: [newDraw], success: true };
    }

    // UPDATE participants SET name=?, store=?, phone=?, instagram=? WHERE id=?
    if (trimmed.startsWith("UPDATE participants SET name=?") || trimmed.startsWith("UPDATE participants SET name = ?")) {
      const [name, store, phone, instagram, id] = bindings as [string, string, string, string, number];
      const p = inMemStore.participants.find((item) => item.id === Number(id));
      if (p) {
        p.name = name;
        p.store = store;
        p.phone = phone;
        p.instagram = instagram;
        return { results: [p], success: true };
      }
      return { results: [], success: true };
    }

    // DELETE FROM participants WHERE id=?
    if (trimmed.startsWith("DELETE FROM participants WHERE id=?") || trimmed.startsWith("DELETE FROM participants WHERE id = ?")) {
      const id = Number(bindings[0]);
      const initialLen = inMemStore.participants.length;
      inMemStore.participants = inMemStore.participants.filter((p) => p.id !== id);
      return { results: [{ affected_rows: initialLen - inMemStore.participants.length }], success: true };
    }

    return { results: [], success: true };
  }

  function prepare(sql: string): MockPreparedStatement {
    let boundValues: unknown[] = [];
    return {
      bind(...values: unknown[]) {
        boundValues = values;
        return this;
      },
      async first<T = Record<string, unknown>>(): Promise<T | null> {
        const { results } = executeSql(sql, boundValues);
        return (results[0] as T) || null;
      },
      async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean }> {
        const { results, success } = executeSql(sql, boundValues);
        return { results: results as T[], success };
      },
      async run() {
        const { results, success } = executeSql(sql, boundValues);
        return { results, success };
      },
    };
  }

  async function batch(statements: MockPreparedStatement[]) {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }

  const database: MockD1Database = {
    prepare,
    batch,
    async transaction<T>(callback: (database: MockD1Database) => Promise<T>) {
      return callback(database);
    },
  };

  return database;
}

export const env: {
  DB: ReturnType<typeof createMockD1Database>;
  ADMIN_PASSWORD?: string;
  LOOKUP_IP_LIMITER?: typeof mockLookupIpLimiter;
  LOOKUP_TARGET_LIMITER?: typeof mockLookupTargetLimiter;
  RATE_LIMITER?: typeof mockRateLimiter;
} = {
  DB: createMockD1Database(),
  ADMIN_PASSWORD: "test-secret-admin-key",
  LOOKUP_IP_LIMITER: mockLookupIpLimiter,
  LOOKUP_TARGET_LIMITER: mockLookupTargetLimiter,
  RATE_LIMITER: mockRateLimiter,
};

export function getDatabase() {
  return env.DB;
}

export function getAdminPassword() {
  return env.ADMIN_PASSWORD?.trim() || undefined;
}

export async function consumeRateLimit(
  key: string,
  maximum: number,
  windowSeconds: number,
) {
  const current = (runtimeRateCounts.get(key) ?? 0) + 1;
  runtimeRateCounts.set(key, current);
  return {
    allowed: current <= maximum,
    retryAfter: windowSeconds,
  };
}
