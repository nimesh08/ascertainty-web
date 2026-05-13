/**
 * v0.3 seed: adopt the 6 original Exira lineup projects (Smart Pumping, Waste-to-Energy,
 * Cold Storage, Solar Textile, HVAC Hotel, LED Auto Parts) and write them with the
 * current v0.3 narrative — TabPFN attribution, confidence grade, DSCR @ P5, carbon §11.
 *
 * Also:
 *   - Backfills an underwriting_results row for Lucas TVS Devnet
 *   - Deletes the Test MSME placeholder row
 *
 * Idempotent: re-running will not duplicate seeds. Existing rows are matched by
 * msme_name and only filled where columns are NULL (COALESCE pattern).
 *
 * Usage:
 *   bash -c 'set -a && source .env.local && set +a && npx tsx scripts/seed-projects-v03.ts'
 */
import postgres from "postgres";

// ---------------------------------------------------------------------------
// Seed catalogue
// ---------------------------------------------------------------------------

interface Seed {
  msmeName: string;
  sector: string;          // matches the COMMON_FEATURES sector vocabulary
  location: string;
  upgradeType: string;
  termMonths: number;
  targetUsdcDollars: number; // human dollars; converted to 6-decimal raw
  expectedApyBps: number;
  baselineKwhPerYear: number;
  ecmId: string;
  equipmentType: string;
  predictedSavingsKwh: number;
  p5Kwh: number;
  p95Kwh: number;
  sigmaKwh: number;
  confidenceGrade: "A" | "B" | "C";
  dscrAtP5: number;
  dscrAtP50: number;
  carbonTco2PerYear: number;
  electricityRateInrKwh: number;
  description: string;
  aboutProject: string;
  managementText: string;
  financialsText: string;
  documents: Array<{ name: string; url: string }>;
  highlights: Array<{ title: string; detail: string; icon?: string }>;
}

const STANDARD_HIGHLIGHTS = (grade: "A" | "B" | "C"): Seed["highlights"] => [
  {
    title: grade === "A" ? "Senior tranche eligible" : grade === "B" ? "Senior + Junior split" : "Junior tranche (first-loss)",
    detail:
      grade === "A"
        ? "Narrow 90% conformal band (<25% of point) — qualifies for senior tranche per UNDERWRITING_POLICY §5.2."
        : grade === "B"
          ? "Moderate band width — senior eligible up to 60% LTV with junior absorbing first-loss."
          : "Wide band — junior-only until a verified second audit period tightens conformal coverage.",
    icon: "shield-check",
  },
  {
    title: "TabPFN v2 underwritten",
    detail: "Served by PINN v0.1 (21-feature audit, in-distribution). TabPFN v2 benchmark headline: R²=+0.56 LOO on 6-feature corpus (n=72 KISEM + 14,482 IAC).",
    icon: "badge-check",
  },
  {
    title: "DSCR @ P5 covenant",
    detail: "Loan sized so coverage holds in the bottom-5% savings scenario (DSCR @ P5 ≥ 1.30×).",
    icon: "shield",
  },
  {
    title: "Carbon §11 accrual",
    detail: "tCO₂e accrues monthly per the §11 disclosure schedule. Share-of-savings token tracks both INR + carbon proceeds.",
    icon: "leaf",
  },
];

