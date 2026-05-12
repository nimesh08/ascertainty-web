import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAuditorSession } from "@/lib/auditor/session";
import { pinnPredict, type PinnPredictRequest } from "@/lib/inference-client";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/predict
 *
 * Body shape (additive to PinnPredictRequest):
 *   {
 *     deal_id: string                      // human-readable URL slug
 *     ecm_id: string                       // ECM ordinal/name within the deal
 *     ...PinnPredictRequest fields...
 *     project_id?: string (uuid)           // optional FK to projects
 *     mrv_project_id?: string (uuid)       // optional FK to mrv_projects
 *   }
 *
 * Calls the inference service, persists to `underwriting_results` (upsert on
 * unique deal+ecm), and returns the prediction + persisted row id.
 */
export async function POST(req: Request) {
  const session = await getAuditorSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const dealId = body.deal_id ? String(body.deal_id) : null;
  const ecmId = body.ecm_id ? String(body.ecm_id) : null;
  const baselineKwh = Number(body.baseline_kwh_per_year);
  if (!dealId || !ecmId || !Number.isFinite(baselineKwh) || baselineKwh <= 0) {
    return NextResponse.json(
      { error: "missing-fields", required: ["deal_id", "ecm_id", "baseline_kwh_per_year"] },
      { status: 400 }
    );
  }

  // Build PINN request
  const predictReq: PinnPredictRequest = {
    equipment_type: body.equipment_type as string | undefined,
    ecm_category: body.ecm_category as string | undefined,
    ecm_description: (body.ecm_description as string | undefined) ?? "",
    industry_sector: (body.industry_sector as string | undefined) ?? "other",
    baseline_kwh_per_year: baselineKwh,
    compressor_rated_kw: body.compressor_rated_kw as number | undefined,
    leakage_pct: body.leakage_pct as number | undefined,
    plant_mean_motor_load_factor: body.plant_mean_motor_load_factor as number | undefined,
    plant_max_motor_oversize: body.plant_max_motor_oversize as number | undefined,
    plant_pct_vfd_motors: body.plant_pct_vfd_motors as number | undefined,
    plant_avg_compressor_leakage_pct: body.plant_avg_compressor_leakage_pct as number | undefined,
    electricity_rate_inr_kwh: (body.electricity_rate_inr_kwh as number | undefined) ?? 8.0,
    investment_inr: body.investment_inr as number | undefined,
    intent_flag_overrides: body.intent_flag_overrides as Record<string, number> | undefined,
  };

  let prediction;
  try {
    prediction = await pinnPredict(predictReq);
  } catch (err) {
    console.error("inference call failed", err);
    return NextResponse.json(
      { error: "inference-unavailable", message: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }

  // Upsert into underwriting_results (one row per deal+ecm)
  const sector = predictReq.industry_sector ?? "other";
  const baseFields = {
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
    baselineKwhPerYear: baselineKwh.toString(),
    investmentInr: predictReq.investment_inr ? predictReq.investment_inr.toString() : null,
    electricityRateInrKwh: (predictReq.electricity_rate_inr_kwh ?? 8.0).toString(),
    annualSavingsInr: prediction.annual_savings_inr ? prediction.annual_savings_inr.toString() : null,
    paybackMonths: prediction.payback_months ? prediction.payback_months.toString() : null,
    p5PaybackMonths: prediction.p5_payback_months ? prediction.p5_payback_months.toString() : null,
    status: "predicted" as const,
    auditorWallet: session.wallet,
    projectId: (body.project_id as string | undefined) ?? null,
    mrvProjectId: (body.mrv_project_id as string | undefined) ?? null,
    updatedAt: new Date(),
  };

  try {
    const inserted = await db
      .insert(schema.underwritingResults)
      .values(baseFields)
      .onConflictDoUpdate({
        target: [schema.underwritingResults.dealId, schema.underwritingResults.ecmId],
        set: {
          ...baseFields,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.underwritingResults.id });
    return NextResponse.json({ id: inserted[0]?.id, prediction });
  } catch (err) {
    console.error("underwriting upsert", err);
    return NextResponse.json(
      { error: "db-error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
