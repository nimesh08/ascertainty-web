/**
 * Seed a demo Day 1 → Day 30 snapshot timeline for the `test-001` deal.
 *
 * Usage:
 *   set -a; . ./.env.local; set +a
 *   npx tsx scripts/seed-timeline-demo.ts [--deal-id test-001]
 *
 * The script:
 *   1. Looks up (or creates) an underwriting_results row for the deal
 *   2. Wipes existing underwriting_snapshots for that row
 *   3. Inserts ~8 snapshots simulating how a 30-day audit would progress:
 *        Day 1  → only rated_kW + sector known                      (widest band)
 *        Day 3  → + operating hours/days                            (band narrows)
 *        Day 5  → + initial leakage estimate (Fluke ii910 first pass)
 *        Day 10 → + refined leakage measurement
 *        Day 15 → + plant motor context                              (richer features)
 *        Day 20 → + compressor SEC measurement
 *        Day 25 → + idle-time observation
 *        Day 30 → finalized audit (tightest band)
 *
 * Each snapshot hits the live PINN at INFERENCE_BASE_URL with progressively
 * more inputs so the band evolution is real model output, not hand-fabricated.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import postgres from "postgres";

// Load .env.local if DATABASE_URL not already in env
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

const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL ?? "http://127.0.0.1:8000";

interface Stage {
  day: number;
  label: string;
  inputs: Record<string, unknown>;
}

// Veejay-like compressed-air leakage deal
const BASE_INPUTS = {
  equipment_type: "compressed_air",
  ecm_category: "compressed_air_leakage",
  ecm_description: "Compressed-air leakage ECM (demo timeline)",
  industry_sector: "textiles",
  electricity_rate_inr_kwh: 8.0,
  investment_inr: 500000,
};

const STAGES: Stage[] = [
  {
    day: 1,
    label: "Spec measurements taken",
    inputs: { ...BASE_INPUTS, compressor_rated_kw: 45, baseline_kwh_per_year: 45 * 16 * 280 },
  },
  {
    day: 3,
    label: "Operating hours confirmed",
    inputs: { ...BASE_INPUTS, compressor_rated_kw: 45, baseline_kwh_per_year: 45 * 24 * 350 },
  },
  {
    day: 5,
    label: "Initial leakage estimate (Fluke ii910 first pass)",
    inputs: {
      ...BASE_INPUTS,
      compressor_rated_kw: 45,
      baseline_kwh_per_year: 45 * 24 * 350,
      leakage_pct: 38,
    },
  },
  {
    day: 10,
    label: "Refined leakage measurement",
    inputs: {
      ...BASE_INPUTS,
      compressor_rated_kw: 45,
      baseline_kwh_per_year: 322623,
      leakage_pct: 42,
    },
  },
  {
    day: 15,
    label: "Plant motor context added (load_factor, VFD %)",
    inputs: {
      ...BASE_INPUTS,
      compressor_rated_kw: 45,
      baseline_kwh_per_year: 322623,
      leakage_pct: 42,
      plant_mean_motor_load_factor: 0.55,
      plant_pct_vfd_motors: 0.12,
    },
  },
  {
    day: 20,
    label: "Compressor SEC measurement",
    inputs: {
      ...BASE_INPUTS,
      compressor_rated_kw: 45,
      baseline_kwh_per_year: 322623,
      leakage_pct: 42,
      plant_mean_motor_load_factor: 0.55,
      plant_pct_vfd_motors: 0.12,
      plant_avg_compressor_leakage_pct: 42,
    },
  },
  {
    day: 25,
    label: "Idle-time + oversizing observation",
    inputs: {
      ...BASE_INPUTS,
      compressor_rated_kw: 45,
      baseline_kwh_per_year: 322623,
      leakage_pct: 42,
      plant_mean_motor_load_factor: 0.55,
      plant_max_motor_oversize: 1.4,
      plant_pct_vfd_motors: 0.12,
      plant_avg_compressor_leakage_pct: 42,
    },
  },
  {
    day: 30,
    label: "Final audit — all measurements in",
    inputs: {
      ...BASE_INPUTS,
      compressor_rated_kw: 45,
      baseline_kwh_per_year: 322623,
      leakage_pct: 42,
      plant_mean_motor_load_factor: 0.55,
      plant_max_motor_oversize: 1.4,
      plant_pct_vfd_motors: 0.12,
      plant_avg_compressor_leakage_pct: 42,
    },
  },
];

async function pinnPredict(inputs: Record<string, unknown>) {
  const res = await fetch(`${INFERENCE_BASE_URL}/v1/predict`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(inputs),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`PINN /v1/predict failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function main() {
  const dealIdArgIdx = process.argv.indexOf("--deal-id");
  const dealId = dealIdArgIdx > 0 ? process.argv[dealIdArgIdx + 1] : "test-001";
  const ecmId = "ecm-1";

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Run: set -a; . ./.env.local; set +a; npx tsx scripts/seed-timeline-demo.ts");
    process.exit(2);
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  try {
    console.log(`[seed-timeline] target deal=${dealId} ecm=${ecmId}`);
    console.log(`[seed-timeline] inference at ${INFERENCE_BASE_URL}`);

    // 1. Look up (or create) the anchor underwriting_results row
    const existing = await sql<
      { id: string }[]
    >`SELECT id FROM underwriting_results WHERE deal_id = ${dealId} AND ecm_id = ${ecmId} LIMIT 1`;

    let underwritingId: string;
    if (existing.length > 0) {
      underwritingId = existing[0].id;
      console.log(`[seed-timeline] using existing underwriting_results id=${underwritingId}`);
    } else {
      const inserted = await sql<{ id: string }[]>`
        INSERT INTO underwriting_results
          (deal_id, ecm_id, equipment_type, sector, audit_inputs_json, baseline_kwh_per_year, status)
        VALUES
          (${dealId}, ${ecmId}, 'compressed_air', 'textiles', '{}'::jsonb, 322623, 'predicted')
        RETURNING id
      `;
      underwritingId = inserted[0].id;
      console.log(`[seed-timeline] created underwriting_results id=${underwritingId}`);
    }

    // 2. Wipe existing snapshots for this row (idempotent re-runs)
    await sql`DELETE FROM underwriting_snapshots WHERE underwriting_result_id = ${underwritingId}`;
    console.log(`[seed-timeline] wiped any prior snapshots`);

    // 3. Insert progressive snapshots
    for (const stage of STAGES) {
      const prediction = await pinnPredict(stage.inputs);
      await sql`
        INSERT INTO underwriting_snapshots
          (underwriting_result_id, snapshot_day, snapshot_at, inputs_json, prediction_json,
           model_used, pinn_savings_kwh, pinn_p5_lower_kwh, pinn_p95_upper_kwh, pinn_sigma_kwh,
           confidence_grade, label)
        VALUES
          (${underwritingId}, ${stage.day}, NOW(),
           ${JSON.stringify(stage.inputs)}::jsonb, ${JSON.stringify(prediction)}::jsonb,
           ${prediction.model_used},
           ${prediction.predicted_savings_kwh}, ${prediction.savings_lower_p5_kwh},
           ${prediction.savings_upper_p95_kwh}, ${prediction.sigma_kwh},
           ${prediction.confidence_grade}, ${stage.label})
      `;
      console.log(
        `[seed-timeline] Day ${stage.day.toString().padStart(2, "0")} | ${stage.label}\n` +
          `              model=${prediction.model_used.replace("exira_pinn_", "")}  ` +
          `point=${Math.round(prediction.predicted_savings_kwh).toLocaleString()}  ` +
          `P5=${Math.round(prediction.savings_lower_p5_kwh).toLocaleString()}  ` +
          `σ=±${Math.round(prediction.sigma_kwh).toLocaleString()}  grade=${prediction.confidence_grade}`
      );
    }

    // Update the anchor row's most-recent metrics to match the final snapshot
    const finalPred = await pinnPredict(STAGES[STAGES.length - 1].inputs);
    await sql`
      UPDATE underwriting_results
      SET pinn_savings_kwh = ${finalPred.predicted_savings_kwh},
          pinn_p5_lower_kwh = ${finalPred.savings_lower_p5_kwh},
          pinn_p95_upper_kwh = ${finalPred.savings_upper_p95_kwh},
          pinn_sigma_kwh = ${finalPred.sigma_kwh},
          confidence_grade = ${finalPred.confidence_grade},
          model_used = ${finalPred.model_used},
          sigma_scale_applied = ${finalPred.sigma_scale_applied},
          updated_at = NOW()
      WHERE id = ${underwritingId}
    `;
    console.log(`\n[seed-timeline] anchor row updated to final-snapshot values`);

    console.log(`\n[seed-timeline] DONE. Visit:`);
    console.log(`  → https://ascertainty.com/lender/${dealId}/timeline`);
    console.log(`  → https://ascertainty.com/lender/${dealId}`);
    console.log(`  → https://ascertainty.com/borrower/${dealId}`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
