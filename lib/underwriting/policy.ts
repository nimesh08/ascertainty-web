/**
 * Single-source-of-truth evaluator for the Exira underwriting policy.
 *
 * Every UI surface (lender preview, borrower view, LP drill-down) consumes
 * `evaluatePolicy()` so a threshold change in UNDERWRITING_POLICY.md flows
 * uniformly. The `policySection` field on each check links the row to its
 * authoritative section in the policy doc rendered at /docs/underwriting-policy.
 */

import {
  TARGET_DSCR_P5,
  MIN_DSCR_P50,
  MIN_EBITDA_COVERAGE,
  MIN_TENOR_MONTHS,
  MAX_TENOR_MONTHS,
  TENOR_PAYBACK_RATIO_MIN,
  TENOR_PAYBACK_RATIO_MAX,
  MIN_LOAN_INR,
  MAX_LOAN_INR,
  MAX_LOAN_TO_CAPEX,
  computeDscr,
  computeEbitdaCoverage,
  recommendedLoanInr,
} from "./sizing";

export type EligibilityStatus =
  | "eligible"
  | "eligible_enhanced_mv"
  | "ineligible_grade_c"
  | "ineligible_dscr"
  | "ineligible_ebitda"
  | "ineligible_other"
  | "pending";

export interface PolicyCheck {
  name: string;
  actual: string;
  threshold: string;
  passes: boolean;
  policySection: string; // e.g. "5.1"
}

export interface PolicyEvaluation {
  status: EligibilityStatus;
  checks: PolicyCheck[];
  reasons: Array<{ code: string; message: string; policySection: string }>;
  // Computed economics surfaced for the KPI tiles
  loanInr: number;
  tenureMonths: number;
  annualDebtServiceInr: number;
  dscrAtP5: number;
  dscrAtP50: number;
  ebitdaCoverage: number | null; // null if borrower EBITDA not provided
}

export interface EvaluatePolicyInput {
  predictedKwh: number;
  p5Kwh: number;
  p50Kwh: number; // typically equal to predictedKwh for normal output
  grade: "A" | "B" | "C" | null | undefined;
  electricityRateInrKwh: number;
  investmentInr: number;
  paybackMonths: number | null;
  borrowerEbitdaInr: number | null;
}