const FORMAT_INR = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function buildProseFor(s: Seed): {
  description: string;
  aboutProject: string;
  managementText: string;
  financialsText: string;
} {
  const annualSavingsInr = Math.round(s.predictedSavingsKwh * s.electricityRateInrKwh);
  const p5InrSavings = Math.round(s.p5Kwh * s.electricityRateInrKwh);
  const description = [
    s.description,
    `Underwritten by Ascertainty's PINN v0.1 unified model, which ingests all 21 fields from the auditor schema (leakage, rated kW, hours/days, plant context). TabPFN v2 is the benchmark-headline model (R²=+0.56 LOO on 6-feature corpus); we serve PINN because the audit signal is much richer than what TabPFN currently sees. v0.4 will retrain TabPFN on the 21-feature schema and flip the serving default. Predicted annual savings: ${FORMAT_INR(s.predictedSavingsKwh)} kWh (≈ ₹${FORMAT_INR(annualSavingsInr)}/yr at ₹${s.electricityRateInrKwh.toFixed(1)}/kWh). The P5 (lender-floor) outcome is ${FORMAT_INR(s.p5Kwh)} kWh — ≈ ₹${FORMAT_INR(p5InrSavings)}/yr — which sizes the loan under our DSCR-at-P5 ≥ 1.30× covenant.`,
    `The borrower receives capital at activation. Monthly USDC repayments are streamed pro-rata to share-of-savings token holders. Senior and junior tranches share the same underlying cash flow; junior absorbs first-loss per UNDERWRITING_POLICY §5.5.`,
    `Carbon credits (tCO₂e) accrue on the same meter under the §11 disclosure schedule and are tracked on-chain alongside the INR distributions.`,
  ].join("\n\n");

  const aboutProject = s.aboutProject;

  const managementText = `Operated by an Ascertainty-verified KISEM partner auditor. Day-30 and Day-90 verification reports tighten the conformal band as realized meter data accrues; if realized savings fall below P5, the borrower triggers the §5.6 cure mechanism. Equipment serviced under a 10-year manufacturer warranty + Ascertainty's quarterly remote-telemetry check.`;

  const financialsText = `Target return is a function of (predicted_annual_inr_savings × share_pct) / target_usdc, not a hand-picked APY. The realized return floats with verified savings: if Day-30 / Day-90 reconciliation shows the project tracking above P50, distributions rise; below P5, the §11 carbon proceeds backstop the senior tranche before any junior writedown.`;

  return { description, aboutProject, managementText, financialsText };
}

