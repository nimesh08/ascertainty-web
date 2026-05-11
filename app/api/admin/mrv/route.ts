import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/mrv
 *
 * Body is discriminated by `action`:
 *   - "baseline"     — records submit_baseline off-chain
 *   - "verification" — records submit_verification off-chain
 *   - "attest"       — marks a verification attested
 *
 * The schema persists a minimal projection of on-chain state (everything
 * quantitative like cost/CO₂/savings lives on-chain only); the indexer
 * reconciles the rest.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action ? String(body.action) : null;
  const signature = body.signature ? String(body.signature) : null;
  const mrvId = body.mrvId ? String(body.mrvId) : null;
  if (!action || !signature || !mrvId) {
    return NextResponse.json(
      { error: "missing-fields", required: ["action", "signature", "mrvId"] },
      { status: 400 }
    );
  }

  try {
    if (action === "baseline") {
      await db.insert(schema.mrvBaselines).values({
        mrvProjectId: mrvId,
        auditorWallet: String(body.auditorWallet),
        energyKwhPerYear: BigInt(String(body.energyKwhPerYear)),
        fuelType: String(body.fuelType),
        reportHash: String(body.reportHashHex),
      });
      await db
        .update(schema.mrvProjects)
        .set({ baselineSubmitted: true, status: "baseline_submitted" })
        .where(eq(schema.mrvProjects.id, mrvId));
      await db
        .insert(schema.transactions)
        .values({
          txSig: signature,
          txType: "submit_baseline",
          walletPubkey: session.wallet,
        })
        .onConflictDoNothing({ target: schema.transactions.txSig });
      return NextResponse.json({ ok: true });
    }

    if (action === "verification") {
      await db.insert(schema.mrvVerifications).values({
        mrvProjectId: mrvId,
        auditorWallet: String(body.auditorWallet),
        periodStart: new Date(Number(body.periodStartMs)),
        periodEnd: new Date(Number(body.periodEndMs)),
        reportHash: String(body.reportHashHex),
      });
      await db
        .update(schema.mrvProjects)
        .set({
          verificationCount: sql`${schema.mrvProjects.verificationCount} + 1`,
        })
        .where(eq(schema.mrvProjects.id, mrvId));
      await db
        .insert(schema.transactions)
        .values({
          txSig: signature,
          txType: "submit_verification",
          walletPubkey: session.wallet,
        })
        .onConflictDoNothing({ target: schema.transactions.txSig });
      return NextResponse.json({ ok: true });
    }

    if (action === "attest") {
      const verificationId = body.verificationId
        ? String(body.verificationId)
        : null;
      if (!verificationId) {
        return NextResponse.json(
          { error: "missing-field:verificationId" },
          { status: 400 }
        );
      }
      await db
        .update(schema.mrvVerifications)
        .set({ attested: true })
        .where(eq(schema.mrvVerifications.id, verificationId));
      await db
        .insert(schema.transactions)
        .values({
          txSig: signature,
          txType: "attest",
          walletPubkey: session.wallet,
        })
        .onConflictDoNothing({ target: schema.transactions.txSig });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown-action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/admin/mrv", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
