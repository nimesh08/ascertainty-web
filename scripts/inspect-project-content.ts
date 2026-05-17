/**
 * Read-only DB inspection — dumps the long-form content fields on every
 * project + underwriting row so we can audit DB content for off-brand
 * copy, stale TabPFN references, jargon, etc. Reads only, never writes.
 *
 * Run: npx tsx scripts/inspect-project-content.ts
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import postgres from "postgres";

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

function trunc(s: string | null | undefined, n = 200): string {
  if (s == null) return "(null)";
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = postgres(url, { prepare: false });

  try {
    const projects = await sql<
      {
        id: string;
        msme_name: string;
        sector: string;
        upgrade_type: string;
        description: string | null;
        about_project: string | null;
        highlights: unknown;
        management_text: string | null;
        financials_text: string | null;
      }[]
    >`SELECT id, msme_name, sector, upgrade_type, description,
             about_project, highlights, management_text, financials_text
        FROM projects
        ORDER BY created_at DESC`;

    console.log(`\n=== PROJECTS (${projects.length} rows) ===\n`);
    for (const p of projects) {
      console.log(`─── ${p.msme_name}  ·  ${p.sector}  ·  ${p.upgrade_type}`);
      console.log(`    id: ${p.id}`);
      console.log(`    description     : ${trunc(p.description)}`);
      console.log(`    about_project   : ${trunc(p.about_project)}`);
      console.log(
        `    highlights      : ${
          p.highlights == null
            ? "(null)"
            : trunc(JSON.stringify(p.highlights), 300)
        }`
      );
      console.log(`    management_text : ${trunc(p.management_text)}`);
      console.log(`    financials_text : ${trunc(p.financials_text)}`);
      console.log();
    }

    const uw = await sql<
      {
        deal_id: string;
        msme_name: string;
        model_used: string | null;
        confidence_grade: string | null;
        carbon_methodology: string | null;
      }[]
    >`SELECT ur.deal_id, p.msme_name, ur.model_used, ur.confidence_grade,
             ur.carbon_methodology
        FROM underwriting_results ur
        LEFT JOIN projects p ON p.id::text = ur.deal_id
        ORDER BY ur.created_at DESC`;

    console.log(`\n=== UNDERWRITING_RESULTS (${uw.length} rows) ===\n`);
    for (const u of uw) {
      console.log(`─── ${u.msme_name ?? "(no project)"}  ·  grade ${u.confidence_grade ?? "—"}`);
      console.log(`    deal_id            : ${u.deal_id}`);
      console.log(`    model_used         : ${u.model_used ?? "(null)"}`);
      console.log(`    carbon_methodology : ${u.carbon_methodology ?? "(null)"}`);
      console.log();
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
