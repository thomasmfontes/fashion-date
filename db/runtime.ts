import postgres, { type Sql } from "postgres";

type QueryRow = Record<string, unknown>;
type QueryExecutor = Pick<Sql, "unsafe">;

export type PreparedStatement = {
  bind: (...values: unknown[]) => PreparedStatement;
  first: <T = QueryRow>() => Promise<T | null>;
  all: <T = QueryRow>() => Promise<{ results: T[]; success: true }>;
  run: () => Promise<{ results: QueryRow[]; success: true }>;
  executeWith: <T = QueryRow>(executor: QueryExecutor) => Promise<T[]>;
};

export type AppDatabase = {
  prepare: (query: string) => PreparedStatement;
  batch: (statements: PreparedStatement[]) => Promise<unknown[]>;
  transaction: <T>(callback: (database: AppDatabase) => Promise<T>) => Promise<T>;
};

declare global {
  // Reuse the connection pool between requests and Next.js hot reloads.
  var fashionDateSql: Sql | undefined;
}

function connectionString(): string {
  const value =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim();

  if (!value) {
    throw new Error(
      "Banco de dados indisponível. Configure DATABASE_URL com a conexão do Supabase.",
    );
  }

  return value;
}

function client(): Sql {
  if (!globalThis.fashionDateSql) {
    globalThis.fashionDateSql = postgres(connectionString(), {
      // Vercel functions should use the Supabase transaction pooler with a
      // deliberately small local pool to avoid exhausting database connections.
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  return globalThis.fashionDateSql;
}

function postgresQuery(query: string): string {
  let parameter = 0;
  return query.replace(/\?/g, () => `$${++parameter}`);
}

function createDatabase(executor: QueryExecutor, root: Sql): AppDatabase {
  const prepare = (query: string): PreparedStatement => {
    let bindings: unknown[] = [];

    const statement: PreparedStatement = {
      bind(...values: unknown[]) {
        bindings = values;
        return statement;
      },
      async executeWith<T = QueryRow>(target: QueryExecutor): Promise<T[]> {
        const result = await target.unsafe<T[]>(
          postgresQuery(query),
          bindings as never[],
        );
        return Array.from(result);
      },
      async first<T = QueryRow>(): Promise<T | null> {
        const rows = await statement.executeWith<T>(executor);
        return rows[0] ?? null;
      },
      async all<T = QueryRow>() {
        return {
          results: await statement.executeWith<T>(executor),
          success: true as const,
        };
      },
      async run() {
        return {
          results: await statement.executeWith<QueryRow>(executor),
          success: true as const,
        };
      },
    };

    return statement;
  };

  return {
    prepare,
    async batch(statements) {
      return root.begin(async (transaction) => {
        const results: unknown[] = [];
        for (const statement of statements) {
          results.push(await statement.executeWith(transaction));
        }
        return results;
      });
    },
    async transaction<T>(callback: (database: AppDatabase) => Promise<T>) {
      return root.begin((transaction) =>
        callback(createDatabase(transaction, root)),
      ) as Promise<T>;
    },
  };
}

export function getDatabase(): AppDatabase {
  const sql = client();
  return createDatabase(sql, sql);
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD?.trim() || undefined;
}

export async function consumeRateLimit(
  key: string,
  maximum: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const sql = client();
  const rows = await sql<
    { request_count: number; retry_after: number }[]
  >`
    INSERT INTO t_request_rate_limits (cd_chave, dt_inicio_janela, qt_requisicoes)
    VALUES (${key}, NOW(), 1)
    ON CONFLICT (cd_chave) DO UPDATE SET
      dt_inicio_janela = CASE
        WHEN t_request_rate_limits.dt_inicio_janela <= NOW() - (${windowSeconds} * INTERVAL '1 second')
          THEN NOW()
        ELSE t_request_rate_limits.dt_inicio_janela
      END,
      qt_requisicoes = CASE
        WHEN t_request_rate_limits.dt_inicio_janela <= NOW() - (${windowSeconds} * INTERVAL '1 second')
          THEN 1
        ELSE t_request_rate_limits.qt_requisicoes + 1
      END
    RETURNING
      qt_requisicoes AS request_count,
      GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (
          dt_inicio_janela + (${windowSeconds} * INTERVAL '1 second') - NOW()
        )))::integer
      ) AS retry_after
  `;

  const result = rows[0];
  return {
    allowed: Boolean(result && result.request_count <= maximum),
    retryAfter: result?.retry_after ?? windowSeconds,
  };
}
