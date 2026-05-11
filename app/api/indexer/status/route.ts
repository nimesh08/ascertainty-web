import { NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/indexer/status
 *
 * Public endpoint that returns the `indexer_state` table (last-synced-at
 * per key) plus row counts from the main tables. Useful for health checks
 * and admin dashboards.
 */
export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL not set" },
      { status: 500 }
    );
  }
  const sql = postgres(url, { prepare: false, max: 2 });
  try {
    // Ensure the state table exists so the first-ever call doesn't 500.
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS indexer_state (
        key text PRIMARY KEY,
        last_synced_at timestamptz,
        last_signature text,
        rows_touched numeric(20,0) DEFAULT '0',
        notes text
      )
    `);
    // Each count is optional — if any table doesn't exist we still return a
    // partial response rather than 500, because Phase 2B/2C may rename or
    // replace some tables (e.g. `transactions` -> `activity`). The indexer
    // itself only depends on the core exira tables, not the full set.
    const TABLES = [
      "projects",
      "pools",
      "pool_projects",
      "auditors",
      "mrv_projects",
      "mrv_baselines",
      "mrv_verifications",
      "transactions",
      "investor_positions",
    ];
    const counts: Record<string, number | null> = {};
    for (const t of TABLES) {
      try {
        const [row] = await sql.unsafe(`SELECT count(*)::int AS n FROM ${t}`);
        counts[t] = row?.n ?? 0;
      } catch {
        counts[t] = null;
      }
    }
    const state = await sql`SELECT key, last_synced_at, last_signature, rows_touched FROM indexer_state ORDER BY key`;

    return NextResponse.json({
      ok: true,
      now: new Date().toISOString(),
      counts,
      state,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}