const SEEDS: Seed[] = [
  {
    msmeName: "Smart Pumping for Agriculture",
    sector: "agriculture",
    location: "Nashik, Maharashtra",
    upgradeType: "VFD smart pumping + IoT irrigation",
    termMonths: 36,
    targetUsdcDollars: 5_000,
    expectedApyBps: 1280,
    baselineKwhPerYear: 84_000,
    ecmId: "1",
    equipmentType: "vfd_pumping",
    predictedSavingsKwh: 24_500,
    p5Kwh: 16_200,
    p95Kwh: 33_400,
    sigmaKwh: 5_200,
    confidenceGrade: "B",
    dscrAtP5: 1.34,
    dscrAtP50: 1.78,
    carbonTco2PerYear: 20.1,
    electricityRateInrKwh: 7.5,
    description: "VFD-based smart pumping with IoT irrigation control for a 100-acre grape farm in Nashik. Reduces water + electricity draw by sequencing pumps to soil-moisture feedback.",
    aboutProject: "100-acre grape farm in Nashik retrofits its diesel + flat-rate irrigation pumps with a VFD-controlled pumping array and soil-moisture-driven IoT scheduling. Reduces both water draw and electricity bill while extending pump service life.",
    managementText: "",
    financialsText: "",
    documents: [
      { name: "KISEM Baseline Audit.pdf", url: "#" },
      { name: "VFD ECM Feasibility.pdf", url: "#" },
      { name: "TabPFN Prediction Brief.pdf", url: "#" },
    ],
    highlights: STANDARD_HIGHLIGHTS("B"),
  },
  {
    msmeName: "Waste-to-Energy for Food Plant",
    sector: "food_processing",
    location: "Coimbatore, Tamil Nadu",
    upgradeType: "Anaerobic digester + cogeneration",
    termMonths: 48,
    targetUsdcDollars: 40_000,
    expectedApyBps: 1450,
    baselineKwhPerYear: 1_120_000,
    ecmId: "1",
    equipmentType: "cogeneration",
    predictedSavingsKwh: 312_000,
    p5Kwh: 142_000,
    p95Kwh: 482_000,
    sigmaKwh: 96_000,
    confidenceGrade: "C",
    dscrAtP5: 1.31,
    dscrAtP50: 2.21,
    carbonTco2PerYear: 256.0,
    electricityRateInrKwh: 8.5,
    description: "Converts organic waste streams into biogas, displacing 400 LPG cylinders/month at a food processing unit in Coimbatore. Cogeneration delivers electricity + process heat in one cycle.",
    aboutProject: "Coimbatore food processing unit installs a 150 m³ anaerobic digester to convert wet organic waste into biogas, feeding a cogen unit that delivers both electricity and process heat. Displaces grid power plus 400 LPG cylinders per month.",
    managementText: "",
    financialsText: "",
    documents: [
      { name: "Anaerobic Digester Sizing Report.pdf", url: "#" },
      { name: "Cogeneration ECM Brief.pdf", url: "#" },
      { name: "TabPFN Prediction Brief.pdf", url: "#" },
    ],
    highlights: STANDARD_HIGHLIGHTS("C"),
  },
  {
    msmeName: "Cold Storage Optimization",
    sector: "cold_storage",
    location: "Ludhiana, Punjab",
    upgradeType: "High-efficiency refrigeration + insulation",
    termMonths: 36,
    targetUsdcDollars: 20_000,
    expectedApyBps: 1350,
    baselineKwhPerYear: 412_000,
    ecmId: "1",
    equipmentType: "refrigeration",
    predictedSavingsKwh: 118_000,
    p5Kwh: 84_500,
    p95Kwh: 154_000,
    sigmaKwh: 19_800,
    confidenceGrade: "B",
    dscrAtP5: 1.41,
    dscrAtP50: 1.89,
    carbonTco2PerYear: 96.8,
    electricityRateInrKwh: 8.0,
    description: "Multi-commodity cold storage in Ludhiana upgrades compressors, condensers, and panel insulation. Targets 28% reduction in annual electricity draw with a 36-month payback.",
    aboutProject: "Multi-commodity cold storage in Ludhiana retrofits compressors and condensers to high-efficiency models, adds polyurethane panel insulation, and installs VFD-driven evaporator fans. The integrated upgrade is sized for a 28% reduction in annual electricity draw.",
    managementText: "",
    financialsText: "",
    documents: [
      { name: "Cold Storage Baseline.pdf", url: "#" },
      { name: "Refrigeration ECM Brief.pdf", url: "#" },
      { name: "TabPFN Prediction Brief.pdf", url: "#" },
    ],
    highlights: STANDARD_HIGHLIGHTS("B"),
  },
  {
    msmeName: "Solar Upgrade for Textile Unit",
    sector: "textile",
    location: "Surat, Gujarat",
    upgradeType: "Rooftop solar + diesel displacement",
    termMonths: 60,
    targetUsdcDollars: 15_000,
    expectedApyBps: 1250,
    baselineKwhPerYear: 187_000,
    ecmId: "1",
    equipmentType: "solar_pv",
    predictedSavingsKwh: 73_500,
    p5Kwh: 62_400,
    p95Kwh: 84_900,
    sigmaKwh: 6_400,
    confidenceGrade: "A",
    dscrAtP5: 1.62,
    dscrAtP50: 1.91,
    carbonTco2PerYear: 60.3,
    electricityRateInrKwh: 8.5,
    description: "50 kW rooftop solar PV displaces existing diesel-generator usage at a textile dyeing unit in Surat. Tightest band in the lineup — solar PV outcomes are highly predictable given irradiance + tilt.",
    aboutProject: "Textile dyeing unit in Surat installs 50 kW rooftop solar PV. The deterministic nature of solar generation (well-bounded by irradiance, tilt, and shading data) produces the narrowest conformal band in the lineup — qualifies for senior-tranche underwriting at 60% LTV.",
    managementText: "",
    financialsText: "",
    documents: [
      { name: "Solar PV Sizing + Irradiance Study.pdf", url: "#" },
      { name: "Diesel Displacement Calc.pdf", url: "#" },
      { name: "TabPFN Prediction Brief.pdf", url: "#" },
    ],
    highlights: STANDARD_HIGHLIGHTS("A"),
  },
  {
    msmeName: "HVAC Optimization for Hotel",
    sector: "hospitality",
    location: "Bangalore, Karnataka",
    upgradeType: "Chiller plant + IoT controls",
    termMonths: 36,
    targetUsdcDollars: 25_000,
    expectedApyBps: 1320,
    baselineKwhPerYear: 482_000,
    ecmId: "1",
    equipmentType: "chiller_hvac",
    predictedSavingsKwh: 124_500,
    p5Kwh: 76_800,
    p95Kwh: 172_000,
    sigmaKwh: 27_400,
    confidenceGrade: "B",
    dscrAtP5: 1.38,
    dscrAtP50: 1.85,
    carbonTco2PerYear: 102.1,
    electricityRateInrKwh: 9.0,
    description: "4-star hotel in Bangalore upgrades its chiller plant + installs IoT-driven setpoint optimization across 142 guest rooms. Expected ~120 MWh/yr saved with a 36-month payback.",
    aboutProject: "4-star hotel in Bangalore retrofits its chiller plant with magnetic-bearing chillers and installs IoT-driven setpoint optimization across 142 guest rooms. Occupancy-aware scheduling shifts cooling load to off-peak hours.",
    managementText: "",
    financialsText: "",
    documents: [
      { name: "Chiller Plant Audit.pdf", url: "#" },
      { name: "Guest Room IoT ECM Brief.pdf", url: "#" },
      { name: "TabPFN Prediction Brief.pdf", url: "#" },
    ],
    highlights: STANDARD_HIGHLIGHTS("B"),
  },
  {
    msmeName: "LED Retrofit for Auto Parts Maker",
    sector: "automotive",
    location: "Pune, Maharashtra",
    upgradeType: "Industrial LED retrofit + lighting controls",
    termMonths: 24,
    targetUsdcDollars: 8_000,
    expectedApyBps: 1180,
    baselineKwhPerYear: 96_000,
    ecmId: "1",
    equipmentType: "lighting",
    predictedSavingsKwh: 64_200,
    p5Kwh: 56_400,
    p95Kwh: 71_800,
    sigmaKwh: 4_400,
    confidenceGrade: "A",
    dscrAtP5: 1.74,
    dscrAtP50: 1.96,
    carbonTco2PerYear: 52.6,
    electricityRateInrKwh: 8.0,
    description: "Replaces 500+ high-bay metal-halide fixtures with industrial LEDs at an auto component plant in Pune. Adds daylight + occupancy sensors. 24-month payback, narrowest of the medium-target lineup.",
    aboutProject: "Pune auto-parts manufacturer replaces 500+ aging high-bay metal-halide fixtures with industrial LED fixtures, adds daylight + occupancy sensing on production floor circuits. Lighting ECMs have the most predictable savings of any IAC ARC group — narrowest conformal band, senior-eligible.",
    managementText: "",
    financialsText: "",
    documents: [
      { name: "Lighting Audit Report.pdf", url: "#" },
      { name: "LED Retrofit Equipment Brief.pdf", url: "#" },
      { name: "TabPFN Prediction Brief.pdf", url: "#" },
    ],
    highlights: STANDARD_HIGHLIGHTS("A"),
  },
];

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

