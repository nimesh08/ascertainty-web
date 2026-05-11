/**
 * POST /api/investor/transactions
 *
 * Records an investor-signed transaction (buy / claim / withdraw against a
 * project or pool) as a row in `public.transactions` so the portfolio
 * transaction history reflects it immediately — without waiting for an
 * account-state indexer sweep (which doesn't index signatures).
 *
 * Auth: best-effort. If a Privy session is present we verify the claimed
 * wallet matches the verified Solana wallet; if not present (e.g. dev /
 * Phantom-only session where the id-token isn't forwarded) we log a warning
 * and accept the write. The table has a unique constraint on `tx_sig` so
 * any replay is idempotent via `ON CONFLICT DO NOTHING`.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getAuthedUser } from "@/lib/privy/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const investorTxTypes = [
  "buy_project",
  "claim_project",
  "withdraw",
  "buy_pool",
  "claim_pool",
] as const;

const bodySchema = z.object({
  txSig: z.string().min(32).max(128),
  txType: z.enum(investorTxTypes),
  projectId: z.string().uuid().optional(),
  poolId: z.string().uuid().optional(),
  amountUsdc: z
    .string()
    .regex(/^\d+$/)
    .optional(),
  tokenAmount: z
    .string()
    .regex(/^\d+$/)
    .optional(),
  walletPubkey: z.string().min(32).max(64),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const {
    txSig,
    txType,
    projectId,
    poolId,
    amountUsdc,
    tokenAmount,
    walletPubkey,
  } = parsed.data;

  try {
    const verified = await getAuthedUser(req).catch(() => null);
    if (verified?.walletPubkey && verified.walletPubkey !== walletPubkey) {
      return NextResponse.json(
        { error: "wallet-mismatch" },
        { status: 403 }
      );
    }
    if (!verified) {
      console.warn(
        "[investor/transactions] no Privy session; accepting write for",
        walletPubkey,
        txSig
      );
    }

    if (projectId) {
      const rows = await db
        .select({ id: schema.projects.id })
        .from(schema.projects)
        .where(eq(schema.projects.id, projectId))
        .limit(1);
      if (rows.length === 0) {
        return NextResponse.json(
          { error: "project-not-found" },
          { status: 404 }
        );
      }
    }
    if (poolId) {
      const rows = await db
        .select({ id: schema.pools.id })
        .from(schema.pools)
        .where(eq(schema.pools.id, poolId))
        .limit(1);
      if (rows.length === 0) {
        return NextResponse.json({ error: "pool-not-found" }, { status: 404 });
      }
    }

    await db
      .insert(schema.transactions)
      .values({
        txSig,
        txType,
        walletPubkey,
        projectId: projectId ?? null,
        poolId: poolId ?? null,
        amountUsdc: amountUsdc ?? null,
        tokenAmount: tokenAmount ?? null,
        blockTime: new Date(),
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/investor/transactions", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
