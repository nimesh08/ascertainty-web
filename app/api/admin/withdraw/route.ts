import { NextResponse } from "next/server";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { requireAdmin, AdminAuthError } from "@/lib/privy/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  txSig: z.string().min(32).max(128),
  amount: z.string().regex(/^\d+$/, "amount must be a non-negative integer in base units"),
  destination: z
    .string()
    .min(32)
    .max(64)
    .refine((v) => {
      try {
        // base58 check via PublicKey — accepts any owner / ATA-style pubkey
        new PublicKey(v);
        return true;
      } catch {
        return false;
      }
    }, "destination must be a base58 Solana pubkey"),
});

/**
 * POST /api/admin/withdraw
 *
 * Records an admin-signed `withdraw_project_funds` transaction as an audit
 * row in `transactions`. The USDC vault balance change itself is reconciled
 * by the indexer on the next sync; this row is purely for attribution /
 * operator history. No mutation of `projects` state.
 *
 * Auth: `requireAdmin` — signer must match a row in `admin_wallets`.
 */
export async function POST(req: Request) {
  let session: { walletPubkey: string };
  try {
    session = await requireAdmin(req);
  } catch (err) {
    if (err instanceof AdminAuthError) return err.response;
    throw err;
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { projectId, txSig, amount, destination } = parsed.data;

  try {
    const rows = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "project-not-found" }, { status: 404 });
    }

    await db
      .insert(schema.transactions)
      .values({
        txSig,
        txType: "withdraw",
        walletPubkey: session.walletPubkey,
        projectId,
        amountUsdc: amount,
        blockTime: new Date(),
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });

    return NextResponse.json({ ok: true, destination });
  } catch (err) {
    console.error("POST /api/admin/withdraw", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
