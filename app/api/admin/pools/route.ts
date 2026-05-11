import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/pools
 *
 * Persists a freshly-created pool after the client has signed the on-chain
 * `create_pool` tx. Indexer will reconcile authoritative fields.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const required = [
    "onchainPoolId",
    "name",
    "targetUsdc",
    "poolPda",
    "poolTokenMint",
    "usdcVault",
    "signature",
  ];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null) {
      return NextResponse.json(
        { error: `missing-field:${k}` },
        { status: 400 }
      );
    }
  }
  try {
    const [pool] = await db
      .insert(schema.pools)
      .values({
        onchainPoolId: BigInt(String(body.onchainPoolId)),
        onchainPda: String(body.poolPda),
        poolTokenMint: String(body.poolTokenMint),
        usdcVault: String(body.usdcVault),
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        targetUsdc: String(body.targetUsdc),
        status: "funding",
      })
      .returning();

    await db
      .insert(schema.transactions)
      .values({
        txSig: String(body.signature),
        txType: "create_pool",
        poolId: pool.id,
        walletPubkey: session.wallet,
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });

    return NextResponse.json({ poolId: pool.id });
  } catch (err) {
    console.error("POST /api/admin/pools", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
