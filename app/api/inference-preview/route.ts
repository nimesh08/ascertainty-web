import { NextResponse } from "next/server";
import { getAuditorSession } from "@/lib/auditor/session";
import { pinnPredict, type PinnPredictRequest } from "@/lib/inference-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/inference-preview
 *
 * Non-persisting variant of /api/predict used by the auditor intake form for
 * live confidence-band updates as fields fill in. Does NOT write to the DB —
 * the auditor explicitly persists via /api/predict on form submit.
 *
 * Auth still required (auditor session) to keep this endpoint from being
 * spammed externally.
 */
export async function POST(req: Request) {
  const session = await getAuditorSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const baseline = Number(body.baseline_kwh_per_year);
  if (!Number.isFinite(baseline) || baseline <= 0) {
    return NextResponse.json(
      { error: "missing baseline_kwh_per_year" },
      { status: 400 }
    );
  }

  const predictReq: PinnPredictRequest = {
    equipment_type: body.equipment_type as string | undefined,
    ecm_category: body.ecm_category as string | undefined,
    ecm_description: (body.ecm_description as string | undefined) ?? "",
    industry_sector: (body.industry_sector as string | undefined) ?? "other",
    baseline_kwh_per_year: baseline,
    compressor_rated_kw: body.compressor_rated_kw as number | undefined,
    leakage_pct: body.leakage_pct as number | undefined,
    electricity_rate_inr_kwh: (body.electricity_rate_inr_kwh as number | undefined) ?? 8.0,
    investment_inr: body.investment_inr as number | undefined,
  };

  try {
    const prediction = await pinnPredict(predictReq);
    return NextResponse.json(prediction);
  } catch (err) {
    console.error("inference-preview", err);
    return NextResponse.json(
      { error: "inference-unavailable", message: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}
