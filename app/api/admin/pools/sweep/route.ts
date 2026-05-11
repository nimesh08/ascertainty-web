import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/pools/sweep
 *
 * Records a `distribute_pool_returns` tx. Bumps `total_distributed` and
 * flips the pool to `distributing` until the indexer catches up.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const poolId = body.poolId ? String(body.poolId) : null;
  const amount = body.amountUsdcRaw ? String(body.amountUsdcRaw) : null;
  const signature = body.signature ? String(body.signature) : null;
  if (!poolId || !amount || !signature) {
    return NextResponse.json(
      {
        error: "missing-fields",
        required: ["poolId", "amountUsdcRaw", "signature"],
      },
      { status: 400 }
    );
  }
  try {
    await db
      .insert(schema.transactions)
      .values({
        txSig: signature,
        txType: "distribute_pool",
        poolId,
        walletPubkey: session.wallet,
        amountUsdc: amount,
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });

    await db
      .update(schema.pools)
      .set({
        totalDistributed: sql`${schema.pools.totalDistributed} + ${amount}::numeric`,
        status: "distributing",
      })
      .where(eq(schema.pools.id, poolId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/pools/sweep", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