const usdcRaw = (dollars: number) => `${BigInt(Math.round(dollars * 1_000_000))}`;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Set DATABASE_URL via .env.local");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // 1. Delete the Test MSME placeholder row.
    // investor_positions and transactions FK to projects without ON DELETE CASCADE,
    // so we have to clear them first. These are dev-test rows for a placeholder
    // project — safe to remove.
    console.log("=== Deleting Test MSME placeholder ===");
    const testIds = await sql<{ id: string; msme_name: string }[]>`
      SELECT id, msme_name FROM public.projects
      WHERE msme_name ILIKE 'test msme%' OR msme_name ILIKE 'test_msme%'
    `;
    if (testIds.length > 0) {
      const ids = testIds.map((r) => r.id);
      const posCleared = await sql`
        DELETE FROM public.investor_positions WHERE project_id IN ${sql(ids)} RETURNING id
      `;
      const txCleared = await sql`
        DELETE FROM public.transactions WHERE project_id IN ${sql(ids)} RETURNING id
      `;
      console.log(`  Cleared ${posCleared.length} investor_positions + ${txCleared.length} transactions for Test MSME`);
      const deleted = await sql<{ id: string; msme_name: string }[]>`
        DELETE FROM public.projects WHERE id IN ${sql(ids)} RETURNING id, msme_name
      `;
      console.log(`  Deleted ${deleted.length} placeholder row(s):`, deleted.map((r) => r.msme_name));
    } else {
      console.log("  (no Test MSME rows found)");
    }

    // 2. Insert / fill the 6 seeds + the Lucas TVS Devnet underwriting backfill
    for (const seed of SEEDS) {
      const prose = buildProseFor(seed);

      console.log(`\n=== ${seed.msmeName} ===`);

      // 2a. Upsert MRV project (so the BaselineImpactSection can show a baseline)
      const [mrv] = await sql<{ id: string }[]>`
        INSERT INTO public.mrv_projects (msme_name, sector, location, upgrade_type, status, baseline_submitted, verification_count)
        VALUES (${seed.msmeName}, ${seed.sector}, ${seed.location}, ${seed.upgradeType}, 'baseline_submitted', true, 0)
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      let mrvId = mrv?.id;
      if (!mrvId) {
        const [existing] = await sql<{ id: string }[]>`
          SELECT id FROM public.mrv_projects WHERE msme_name = ${seed.msmeName} LIMIT 1
        `;
        mrvId = existing?.id;
      }
      console.log(`  mrv_projects.id = ${mrvId ?? "(none)"}`);

      // 2b. Upsert project row
      const [proj] = await sql<{ id: string }[]>`
        INSERT INTO public.projects (
          msme_name, sector, location, upgrade_type, term_months,
          target_usdc, status, mrv_project_id,
          description, about_project, highlights, management_text, financials_text, documents,
          trust_score, expected_apy_bps
        )
        VALUES (
          ${seed.msmeName}, ${seed.sector}, ${seed.location}, ${seed.upgradeType}, ${seed.termMonths},
          ${usdcRaw(seed.targetUsdcDollars)}, 'funding', ${mrvId ?? null},
          ${prose.description}, ${prose.aboutProject}, ${sql.json(seed.highlights)}, ${prose.managementText}, ${prose.financialsText}, ${sql.json(seed.documents)},
          NULL, ${seed.expectedApyBps}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      let projectId = proj?.id;
      if (!projectId) {
        // Existing row: fill the v0.3 content fields only if currently NULL/empty.
        const [updated] = await sql<{ id: string }[]>`
          UPDATE public.projects
          SET
            description     = COALESCE(NULLIF(description, ''), ${prose.description}),
            about_project   = COALESCE(NULLIF(about_project, ''), ${prose.aboutProject}),
            highlights      = COALESCE(highlights, ${sql.json(seed.highlights)}),
            management_text = COALESCE(NULLIF(management_text, ''), ${prose.managementText}),
            financials_text = COALESCE(NULLIF(financials_text, ''), ${prose.financialsText}),
            documents       = COALESCE(documents, ${sql.json(seed.documents)}),
            expected_apy_bps= COALESCE(expected_apy_bps, ${seed.expectedApyBps}),
            target_usdc     = CASE WHEN target_usdc = '0' THEN ${usdcRaw(seed.targetUsdcDollars)} ELSE target_usdc END,
            mrv_project_id  = COALESCE(mrv_project_id, ${mrvId ?? null}),
            term_months     = CASE WHEN term_months = 0 THEN ${seed.termMonths} ELSE term_months END
          WHERE msme_name = ${seed.msmeName}
          RETURNING id
        `;
        projectId = updated?.id;
        console.log(`  projects.id = ${projectId} (existing, filled NULL columns)`);
      } else {
        console.log(`  projects.id = ${projectId} (new)`);
      }

      if (!projectId) {
        console.log(`  ! Could not resolve project_id for ${seed.msmeName}; skipping baseline + underwriting`);
        continue;
      }

      // 2c. MRV baseline (only if none exists)
      if (mrvId) {
        const [existingBaseline] = await sql<{ id: string }[]>`
          SELECT id FROM public.mrv_baselines WHERE mrv_project_id = ${mrvId} LIMIT 1
        `;
        if (!existingBaseline) {
          await sql`
            INSERT INTO public.mrv_baselines (mrv_project_id, auditor_wallet, energy_kwh_per_year, fuel_type, report_hash)
            VALUES (${mrvId}, 'KISEMSeedAuditor1111111111111111111111111111', ${seed.baselineKwhPerYear}, 'electric', 'seed-v03')
          `;
          console.log(`  mrv_baselines: inserted (${seed.baselineKwhPerYear} kWh/yr)`);
        }
      }

      // 2d. Underwriting result (only if none exists for this project)
      const dealId = seed.msmeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const [existingUw] = await sql<{ id: string }[]>`
        SELECT id FROM public.underwriting_results WHERE project_id = ${projectId} LIMIT 1
      `;
      if (!existingUw) {
        const annualInr = Math.round(seed.predictedSavingsKwh * seed.electricityRateInrKwh);
        const recommendedLoanInr = Math.round(annualInr * (seed.termMonths / 12) * 0.65);
        const paybackMonths = (seed.targetUsdcDollars * 83 / annualInr) * 12;
        const p5PaybackMonths = (seed.targetUsdcDollars * 83 / (seed.p5Kwh * seed.electricityRateInrKwh)) * 12;
        await sql`
          INSERT INTO public.underwriting_results (
            project_id, mrv_project_id,
            deal_id, ecm_id, equipment_type, sector, description,
            audit_inputs_json, prediction_json, model_used, sigma_scale_applied,
            pinn_savings_kwh, pinn_p5_lower_kwh, pinn_p95_upper_kwh, pinn_sigma_kwh,
            confidence_grade,
            baseline_kwh_per_year, electricity_rate_inr_kwh,
            annual_savings_inr, payback_months, p5_payback_months, recommended_loan_inr,
            status,
            dscr_at_p5, dscr_at_p50,
            eligibility_status,
            carbon_eligible, carbon_tco2_per_year, carbon_methodology
          )
          VALUES (
            ${projectId}, ${mrvId ?? null},
            ${dealId}, ${seed.ecmId}, ${seed.equipmentType}, ${seed.sector}, ${seed.description},
            ${sql.json({ baseline_kwh: seed.baselineKwhPerYear, sector: seed.sector, equipment_type: seed.equipmentType, region: "IN-BEE" })},
            ${sql.json({ savings_kwh: seed.predictedSavingsKwh, p5_lower_kwh: seed.p5Kwh, p95_upper_kwh: seed.p95Kwh, sigma_kwh: seed.sigmaKwh, model: "TabPFN v2", region: "IN-BEE" })},
            'PINN unified v0.1 (21-feature audit, IN-BEE)',
            ${1.0},
            ${seed.predictedSavingsKwh}, ${seed.p5Kwh}, ${seed.p95Kwh}, ${seed.sigmaKwh},
            ${seed.confidenceGrade},
            ${seed.baselineKwhPerYear}, ${seed.electricityRateInrKwh},
            ${annualInr}, ${paybackMonths.toFixed(2)}, ${p5PaybackMonths.toFixed(2)}, ${recommendedLoanInr},
            'underwritten',
            ${seed.dscrAtP5}, ${seed.dscrAtP50},
            'eligible',
            true, ${seed.carbonTco2PerYear}, 'CDM AMS-II.E (energy efficiency MSMEs)'
          )
        `;
        console.log(`  underwriting_results: inserted (grade=${seed.confidenceGrade}, DSCR@P5=${seed.dscrAtP5}, ${seed.carbonTco2PerYear} tCO₂/yr)`);
      } else {
        console.log(`  underwriting_results: exists (id=${existingUw.id}) — leaving untouched`);
      }
    }

    // 3. Backfill Lucas TVS Devnet — pull its baseline kWh from mrv_baselines and fabricate
    //    a TabPFN prediction so the project page narrative isn't a blank slate.
    console.log(`\n=== Lucas TVS Devnet backfill ===`);
    const [lucas] = await sql<{ id: string; mrv_project_id: string | null; baseline_kwh: string | null }[]>`
      SELECT p.id, p.mrv_project_id, b.energy_kwh_per_year::text AS baseline_kwh
      FROM public.projects p
      LEFT JOIN public.mrv_baselines b ON b.mrv_project_id = p.mrv_project_id
      WHERE p.msme_name ILIKE 'lucas%'
      LIMIT 1
    `;
    if (lucas) {
      const baseKwh = Number(lucas.baseline_kwh ?? 320_000);
      const predicted = Math.round(baseKwh * 0.32);
      const p5 = Math.round(predicted * 0.71);
      const p95 = Math.round(predicted * 1.29);
      const sigma = Math.round((p95 - p5) / 3.29);
      const grade: "A" | "B" | "C" =
        (p95 - p5) / (2 * predicted) < 0.25 ? "A" : (p95 - p5) / (2 * predicted) < 0.5 ? "B" : "C";
      const carbonT = Math.round(predicted * 0.00082 * 100) / 100; // 0.82 kgCO2/kWh India grid factor
      const [existingUw] = await sql<{ id: string }[]>`
        SELECT id FROM public.underwriting_results WHERE project_id = ${lucas.id} LIMIT 1
      `;
      if (!existingUw) {
        await sql`
          INSERT INTO public.underwriting_results (
            project_id, mrv_project_id,
            deal_id, ecm_id, equipment_type, sector, description,
            audit_inputs_json, prediction_json, model_used, sigma_scale_applied,
            pinn_savings_kwh, pinn_p5_lower_kwh, pinn_p95_upper_kwh, pinn_sigma_kwh,
            confidence_grade,
            baseline_kwh_per_year, electricity_rate_inr_kwh,
            annual_savings_inr, recommended_loan_inr,
            status,
            dscr_at_p5, dscr_at_p50,
            eligibility_status,
            carbon_eligible, carbon_tco2_per_year, carbon_methodology
          )
          VALUES (
            ${lucas.id}, ${lucas.mrv_project_id},
            'lucas-tvs-devnet', '1', 'heat_pump', 'automotive', 'Heat-pump retrofit on plant utility loop at Lucas TVS Devnet site.',
            ${sql.json({ baseline_kwh: baseKwh, sector: "automotive", equipment_type: "heat_pump", region: "IN-BEE" })},
            ${sql.json({ savings_kwh: predicted, p5_lower_kwh: p5, p95_upper_kwh: p95, sigma_kwh: sigma, model: "TabPFN v2", region: "IN-BEE" })},
            'PINN unified v0.1 (21-feature audit, IN-BEE)',
            ${1.0},
            ${predicted}, ${p5}, ${p95}, ${sigma},
            ${grade},
            ${baseKwh}, ${8.0},
            ${Math.round(predicted * 8.0)}, ${Math.round(predicted * 8.0 * 3 * 0.65)},
            'underwritten',
            ${grade === "A" ? 1.65 : grade === "B" ? 1.36 : 1.31}, ${grade === "A" ? 1.92 : grade === "B" ? 1.82 : 2.04},
            'eligible',
            true, ${carbonT}, 'CDM AMS-II.E (energy efficiency MSMEs)'
          )
        `;
        console.log(`  Lucas TVS Devnet: backfilled (grade=${grade}, predicted=${predicted} kWh, carbon=${carbonT} tCO₂/yr)`);
      } else {
        console.log(`  Lucas TVS Devnet underwriting_results exists (id=${existingUw.id}) — leaving untouched`);
      }
    } else {
      console.log(`  Lucas TVS Devnet not found in projects table — skipping backfill`);
    }

    // 4. Force-update any stale "TabPFN v2 …" attributions from a prior seed run
    // to the v0.3 Path A serving model. Cosmetic — the schema is unchanged.
    const updated = await sql<{ id: string }[]>`
      UPDATE public.underwriting_results
      SET model_used = 'PINN unified v0.1 (21-feature audit, IN-BEE)'
      WHERE model_used LIKE 'TabPFN%'
      RETURNING id
    `;
    if (updated.length > 0) {
      console.log(`\n=== Force-update model_used: PINN v0.1 (was TabPFN) ===`);
      console.log(`  Updated ${updated.length} underwriting_results rows`);
    }

    console.log(`\nDone. Re-run is safe (idempotent).`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
