import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAuditorSession } from "@/lib/auditor/session";
import { sortEcmsNumerically } from "@/lib/utils/equipment";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/soft-commit
 *
 * Body: {
 *   deal_id: string,
 *   lender_name: string,
 *   lender_email?: string,
 *   loan_amount_inr: number,
 *   interest_rate_bps?: number,
 *   tenure_months?: number,
 *   p5_floor_kwh: number,
 *   notes?: string,
 * }
 *
 * Creates a soft_commitments record linked to the first ECM of the deal
 * (the deal-level commit) and flips that ECM's status to soft_committed.
 *
 * v0.1: we attach the commitment to the *deal*, persisted on the first ECM.
 * v0.2 will refactor to a deal_id top-level resource.
 */
export async function POST(req: Request) {
  const session = await getAuditorSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dealId = body.deal_id ? String(body.deal_id) : null;
  const lenderName = body.lender_name ? String(body.lender_name) : null;
  const loanInr = Number(body.loan_amount_inr);
  const p5Kwh = Number(body.p5_floor_kwh);
  if (!dealId || !lenderName || !Number.isFinite(loanInr) || !Number.isFinite(p5Kwh)) {
    return NextResponse.json(
      { error: "missing-fields", required: ["deal_id", "lender_name", "loan_amount_inr", "p5_floor_kwh"] },
      { status: 400 }
    );
  }

  try {
    const ecms = sortEcmsNumerically(
      await db
        .select()
        .from(schema.underwritingResults)
        .where(eq(schema.underwritingResults.dealId, dealId))
    );
    if (ecms.length === 0) {
      return NextResponse.json({ error: "deal-not-found" }, { status: 404 });
    }
    const anchorEcm = ecms[0];

    const inserted = await db
      .insert(schema.softCommitments)
      .values({
        underwritingResultId: anchorEcm.id,
        lenderName,
        lenderEmail: (body.lender_email as string | undefined) ?? null,
        lenderWallet: session.wallet,
        loanAmountInr: loanInr.toString(),
        interestRateBps: (body.interest_rate_bps as number | undefined) ?? null,
        tenureMonths: (body.tenure_months as number | undefined) ?? null,
        p5FloorKwh: p5Kwh.toString(),
        notes: (body.notes as string | undefined) ?? null,
      })
      .returning({ id: schema.softCommitments.id });

    // Flip all ECMs in this deal to soft_committed
    await db
      .update(schema.underwritingResults)
      .set({ status: "soft_committed", updatedAt: new Date() })
      .where(eq(schema.underwritingResults.dealId, dealId));

    return NextResponse.json({ id: inserted[0]?.id, deal_id: dealId });
  } catch (err) {
    console.error("POST /api/soft-commit", err);
    return NextResponse.json(
      { error: "db-error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
