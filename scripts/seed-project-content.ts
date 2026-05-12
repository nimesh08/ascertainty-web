/**
 * One-shot: seed realistic placeholder content onto the 2 existing projects
 * (Lucas TVS Devnet, Test MSME) + any other projects without admin content yet.
 *
 * Uses COALESCE so it will NOT overwrite any value the admin has already set.
 * Safe to re-run.
 *
 * Usage:
 *   bash -c 'set -a && source .env.local && set +a && npx tsx scripts/seed-project-content.ts'
 */
import postgres from "postgres";

interface ProjectRow {
  id: string;
  msme_name: string;
  sector: string;
  upgrade_type: string;
  location: string;
}

const COMMON_HIGHLIGHTS = [
  {
    title: "Verified Savings",
    detail: "Audited by KISEM partners.",
    icon: "shield-check",
  },
  {
    title: "Escrow Secured",
    detail: "Repayments routed via on-chain escrow.",
    icon: "shield",
  },
  {
    title: "Stable Returns",
    detail: "Fixed monthly repayment schedule.",
    icon: "trending-up",
  },
  {
    title: "MRV Oracle",
    detail: "On-chain verification by registered auditors.",
    icon: "badge-check",
  },
];

const DEFAULT_MANAGEMENT =
  "Operated by an Ascertainty-verified partner. 24/7 performance monitoring and remote telemetry keep the upgraded equipment running at spec. Designed for a 10-year service life with scheduled preventative maintenance.";

const DEFAULT_FINANCIALS =
  "Returns are generated from the verified energy-cost savings of the upgraded equipment. Every month, a portion of those savings is swept on-chain and streamed to token holders pro-rata. All fund movements are auditable on Solana.";

const DEFAULT_DOCUMENTS = [
  { name: "Baseline Report.pdf", url: "#" },
  { name: "Feasibility Study.pdf", url: "#" },
];

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function describeProject(p: ProjectRow): string {
  const sector = titleCase(p.sector);
  const upgrade = p.upgrade_type;
  return [
    `${p.msme_name} is a ${sector.toLowerCase()} MSME located in ${p.location}. The project finances the capital cost of ${upgrade}, a proven upgrade path that reduces the facility's primary energy bill while cutting tailpipe emissions.`,
    `Ascertainty originates the investment through a fixed-term debt structure: investors deposit USDC into an on-chain escrow, the facility operator receives funds at activation, and monthly repayments are streamed back to token holders based on audited, verified savings.`,
    `An Ascertainty-registered MRV auditor submits a baseline before funding and periodic verification reports during the repayment phase. Disbursements can only originate from the escrow PDA, and all MRV attestations are preserved on-chain for the life of the project.`,
  ].join("\n\n");
}

function aboutProject(p: ProjectRow): string {
  return `${p.msme_name} funds ${p.upgrade_type} for a ${titleCase(p.sector).toLowerCase()} operation in ${p.location}. Capital is deployed under a transparent, escrow-backed structure with verified monthly savings driving investor returns.`;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  try {
    const rows: ProjectRow[] = await sql.unsafe(`
      SELECT id, msme_name, sector, upgrade_type, location
      FROM public.projects
    `);

    console.log(`Found ${rows.length} projects to seed.`);
    let updated = 0;

    for (const p of rows) {
      const description = describeProject(p);
      const about = aboutProject(p);
      const highlights = JSON.stringify(COMMON_HIGHLIGHTS);
      const documents = JSON.stringify(DEFAULT_DOCUMENTS);

      const isLucas = /lucas/i.test(p.msme_name);
      const apyBps = isLucas ? 1450 : 1200;

      // COALESCE so we only fill NULLs — never overwrite admin-set values.
      const res = await sql.unsafe(
        `
        UPDATE public.projects SET
          description      = COALESCE(description,      $1),
          about_project    = COALESCE(about_project,    $2),
          highlights       = COALESCE(highlights,       $3::jsonb),
          management_text  = COALESCE(management_text,  $4),
          financials_text  = COALESCE(financials_text,  $5),
          documents        = COALESCE(documents,        $6::jsonb),
          trust_score      = COALESCE(trust_score,      $7),
          expected_apy_bps = COALESCE(expected_apy_bps, $8)
        WHERE id = $9
        RETURNING id
        `,
        [
          description,
          about,
          highlights,
          DEFAULT_MANAGEMENT,
          DEFAULT_FINANCIALS,
          documents,
          75,
          apyBps,
          p.id,
        ]
      );
      if (res.length > 0) updated++;
      console.log(
        `  ✓ ${p.msme_name}  (apy=${(apyBps / 100).toFixed(2)}%, trust=75)`
      );
    }

    // Pools: seed the same defaults on every pool missing content.
    const pools: Array<{ id: string; name: string }> = await sql.unsafe(`
      SELECT id, name FROM public.pools
    `);
    console.log(`Found ${pools.length} pools to seed.`);
    for (const pool of pools) {
      await sql.unsafe(
        `
        UPDATE public.pools SET
          description      = COALESCE(description,      $1),
          about_pool       = COALESCE(about_pool,       $2),
          highlights       = COALESCE(highlights,       $3::jsonb),
          management_text  = COALESCE(management_text,  $4),
          financials_text  = COALESCE(financials_text,  $5),
          documents        = COALESCE(documents,        $6::jsonb),
          trust_score      = COALESCE(trust_score,      $7),
          expected_apy_bps = COALESCE(expected_apy_bps, $8)
        WHERE id = $9
        `,
        [
          `${pool.name} is a diversified basket of Ascertainty-originated MSME investments. Investors receive a single blended token; distributions from each underlying project stream into the pool vault and are pro-rated across holders.`,
          `${pool.name} combines multiple vetted projects into one position, reducing concentration risk while preserving the same escrow + MRV guarantees as single-project investments.`,
          JSON.stringify(COMMON_HIGHLIGHTS),
          "Pool operations are managed by Ascertainty. Underlying project selections are reviewed quarterly against MRV performance and repayment history.",
          DEFAULT_FINANCIALS,
          JSON.stringify(DEFAULT_DOCUMENTS),
          80,
          1150,
          pool.id,
        ]
      );
      console.log(`  ✓ ${pool.name}  (apy=11.50%, trust=80)`);
    }

    console.log(
      `\nDone. Projects touched: ${updated}/${rows.length}. Pools touched: ${pools.length}.`
    );
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
