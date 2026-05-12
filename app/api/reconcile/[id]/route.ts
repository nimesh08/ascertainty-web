import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAuditorSession } from "@/lib/auditor/session";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reconcile/[id]
 *
 * Body: { realized_savings_kwh: number, realized_at?: ISO-8601 }
 *
 * `[id]` is an underwriting_results.id (uuid).
 *
 * Computes:
 *   - point_estimate_delta_pct = (realized - point) / point * 100
 *   - p5_violated_flag         = realized < pinn_p5_lower_kwh
 *   - reconciliation_passes    = |point_estimate_delta_pct| <= 15 AND NOT p5_violated
 *
 * Per MVP success criterion: ±15% on point estimate AND ±20% on P5 lower bound.
 * Sets status='reconciled'.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getAuditorSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing-id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const realized = Number(body.realized_savings_kwh);
  if (!Number.isFinite(realized) || realized < 0) {
    return NextResponse.json(
      { error: "missing-or-invalid: realized_savings_kwh" },
      { status: 400 }
    );
  }
  const realizedAt = body.realized_at ? new Date(String(body.realized_at)) : new Date();

  try {
    const rows = await db
      .select()
      .from(schema.underwritingResults)
      .where(eq(schema.underwritingResults.id, id))
      .limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    const row = rows[0];

    const point = Number(row.pinnSavingsKwh ?? 0);
    const p5 = Number(row.pinnP5LowerKwh ?? 0);
    if (point <= 0) {
      return NextResponse.json(
        { error: "no-prediction-to-reconcile" },
        { status: 409 }
      );
    }

    const deltaPct = ((realized - point) / point) * 100;
    const p5Violated = realized < p5;
    const passesPoint = Math.abs(deltaPct) <= 15;
    const passesP5 = !p5Violated; // P5 = lower bound; "within ±20% on P5" → realized ≥ P5 is the harder of the two
    const reconciliationPasses = passesPoint && passesP5;

    await db
      .update(schema.underwritingResults)
      .set({
        realizedSavingsKwh: realized.toString(),
        realizedAt,
        pointEstimateDeltaPct: deltaPct.toFixed(2),
        p5ViolatedFlag: p5Violated,
        reconciliationPasses,
        status: "reconciled",
        updatedAt: new Date(),
      })
      .where(eq(schema.underwritingResults.id, id));

    return NextResponse.json({
      id,
      realized_savings_kwh: realized,
      pinn_predicted_kwh: point,
      pinn_p5_lower_kwh: p5,
      point_estimate_delta_pct: Number(deltaPct.toFixed(2)),
      p5_violated_flag: p5Violated,
      reconciliation_passes: reconciliationPasses,
      success_criterion: "±15% on point estimate AND realized ≥ P5",
    });
  } catch (err) {
    console.error("POST /api/reconcile/[id]", err);
    return NextResponse.json(
      { error: "db-error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
