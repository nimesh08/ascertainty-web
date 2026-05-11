/**
 * Shared Postgres client for indexer sync modules.
 *
 * Uses the `postgres` driver directly (not Drizzle) so raw SQL upserts stay
 * resilient to drift between `lib/db/schema.ts` and the live database shape.
 */

import type { Sql } from "postgres";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __exiraIndexerSql: Sql | undefined;
}

export function getIndexerSql(): Sql {
  if (globalThis.__exiraIndexerSql) return globalThis.__exiraIndexerSql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, {
    prepare: false,
    max: 3,
    idle_timeout: 10,
  });
  globalThis.__exiraIndexerSql = client;
  return client;
}

export async function closeIndexerSql(): Promise<void> {
  if (globalThis.__exiraIndexerSql) {
    await globalThis.__exiraIndexerSql.end({ timeout: 5 });
    globalThis.__exiraIndexerSql = undefined;
  }
}

export interface SyncResult {
  count: number;
  upserted: number;
  skipped: number;
  errors: Array<{ pda?: string; error: string }>;
}

export function emptyResult(): SyncResult {
  return { count: 0, upserted: 0, skipped: 0, errors: [] };
}
