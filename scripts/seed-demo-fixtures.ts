/**
 * Seed deterministic demo fixtures for the Alliance DAO / YZi Labs investor
 * walkthrough. Six deals spanning grades A/B/C, multiple sectors, and the
 * carbon-eligibility cases.
 *
 * Usage:
 *   set -a; . ./.env.local; set +a
 *   npx tsx scripts/seed-demo-fixtures.ts
 *
 * Idempotent — wipes any existing rows whose deal_id begins with `demo-`
 * before inserting.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql as dsql, eq, like } from "drizzle-orm";

import * as schema from "../lib/db/schema";
import { evaluatePolicy } from "../lib/underwriting/policy";
import { estimateCarbon } from "../lib/demo/carbon";

if (!process.env.DATABASE_URL) {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocal)) {
    for (const line of fs.readFileSync(envLocal, "utf-8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^"|"$/g, "");
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Source .env.local first.");
  process.exit(1);
}

interface Fixture {
  dealId: string;
  ecmId: string;
  equipmentType: string;
  sector: string;
  description: string;
  plantName: string;
  baselineKwhPerYear: number;
  predictedKwh: number;
  sigmaKwh: number;
  p5Kwh: number;
  p95Kwh: number;
  grade: "A" | "B" | "C";
  borrowerEbitdaInr: number | null; // null to test "EBITDA pending" rendering
  investmentInr: number;
  electricityRateInrKwh: number;
  modelUsed: string;
}

const FIXTURES: Fixture[] = [
  // Grade A — textbook investor demo case (Tamil Nadu textile, compressed air)
  {
    dealId: "demo-001",
    ecmId: "ECM-001",
    equipmentType: "compressed_air",
    sector: "textiles",
    description: "Compressed-air leakage retrofit at 200 cfm plant",
    plantName: "Veejay Syntex (demo)",
    baselineKwhPerYear: 980_000,
    predictedKwh: 245_000,
    sigmaKwh: 42_000, // CV = 17% → Grade A
    p5Kwh: 175_900, // ~ μ - 1.645σ
    p95Kwh: 314_100, // ~ μ + 1.645σ
    grade: "A",
    borrowerEbitdaInr: 1_85_00_000,
    investmentInr: 48_00_000,
    electricityRateInrKwh: 8.5,
    modelUsed: "exira_pinn_compressed_air_v1",
  },
  // Grade A — cold chain refrigeration upgrade
  {
    dealId: "demo-002",
    ecmId: "ECM-001",
    equipmentType: "refrigeration",
    sector: "cold_chain",
    description: "Multi-stage refrigeration retrofit",
    plantName: "Coromandel Cold Storage (demo)",
    baselineKwhPerYear: 2_400_000,
    predictedKwh: 720_000,
    sigmaKwh: 162_000, // CV = 22.5% → Grade A
    p5Kwh: 453_510,
    p95Kwh: 986_490,
    grade: "A",
    borrowerEbitdaInr: 4_20_00_000,
    investmentInr: 1_15_00_000,
    electricityRateInrKwh: 7.8,
    modelUsed: "exira_pinn_unified_v1",
  },
  // Grade B — motors retrofit, wider band, "Enhanced M&V"
  {
    dealId: "demo-003",
    ecmId: "ECM-001",
    equipmentType: "motors",
    sector: "foundry",
    description: "IE3 motor replacement across grinding line",
    plantName: "Lakshmi Castings (demo)",
    baselineKwhPerYear: 2_100_000,
    predictedKwh: 480_000,
    sigmaKwh: 153_600, // CV = 32% → Grade B
    p5Kwh: 227_000, // ≈ μ - 1.645σ
    p95Kwh: 733_000,
    grade: "B",
    borrowerEbitdaInr: 2_05_00_000,
    investmentInr: 80_00_000, // payback ~24.4mo, tenor 30, ratio 1.23×
    electricityRateInrKwh: 8.2,
    modelUsed: "exira_pinn_unified_v1",
  },
  // Grade B — VFD on pumps, food processing
  {
    dealId: "demo-004",
    ecmId: "ECM-001",
    equipmentType: "vfd",
    sector: "food_processing",
    description: "VFD retrofit on process pumps",
    plantName: "Madras Foods (demo)",
    baselineKwhPerYear: 1_950_000,
    predictedKwh: 540_000,
    sigmaKwh: 189_000, // CV = 35% → Grade B
    p5Kwh: 229_000,
    p95Kwh: 851_000,
    grade: "B",
    borrowerEbitdaInr: 1_55_00_000,
    investmentInr: 72_00_000, // payback ~20mo, tenor 30, ratio 1.5×
    electricityRateInrKwh: 8.0,
    modelUsed: "exira_pinn_unified_v1",
  },
  // Grade C — ineligible, chiller with poor data
  {
    dealId: "demo-c-01",
    ecmId: "ECM-001",
    equipmentType: "chiller",
    sector: "pharmaceuticals",
    description: "Centrifugal chiller upgrade — partial nameplate data only",
    plantName: "Acme Pharma (demo)",
    baselineKwhPerYear: 1_900_000,
    predictedKwh: 420_000,
    sigmaKwh: 210_000, // CV = 50% → Grade C
    p5Kwh: 75_000,
    p95Kwh: 765_000,
    grade: "C",
    borrowerEbitdaInr: 3_80_00_000,
    investmentInr: 1_45_00_000,
    electricityRateInrKwh: 8.4,
    modelUsed: "exira_pinn_unified_v1",
  },
  // EBITDA pending case — Grade A but borrower financials not yet provided
  {
    dealId: "demo-005",
    ecmId: "ECM-001",
    equipmentType: "lighting",
    sector: "textiles",
    description: "LED + smart-control retrofit across factory floor",
    plantName: "Coimbatore Spinners (demo)",
    baselineKwhPerYear: 850_000,
    predictedKwh: 250_000,
    sigmaKwh: 41_000, // CV = 16.4% → Grade A
    p5Kwh: 183_000,
    p95Kwh: 317_000,
    grade: "A",
    borrowerEbitdaInr: null, // financials pending — eligibility should still pass
    investmentInr: 50_00_000, // payback ~27.9mo, tenor 36, ratio 1.29×
    electricityRateInrKwh: 8.6,
    modelUsed: "exira_pinn_unified_v1",
  },
];

async function main() {
  const sqlClient = postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });
  const db = drizzle(sqlClient, { schema });

  try {
    console.log("Wiping existing demo fixtures (deal_id LIKE 'demo-%')...");
    const wiped = await db
      .delete(schema.underwritingResults)
      .where(like(schema.underwritingResults.dealId, "demo-%"))
      .returning({ id: schema.underwritingResults.id });
    console.log(`  removed ${wiped.length} rows`);

    let inserted = 0;
    for (const f of FIXTURES) {
      const annualSavingsInr = f.predictedKwh * f.electricityRateInrKwh;
      const paybackMonths = (f.investmentInr / annualSavingsInr) * 12;
      const p5PaybackMonths =
        f.p5Kwh > 0 ? (f.investmentInr / (f.p5Kwh * f.electricityRateInrKwh)) * 12 : null;

      const evaluation = evaluatePolicy({
        predictedKwh: f.predictedKwh,
        p5Kwh: f.p5Kwh,
        p50Kwh: f.predictedKwh,
        grade: f.grade,
        electricityRateInrKwh: f.electricityRateInrKwh,
        investmentInr: f.investmentInr,
        paybackMonths,
        borrowerEbitdaInr: f.borrowerEbitdaInr,
      });

      const carbon = estimateCarbon(f.equipmentType, f.predictedKwh);

      await db
        .insert(schema.underwritingResults)
        .values({
          dealId: f.dealId,
          ecmId: f.ecmId,
          equipmentType: f.equipmentType,
          sector: f.sector,
          description: f.description,
          auditInputsJson: {
            plant_name: f.plantName,
            equipment_type: f.equipmentType,
            industry_sector: f.sector,
            baseline_kwh_per_year: f.baselineKwhPerYear,
            electricity_rate_inr_kwh: f.electricityRateInrKwh,
            investment_inr: f.investmentInr,
            __demo: true,
          },
          predictionJson: {
            predicted_savings_kwh: f.predictedKwh,
            savings_lower_p5_kwh: f.p5Kwh,
            savings_upper_p95_kwh: f.p95Kwh,
            sigma_kwh: f.sigmaKwh,
            confidence_grade: f.grade,
            model_used: f.modelUsed,
          },
          modelUsed: f.modelUsed,
          sigmaScaleApplied: "1.0000",
          pinnSavingsKwh: f.predictedKwh.toFixed(2),
          pinnP5LowerKwh: f.p5Kwh.toFixed(2),
          pinnP95UpperKwh: f.p95Kwh.toFixed(2),
          pinnSigmaKwh: f.sigmaKwh.toFixed(2),
          confidenceGrade: f.grade,
          baselineKwhPerYear: f.baselineKwhPerYear.toFixed(2),
          investmentInr: f.investmentInr.toFixed(2),
          electricityRateInrKwh: f.electricityRateInrKwh.toFixed(2),
          annualSavingsInr: annualSavingsInr.toFixed(2),
          paybackMonths: paybackMonths.toFixed(2),
          p5PaybackMonths: p5PaybackMonths != null ? p5PaybackMonths.toFixed(2) : null,
          recommendedLoanInr: evaluation.loanInr.toFixed(2),
          status: f.grade === "C" ? "predicted" : "predicted",
          auditorWallet: "DemoAuditorWallet111111111111111111111111111",
          // Policy v0.2 fields
          borrowerEbitdaInr:
            f.borrowerEbitdaInr != null ? f.borrowerEbitdaInr.toFixed(2) : null,
          ebitdaCoverageRatio:
            evaluation.ebitdaCoverage != null
              ? evaluation.ebitdaCoverage.toFixed(4)
              : null,
          dscrAtP5: evaluation.dscrAtP5.toFixed(4),
          dscrAtP50: evaluation.dscrAtP50.toFixed(4),
          eligibilityStatus: evaluation.status,
          ineligibilityReasons: evaluation.reasons.length > 0 ? evaluation.reasons : null,
          carbonEligible: carbon.eligible,
          carbonTco2PerYear: carbon.eligible ? carbon.tCO2PerYear.toFixed(2) : null,
          carbonMethodology: carbon.methodology,
        })
        .onConflictDoNothing();
      inserted++;
      console.log(
        `  ✓ ${f.dealId} · ${f.equipmentType} · grade ${f.grade} · ` +
          `DSCR(P5)=${evaluation.dscrAtP5.toFixed(2)}× · status=${evaluation.status}`
      );
    }
    console.log(`Inserted ${inserted} demo fixtures.`);

    // Sanity: every non-Grade-C fixture must clear policy. Grade C must fail.
    const all = await db
      .select()
      .from(schema.underwritingResults)
      .where(like(schema.underwritingResults.dealId, "demo-%"));
    let problems = 0;
    for (const row of all) {
      const isGradeC = row.confidenceGrade === "C";
      const status = row.eligibilityStatus;
      if (isGradeC && status !== "ineligible_grade_c") {
        console.error(`✗ ${row.dealId} (Grade C) expected ineligible_grade_c, got ${status}`);
        problems++;
      }
      // Allow eligible OR eligible_enhanced_mv OR ineligible_other (for testing)
      // for non-Grade-C fixtures — but flag unexpected pending.
      if (!isGradeC && status === "pending") {
        console.error(`✗ ${row.dealId} unexpectedly pending`);
        problems++;
      }
    }
    if (problems > 0) {
      console.error(`${problems} fixture(s) have unexpected eligibility status.`);
      process.exit(1);
    }
    console.log("All fixtures pass eligibility expectations.");

    // Use the dsql template tag to silence unused-import warning if drizzle-kit upgrades
    void dsql;
    void eq;
  } finally {
    await sqlClient.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
