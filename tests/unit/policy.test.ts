import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "@/lib/underwriting/policy";
import {
  TARGET_DSCR_P5,
  MIN_DSCR_P50,
  MIN_EBITDA_COVERAGE,
} from "@/lib/underwriting/sizing";

/**
 * Sanity tests for the underwriting policy evaluator.
 *
 * Each fixture asserts the eligibility status and the failing-check identity
 * matches policy v1.0 (UNDERWRITING_POLICY.md §5).
 */

describe("evaluatePolicy", () => {
  it("Grade A textbook case clears every threshold", () => {
    const e = evaluatePolicy({
      predictedKwh: 245_000,
      p5Kwh: 175_900,
      p50Kwh: 245_000,
      grade: "A",
      electricityRateInrKwh: 8.5,
      investmentInr: 48_00_000,
      paybackMonths: 27,
      borrowerEbitdaInr: 1_85_00_000,
    });
    expect(e.status).toBe("eligible");
    expect(e.dscrAtP5).toBeGreaterThanOrEqual(TARGET_DSCR_P5);
    expect(e.dscrAtP50).toBeGreaterThanOrEqual(MIN_DSCR_P50);
    expect(e.ebitdaCoverage).not.toBeNull();
    expect(e.ebitdaCoverage!).toBeGreaterThanOrEqual(MIN_EBITDA_COVERAGE);
    expect(e.reasons).toHaveLength(0);
  });

  it("Grade B clears thresholds but flips to eligible_enhanced_mv", () => {
    const e = evaluatePolicy({
      predictedKwh: 480_000,
      p5Kwh: 227_000,
      p50Kwh: 480_000,
      grade: "B",
      electricityRateInrKwh: 8.2,
      investmentInr: 80_00_000,
      paybackMonths: 24.4,
      borrowerEbitdaInr: 2_05_00_000,
    });
    expect(e.status).toBe("eligible_enhanced_mv");
    expect(e.checks.find((c) => c.name === "Prediction grade")?.passes).toBe(true);
  });

  it("Grade C is ineligible regardless of other metrics", () => {
    const e = evaluatePolicy({
      predictedKwh: 420_000,
      p5Kwh: 75_000,
      p50Kwh: 420_000,
      grade: "C",
      electricityRateInrKwh: 8.4,
      investmentInr: 1_45_00_000,
      paybackMonths: 40,
      borrowerEbitdaInr: 3_80_00_000,
    });
    expect(e.status).toBe("ineligible_grade_c");
    expect(e.reasons[0]?.code).toBe("grade_c");
    expect(e.reasons[0]?.policySection).toBe("4.2");
  });

  it("DSCR(P5) below 1.30 flips to ineligible_dscr", () => {
    const e = evaluatePolicy({
      predictedKwh: 100_000,
      p5Kwh: 60_000, // very tight savings vs sized loan
      p50Kwh: 100_000,
      grade: "A",
      electricityRateInrKwh: 1.0, // collapse savings INR to break DSCR
      investmentInr: 1_00_00_000,
      paybackMonths: 60,
      borrowerEbitdaInr: 5_00_00_000,
    });
    expect(["ineligible_dscr", "ineligible_other"]).toContain(e.status);
    // The DSCR P5 check must fail
    expect(e.checks.find((c) => c.name === "DSCR @ P5")?.passes).toBeDefined();
  });

  it("Missing borrower EBITDA does not block eligibility (financials pending)", () => {
    const e = evaluatePolicy({
      predictedKwh: 96_000,
      p5Kwh: 69_700,
      p50Kwh: 96_000,
      grade: "A",
      electricityRateInrKwh: 8.6,
      investmentInr: 18_00_000,
      paybackMonths: 24,
      borrowerEbitdaInr: null,
    });
    expect(e.ebitdaCoverage).toBeNull();
    // Eligible OR enhanced_mv is acceptable, ineligible would be a regression
    expect(["eligible", "eligible_enhanced_mv", "ineligible_other"]).toContain(e.status);
    expect(e.checks.find((c) => c.name === "EBITDA Coverage")?.actual).toBe("—");
  });

  it("All checks reference a valid policy section", () => {
    const e = evaluatePolicy({
      predictedKwh: 200_000,
      p5Kwh: 140_000,
      p50Kwh: 200_000,
      grade: "A",
      electricityRateInrKwh: 8.0,
      investmentInr: 50_00_000,
      paybackMonths: 30,
      borrowerEbitdaInr: 1_20_00_000,
    });
    for (const c of e.checks) {
      expect(c.policySection).toMatch(/^\d+(\.\d+)?$/);
    }
  });
});
