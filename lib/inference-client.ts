import "server-only";

/**
 * Server-side client for the Ascertainty inference FastAPI service.
 *
 * In production: INFERENCE_BASE_URL = https://inference.ascertainty.com (or similar)
 * Locally: defaults to http://127.0.0.1:8000 (uvicorn dev server)
 */

const BASE_URL = process.env.INFERENCE_BASE_URL ?? "http://127.0.0.1:8000";
const TIMEOUT_MS = Number(process.env.INFERENCE_TIMEOUT_MS ?? 10_000);

export interface PinnPredictRequest {
  equipment_type?: string;
  ecm_category?: string;
  ecm_description?: string;
  industry_sector?: string;
  baseline_kwh_per_year: number;
  compressor_rated_kw?: number;
  leakage_pct?: number;
  plant_mean_motor_load_factor?: number;
  plant_max_motor_oversize?: number;
  plant_pct_vfd_motors?: number;
  plant_avg_compressor_leakage_pct?: number;
  electricity_rate_inr_kwh?: number;
  investment_inr?: number;
  intent_flag_overrides?: Record<string, number>;
}

export interface PinnPredictResponse {
  predicted_savings_kwh: number;
  savings_lower_p5_kwh: number;
  savings_upper_p95_kwh: number;
  sigma_kwh: number;
  sigma_scale_applied: number;
  confidence_grade: "A" | "B" | "C";
  predicted_savings_pct: number;
  model_used: string;
  equipment_type: string;
  industry_sector: string;
  intent_flags: Record<string, number>;
  annual_savings_inr: number | null;
  payback_months: number | null;
  p5_payback_months: number | null;
  is_below_baseline_floor: boolean;
}

export interface PinnUnderwriteTerms {
  conservative_payback_months: number;
  lower_savings_inr_annual: number;
  annual_debt_service_inr: number;
  tenure_months: number;
  tenure_years: number;
  target_dscr: number;
  loan_amount_inr: number;
  loan_to_investment_pct: number;
  vault_irr_target: number;
}

export interface PinnUnderwriteResponse {
  prediction: PinnPredictResponse;
  terms: PinnUnderwriteTerms;
  summary_markdown: string | null;
}

async function _fetch<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`inference ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function pinnPredict(body: PinnPredictRequest): Promise<PinnPredictResponse> {
  return _fetch<PinnPredictResponse>("/v1/predict", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function pinnUnderwrite(
  body: PinnPredictRequest & { investment_inr: number }
): Promise<PinnUnderwriteResponse> {
  return _fetch<PinnUnderwriteResponse>("/v1/underwrite", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function pinnHealth(): Promise<unknown> {
  return _fetch<unknown>("/v1/health", { method: "GET" });
}
