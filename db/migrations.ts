/**
 * Cloudflare D1 Versioned Migration Runner.
 *
 * In production Cloudflare Workers:
 * Executed via `npx wrangler d1 migrations apply DB --remote`
 *
 * In local development / test harnesses:
 * Executed via `applyMigrations(db)`
 */

export interface D1DatabaseLike {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      run(): Promise<unknown>;
    };
    run(): Promise<unknown>;
  };
  batch(statements: unknown[]): Promise<unknown[]>;
}

export const MIGRATIONS = [
  {
    id: "0000_fashion_date",
    name: "Initial schema for participants and settings",
    statements: [
      `CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        lucky_number TEXT NOT NULL,
        name TEXT NOT NULL,
        store TEXT NOT NULL,
        phone TEXT NOT NULL,
        instagram TEXT NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS participants_lucky_number_unique ON participants (lucky_number);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS participants_phone_unique ON participants (phone);`,
      `CREATE INDEX IF NOT EXISTS idx_participants_status ON participants (status);`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('registrations_open', 'true');`,
    ],
  },
  {
    id: "0001_draw_history",
    name: "Live draw history table",
    statements: [
      `CREATE TABLE IF NOT EXISTS draws (
        id TEXT PRIMARY KEY NOT NULL,
        participant_id INTEGER NOT NULL,
        lucky_number TEXT NOT NULL,
        drawn_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_draws_participant_id ON draws (participant_id);`,
    ],
  },
] as const;

export async function applyMigrations(db: D1DatabaseLike) {
  for (const migration of MIGRATIONS) {
    const prepared = migration.statements.map((sql) => db.prepare(sql));
    await db.batch(prepared);
  }
}