const fmtRatio = (n: number) => `${n.toFixed(2)}×`;
const fmtPct = (n: number) => `${(n * 100).toFixed(0)}%`;
const fmtInr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function evaluatePolicy(input: EvaluatePolicyInput): PolicyEvaluation {
  const sized = recommendedLoanInr(input.p5Kwh, input.electricityRateInrKwh, input.grade);
  const dscrAtP5 = computeDscr(input.p5Kwh, input.electricityRateInrKwh, sized.annualDebtServiceInr);
  const dscrAtP50 = computeDscr(input.p50Kwh, input.electricityRateInrKwh, sized.annualDebtServiceInr);
  const ebitdaCoverage =
    input.borrowerEbitdaInr != null
      ? computeEbitdaCoverage(input.borrowerEbitdaInr, sized.annualDebtServiceInr)
      : null;

  const loanToCapex = input.investmentInr > 0 ? sized.loanInr / input.investmentInr : 0;
  const tenorPaybackRatio = input.paybackMonths && input.paybackMonths > 0
    ? sized.tenureMonths / input.paybackMonths
    : null;

  const checks: PolicyCheck[] = [
    {
      name: "DSCR @ P5",
      actual: fmtRatio(dscrAtP5),
      threshold: `≥ ${TARGET_DSCR_P5.toFixed(2)}×`,
      passes: dscrAtP5 >= TARGET_DSCR_P5,
      policySection: "5.1",
    },
    {
      name: "DSCR @ P50",
      actual: fmtRatio(dscrAtP50),
      threshold: `≥ ${MIN_DSCR_P50.toFixed(2)}×`,
      passes: dscrAtP50 >= MIN_DSCR_P50,
      policySection: "5.1",
    },
    {
      name: "EBITDA Coverage",
      actual: ebitdaCoverage != null ? fmtRatio(ebitdaCoverage) : "—",
      threshold: `≥ ${MIN_EBITDA_COVERAGE.toFixed(2)}×`,
      passes: ebitdaCoverage != null && ebitdaCoverage >= MIN_EBITDA_COVERAGE,
      policySection: "5.1",
    },
    {
      name: "Tenor / payback",
      actual: tenorPaybackRatio != null ? `${tenorPaybackRatio.toFixed(2)}×` : "—",
      threshold: `${TENOR_PAYBACK_RATIO_MIN.toFixed(1)}–${TENOR_PAYBACK_RATIO_MAX.toFixed(1)}×`,
      passes:
        tenorPaybackRatio != null &&
        tenorPaybackRatio >= TENOR_PAYBACK_RATIO_MIN &&
        tenorPaybackRatio <= TENOR_PAYBACK_RATIO_MAX,
      policySection: "5.2",
    },
    {
      name: "Tenor bounds",
      actual: `${sized.tenureMonths} mo`,
      threshold: `${MIN_TENOR_MONTHS}–${MAX_TENOR_MONTHS} mo`,
      passes: sized.tenureMonths >= MIN_TENOR_MONTHS && sized.tenureMonths <= MAX_TENOR_MONTHS,
      policySection: "5.2",
    },
    {
      name: "Loan-to-CapEx",
      actual: fmtPct(loanToCapex),
      threshold: `≤ ${fmtPct(MAX_LOAN_TO_CAPEX)}`,
      passes: loanToCapex > 0 && loanToCapex <= MAX_LOAN_TO_CAPEX,
      policySection: "5.3",
    },
    {
      name: "Min loan",
      actual: fmtInr(sized.loanInr),
      threshold: `≥ ${fmtInr(MIN_LOAN_INR)}`,
      passes: sized.loanInr >= MIN_LOAN_INR,
      policySection: "5.3",
    },
    {
      name: "Max loan (single borrower)",
      actual: fmtInr(sized.loanInr),
      threshold: `≤ ${fmtInr(MAX_LOAN_INR)}`,
      passes: sized.loanInr <= MAX_LOAN_INR,
      policySection: "5.3",
    },
    {
      name: "Prediction grade",
      actual: input.grade ?? "—",
      threshold: "A or B",
      passes: input.grade === "A" || input.grade === "B",
      policySection: "5.4",
    },
  ];

  // Determine overall status. Order matters — first failure wins for the status field.
  const reasons: PolicyEvaluation["reasons"] = [];
  let status: EligibilityStatus;

  if (input.grade === "C") {
    status = "ineligible_grade_c";
    reasons.push({
      code: "grade_c",
      message: "Grade C predictions require re-audit to tighten σ.",
      policySection: "4.2",
    });
  } else if (!checks.find((c) => c.name === "DSCR @ P5")?.passes) {
    status = "ineligible_dscr";
    reasons.push({
      code: "dscr_p5",
      message: `DSCR at P5 is ${fmtRatio(dscrAtP5)}, below ${TARGET_DSCR_P5.toFixed(2)}× minimum.`,
      policySection: "5.1",
    });
  } else if (
    ebitdaCoverage != null &&
    !checks.find((c) => c.name === "EBITDA Coverage")?.passes
  ) {
    status = "ineligible_ebitda";
    reasons.push({
      code: "ebitda_coverage",
      message: `EBITDA coverage ${fmtRatio(ebitdaCoverage)} below ${MIN_EBITDA_COVERAGE.toFixed(2)}× backstop.`,
      policySection: "5.1",
    });
  } else {
    const failingMandatory = checks.filter(
      (c) =>
        !c.passes &&
        // EBITDA missing should not block: it's pending borrower financials
        !(c.name === "EBITDA Coverage" && ebitdaCoverage == null)
    );
    if (failingMandatory.length > 0) {
      status = "ineligible_other";
      for (const c of failingMandatory) {
        reasons.push({
          code: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
          message: `${c.name}: ${c.actual} fails ${c.threshold}.`,
          policySection: c.policySection,
        });
      }
    } else if (input.grade === "B") {
      status = "eligible_enhanced_mv";
    } else {
      status = "eligible";
    }
  }

  return {
    status,
    checks,
    reasons,
    loanInr: sized.loanInr,
    tenureMonths: sized.tenureMonths,
    annualDebtServiceInr: sized.annualDebtServiceInr,
    dscrAtP5,
    dscrAtP50,
    ebitdaCoverage,
  };
}

export function statusLabel(s: EligibilityStatus): string {
  switch (s) {
    case "eligible":
      return "Eligible — all §5 thresholds cleared";
    case "eligible_enhanced_mv":
      return "Eligible with Enhanced M&V (Grade B)";
    case "ineligible_grade_c":
      return "Ineligible — Grade C prediction (re-audit required)";
    case "ineligible_dscr":
      return "Ineligible — DSCR at P5 below 1.30×";
    case "ineligible_ebitda":
      return "Ineligible — EBITDA Coverage below 1.80×";
    case "ineligible_other":
      return "Ineligible — one or more §5 thresholds failed";
    case "pending":
      return "Pending — audit data incomplete";
  }
}

export function statusTone(s: EligibilityStatus): "ok" | "warn" | "fail" | "neutral" {
  if (s === "eligible") return "ok";
  if (s === "eligible_enhanced_mv") return "warn";
  if (s === "pending") return "neutral";
  return "fail";
}
