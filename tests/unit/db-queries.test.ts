import { describe, it, expect, beforeAll, afterAll } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

/**
 * These tests hit the real Postgres (Neon) DATABASE_URL from `.env.local`
 * but in an isolated, disposable schema named `test_web_v2` so they never
 * interfere with production data. If DATABASE_URL is missing we skip.
 */
const DB_URL = process.env.DATABASE_URL;
const TEST_SCHEMA = "test_web_v2";
let sql: ReturnType<typeof postgres> | null = null;
type Db = ReturnType<typeof drizzle<typeof schema>>;
let db: Db | null = null;

const hasDb = !!DB_URL;
const itDb = hasDb ? it : it.skip;
const describeDb = hasDb ? describe : describe.skip;

async function setupTestSchema() {
  if (!DB_URL) return;
  sql = postgres(DB_URL, { prepare: false, max: 4 });

  // Fresh schema
  await sql.unsafe(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
  await sql.unsafe(`CREATE SCHEMA ${TEST_SCHEMA}`);
  await sql.unsafe(`SET search_path TO ${TEST_SCHEMA}, public`);

  // Minimal tables matching schema.ts for the pieces we're testing.
  // We keep this tight — not the full MRV/pool tree — since that's covered
  // elsewhere by drizzle-kit generated migrations.
  await sql.unsafe(`
    CREATE TABLE ${TEST_SCHEMA}.admin_wallets (
      wallet_pubkey text PRIMARY KEY,
      display_name text,
      added_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE ${TEST_SCHEMA}.investors (
      wallet_pubkey text PRIMARY KEY,
      privy_user_id text UNIQUE,
      email text,
      phone text,
      kyc_status text NOT NULL DEFAULT 'unverified',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TYPE ${TEST_SCHEMA}.project_status AS ENUM ('pending','funding','active','repaying','completed','cancelled');
    CREATE TABLE ${TEST_SCHEMA}.projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      onchain_project_id bigint UNIQUE,
      onchain_pda text,
      token_mint text,
      usdc_vault text,
      msme_name text NOT NULL,
      sector text NOT NULL,
      location text NOT NULL,
      upgrade_type text NOT NULL,
      target_usdc numeric(20,0) NOT NULL,
      tokens_sold numeric(20,0) NOT NULL DEFAULT '0',
      total_distributed numeric(20,0) NOT NULL DEFAULT '0',
      cumulative_per_token numeric(40,0) NOT NULL DEFAULT '0',
      term_months integer NOT NULL,
      status ${TEST_SCHEMA}.project_status NOT NULL DEFAULT 'pending',
      mrv_project_id uuid,
      activated_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      synced_at timestamptz
    );
  `);

  db = drizzle(sql, { schema });
}

beforeAll(async () => {
  if (hasDb) await setupTestSchema();
});

afterAll(async () => {
  if (sql) {
    try {
      await sql.unsafe(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
    } catch {
      /* ignore */
    }
    await sql.end({ timeout: 5 });
    sql = null;
  }
});

describeDb("db: admin_wallets", () => {
  itDb("insert + select round-trip", async () => {
    await sql!.unsafe(`
      INSERT INTO ${TEST_SCHEMA}.admin_wallets (wallet_pubkey, display_name)
      VALUES ('AdMinOne1111111111111111111111111111111111', 'Test Admin')
    `);
    const rows = await sql!.unsafe(
      `SELECT wallet_pubkey, display_name FROM ${TEST_SCHEMA}.admin_wallets`
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].wallet_pubkey).toBe("AdMinOne1111111111111111111111111111111111");
  });

  itDb("drizzle select via schema.adminWallets (search_path)", async () => {
    const rows = await db!
      .select()
      .from(schema.adminWallets)
      .where(eq(schema.adminWallets.walletPubkey, "AdMinOne1111111111111111111111111111111111"));
    expect(rows).toHaveLength(1);
    expect(rows[0].displayName).toBe("Test Admin");
  });
});

describeDb("db: investors", () => {
  itDb("insert with kyc_status default", async () => {
    await sql!.unsafe(`
      INSERT INTO ${TEST_SCHEMA}.investors (wallet_pubkey, email)
      VALUES ('Inv1111111111111111111111111111111111111111', 'alice@example.com')
    `);
    const rows = await sql!.unsafe(
      `SELECT wallet_pubkey, kyc_status FROM ${TEST_SCHEMA}.investors`
    );
    expect(rows[0].kyc_status).toBe("unverified");
  });

  itDb("enforces unique privy_user_id", async () => {
    await sql!.unsafe(`
      INSERT INTO ${TEST_SCHEMA}.investors (wallet_pubkey, privy_user_id)
      VALUES ('Inv2222222222222222222222222222222222222222', 'privy-abc')
    `);
    let caught: Error | null = null;
    try {
      await sql!.unsafe(`
        INSERT INTO ${TEST_SCHEMA}.investors (wallet_pubkey, privy_user_id)
        VALUES ('Inv3333333333333333333333333333333333333333', 'privy-abc')
      `);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
  });
});

describeDb("db: projects enum + numerics", () => {
  itDb("insert pending project with large numeric target", async () => {
    await sql!.unsafe(`
      INSERT INTO ${TEST_SCHEMA}.projects (
        onchain_project_id, msme_name, sector, location, upgrade_type,
        target_usdc, term_months
      ) VALUES (1, 'Alpha', 'Textile', 'TN', 'motor', '1000000000', 24)
    `);
    const rows = await sql!.unsafe(
      `SELECT msme_name, target_usdc::text AS t, status FROM ${TEST_SCHEMA}.projects WHERE onchain_project_id=1`
    );
    expect(rows[0].msme_name).toBe("Alpha");
    expect(rows[0].t).toBe("1000000000");
    expect(rows[0].status).toBe("pending");
  });

  itDb("rejects invalid status enum value", async () => {
    let caught: Error | null = null;
    try {
      await sql!.unsafe(`
        INSERT INTO ${TEST_SCHEMA}.projects (
          onchain_project_id, msme_name, sector, location, upgrade_type,
          target_usdc, term_months, status
        ) VALUES (2, 'X', 'Y', 'Z', 'W', '1', 12, 'nonsense-value')
      `);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).not.toBeNull();
  });

  itDb("drizzle select: filter by status", async () => {
    const rows = await db!
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.status, "pending"));
    expect(rows.length).toBeGreaterThan(0);
  });
});

// Fallback test that always runs so the file never reports 0 tests
// when DATABASE_URL is missing.
describe("db-queries smoke (no-db)", () => {
  it("schema module exports expected tables", () => {
    expect(schema.adminWallets).toBeDefined();
    expect(schema.investors).toBeDefined();
    expect(schema.projects).toBeDefined();
    expect(schema.pools).toBeDefined();
    expect(schema.transactions).toBeDefined();
  });
});
