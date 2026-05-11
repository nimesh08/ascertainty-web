import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/distributions
 *
 * Records a project repayment distribution after the admin signed + confirmed
 * the on-chain `distribute_repayment` tx.
 *
 * Body: { projectId, amountUsdcRaw, signature }
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const projectId = body.projectId ? String(body.projectId) : null;
  const amount = body.amountUsdcRaw ? String(body.amountUsdcRaw) : null;
  const signature = body.signature ? String(body.signature) : null;
  if (!projectId || !amount || !signature) {
    return NextResponse.json(
      {
        error: "missing-fields",
        required: ["projectId", "amountUsdcRaw", "signature"],
      },
      { status: 400 }
    );
  }

  try {
    await db
      .insert(schema.transactions)
      .values({
        txSig: signature,
        txType: "distribute",
        projectId,
        walletPubkey: session.wallet,
        amountUsdc: amount,
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });

    await db
      .update(schema.projects)
      .set({
        totalDistributed: sql`${schema.projects.totalDistributed} + ${amount}::numeric`,
        status: "repaying",
      })
      .where(eq(schema.projects.id, projectId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/distributions", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
