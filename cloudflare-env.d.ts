interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    ADMIN_PASSWORD?: string;
    LOOKUP_IP_LIMITER?: RateLimiter;
    LOOKUP_TARGET_LIMITER?: RateLimiter;
    RATE_LIMITER?: RateLimiter;
  };
}

interface D1Result<T = unknown> { results: T[]; success: boolean; }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}
interface Fetcher { fetch(request: Request): Promise<Response>; }
