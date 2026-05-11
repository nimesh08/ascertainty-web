/**
 * POST /api/indexer/sync
 *
 * Admin-gated trigger for `syncAll()`. Authz order (first match wins):
 *   1. `x-dev-indexer-token` header matches `DEV_INDEXER_TOKEN` env
 *      (dev-only escape hatch; never set in prod)
 *   2. `x-indexer-key` header matches `INDEXER_SECRET` env
 *      (back-compat; used by prior CI callers)
 *   3. `x-admin-wallet` header (or `?wallet=` query) appears in
 *      `public.admin_wallets` — a lightweight bearer check until phase 4
 *      wires in proper Privy JWT verification.
 */

import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { syncAll } from "@/lib/indexer/sync-all";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function isAdminWallet(wallet: string | null): Promise<boolean> {
  if (!wallet) return false;
  try {
    const rows = await db
      .select()
      .from(schema.adminWallets)
      .where(eq(schema.adminWallets.walletPubkey, wallet))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const devTokenHeader = req.headers.get("x-dev-indexer-token");
  const devTokenEnv = process.env.DEV_INDEXER_TOKEN;
  const hasDevBypass = Boolean(
    devTokenEnv && devTokenHeader && devTokenHeader === devTokenEnv
  );

  const keyHeader = req.headers.get("x-indexer-key");
  const envKey = process.env.INDEXER_SECRET;
  const hasSecretBypass = Boolean(envKey && keyHeader && keyHeader === envKey);

  if (!hasDevBypass && !hasSecretBypass) {
    const wallet =
      req.headers.get("x-admin-wallet") ??
      new URL(req.url).searchParams.get("wallet");
    if (!(await isAdminWallet(wallet))) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
  }

  const started = Date.now();
  const result = await syncAll();
  const durationMs = Date.now() - started;
  return NextResponse.json(
    { ok: result.ok, counts: result.counts, error: result.error, durationMs },
    { status: result.ok ? 200 : 500 }
  );
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "use POST to trigger" },
    { status: 405 }
  );
}
