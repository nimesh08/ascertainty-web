import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAuditorSession } from "@/lib/auditor/session";
import { pinnPredict, type PinnPredictRequest } from "@/lib/inference-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/audit/upload
 *
 * Body shape (subset of outputs/AUDIT_SCHEMA.md):
 *   {
 *     deal_id: string
 *     facility_profile: {
 *       plant_name: string
 *       sector?: string                  // textiles / auto_components / other
 *       unit_cost_inr_per_kwh?: number
 *       location?: string
 *     }
 *     ecm_list: [{
 *       ecm_id: string
 *       equipment_type?: string
 *       category?: string                // alias for equipment_type / ecm_category
 *       description?: string
 *       baseline_kwh_per_year: number
 *       compressor_rated_kw?: number
 *       leakage_pct?: number
 *       investment_inr?: number
 *       ...
 *     }, ...]
 *   }
 *
 * For each ECM: call PINN inference, persist to underwriting_results.
 * Returns: per-ECM prediction + persisted row id, plus summary stats.
 */
export async function POST(req: Request) {
  const session = await getAuditorSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dealId = body.deal_id ? String(body.deal_id) : null;
  const facility = (body.facility_profile as Record<string, unknown> | undefined) ?? {};
  const ecmList = Array.isArray(body.ecm_list) ? (body.ecm_list as Record<string, unknown>[]) : [];

  if (!dealId || ecmList.length === 0) {
    return NextResponse.json(
      { error: "missing-fields", required: ["deal_id", "ecm_list[]"] },
      { status: 400 }
    );
  }

  const sectorRaw = String(facility.sector ?? "other").toLowerCase();
  const sector =
    sectorRaw.includes("textile") || sectorRaw.includes("spinning") || sectorRaw.includes("knit")
      ? "textiles"
      : sectorRaw.includes("auto") || sectorRaw.includes("casting") || sectorRaw.includes("die")
        ? "auto_components"
        : "other";

  const electricityRate = Number(facility.unit_cost_inr_per_kwh ?? 8.0);

  const results: Array<{ ecm_id: string; id?: string; prediction?: unknown; error?: string }> = [];

  for (const ecm of ecmList) {
    const ecmId = ecm.ecm_id ? String(ecm.ecm_id) : null;
    const baseline = Number(ecm.baseline_kwh_per_year);
    if (!ecmId || !Number.isFinite(baseline) || baseline <= 0) {
      results.push({ ecm_id: String(ecm.ecm_id ?? "?"), error: "missing baseline_kwh_per_year" });
      continue;
    }

    const predictReq: PinnPredictRequest = {
      equipment_type: ecm.equipment_type as string | undefined,
      ecm_category: (ecm.category ?? ecm.ecm_category) as string | undefined,
      ecm_description: (ecm.description as string | undefined) ?? "",
      industry_sector: sector,
      baseline_kwh_per_year: baseline,
      compressor_rated_kw: ecm.compressor_rated_kw as number | undefined,
      leakage_pct: ecm.leakage_pct as number | undefined,
      electricity_rate_inr_kwh: electricityRate,
      investment_inr: ecm.investment_inr as number | undefined,
    };

    try {
      const prediction = await pinnPredict(predictReq);
      const row = {
        dealId,
        ecmId,
        equipmentType: prediction.equipment_type,
        sector,
        description: predictReq.ecm_description ?? null,
        auditInputsJson: predictReq as unknown as object,
        predictionJson: prediction as unknown as object,
        modelUsed: prediction.model_used,
        sigmaScaleApplied: prediction.sigma_scale_applied.toString(),
        pinnSavingsKwh: prediction.predicted_savings_kwh.toString(),
        pinnP5LowerKwh: prediction.savings_lower_p5_kwh.toString(),
        pinnP95UpperKwh: prediction.savings_upper_p95_kwh.toString(),
        pinnSigmaKwh: prediction.sigma_kwh.toString(),
        confidenceGrade: prediction.confidence_grade,
        baselineKwhPerYear: baseline.toString(),
        investmentInr: predictReq.investment_inr ? predictReq.investment_inr.toString() : null,
        electricityRateInrKwh: electricityRate.toString(),
        annualSavingsInr: prediction.annual_savings_inr ? prediction.annual_savings_inr.toString() : null,
        paybackMonths: prediction.payback_months ? prediction.payback_months.toString() : null,
        p5PaybackMonths: prediction.p5_payback_months ? prediction.p5_payback_months.toString() : null,
        status: "predicted" as const,
        auditorWallet: session.wallet,
        updatedAt: new Date(),
      };

      const inserted = await db
        .insert(schema.underwritingResults)
        .values(row)
        .onConflictDoUpdate({
          target: [schema.underwritingResults.dealId, schema.underwritingResults.ecmId],
          set: { ...row, updatedAt: new Date() },
        })
        .returning({ id: schema.underwritingResults.id });

      results.push({ ecm_id: ecmId, id: inserted[0]?.id, prediction });
    } catch (err) {
      console.error(`predict failure for ${ecmId}`, err);
      results.push({
        ecm_id: ecmId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    deal_id: dealId,
    facility: facility,
    results,
    summary: {
      total: results.length,
      succeeded: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
    },
  });
}
