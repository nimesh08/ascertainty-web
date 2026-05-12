/**
 * Loan sizing math for the Exira underwriting policy.
 *
 * Constants here mirror UNDERWRITING_POLICY.md §5 thresholds and §10 vault
 * IRR target. Single source of truth — change here, all surfaces update.
 */

// §5.1 — DSCR threshold the recommended loan is sized against
export const TARGET_DSCR_P5 = 1.3;
export const MIN_DSCR_P50 = 1.75;
export const MIN_EBITDA_COVERAGE = 1.8;

// §5.4 — tenor by prediction grade (months). Grade C is ineligible per §4.2;
// the value is retained for borderline-flag display only. Tenors balance
// §5.2 tenor/payback ratio (1.0–1.5×) with longer tenors for more confident
// grades.
export const TENURE_BY_GRADE: Record<"A" | "B" | "C", number> = {
  A: 36,
  B: 30,
  C: 24,
};

// §5.2
export const MIN_TENOR_MONTHS = 24;
export const MAX_TENOR_MONTHS = 60;
export const TENOR_PAYBACK_RATIO_MIN = 1.0;
export const TENOR_PAYBACK_RATIO_MAX = 1.5;

// §5.3
export const MIN_LOAN_INR = 25_00_000; // ₹25L
export const MAX_LOAN_INR = 5_00_00_000; // ₹5Cr
export const MAX_LOAN_TO_CAPEX = 0.9;

// §5.4 — coefficient of variation thresholds for prediction grade
export const GRADE_A_MAX_CV = 0.25;
export const GRADE_B_MAX_CV = 0.45;

// Vault economics (matches PINN underwrite endpoint default)
export const VAULT_IRR = 0.14;

export interface RecommendedLoan {
  loanInr: number;
  tenureMonths: number;
  annualDebtServiceInr: number;
  monthlyPaymentInr: number;
}

/**
 * Size a loan from the P5 lower-bound savings such that DSCR(P5) = TARGET_DSCR_P5.
 * Uses present-value annuity at VAULT_IRR over `tenureMonths`.
 */
export function recommendedLoanInr(
  p5Kwh: number,
  electricityRateInrKwh: number,
  grade: "A" | "B" | "C" | null | undefined
): RecommendedLoan {
  const annualSavingsInr = p5Kwh * electricityRateInrKwh;
  const annualDebtServiceInr = annualSavingsInr / TARGET_DSCR_P5;
  const tenureMonths = TENURE_BY_GRADE[grade ?? "C"] ?? MIN_TENOR_MONTHS;
  const monthlyR = VAULT_IRR / 12;
  const pvFactor = (1 - Math.pow(1 + monthlyR, -tenureMonths)) / monthlyR;
  const monthlyPaymentInr = annualDebtServiceInr / 12;
  const loanInr = monthlyPaymentInr * pvFactor;
  return {
    loanInr,
    tenureMonths,
    annualDebtServiceInr,
    monthlyPaymentInr,
  };
}

/**
 * DSCR at a given savings level: how many times over does the savings cover
 * the annual debt payment.
 */
export function computeDscr(
  savingsKwh: number,
  electricityRateInrKwh: number,
  annualDebtServiceInr: number
): number {
  if (annualDebtServiceInr <= 0) return 0;
  return (savingsKwh * electricityRateInrKwh) / annualDebtServiceInr;
}

/**
 * EBITDA coverage: borrower operating cash flow vs annual debt service.
 * Backstop metric — answers "if retrofit savings = 0, can borrower still pay?"
 */
export function computeEbitdaCoverage(
  borrowerEbitdaInr: number,
  annualDebtServiceInr: number
): number {
  if (annualDebtServiceInr <= 0) return 0;
  return borrowerEbitdaInr / annualDebtServiceInr;
}

/**
 * Coefficient of variation, used to grade prediction quality (§5.4).
 */
export function coefficientOfVariation(predictedKwh: number, sigmaKwh: number): number {
  if (predictedKwh <= 0) return Number.POSITIVE_INFINITY;
  return sigmaKwh / predictedKwh;
}

export function gradeFromCv(cv: number): "A" | "B" | "C" {
  if (cv < GRADE_A_MAX_CV) return "A";
  if (cv < GRADE_B_MAX_CV) return "B";
  return "C";
}
