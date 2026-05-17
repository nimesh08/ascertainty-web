/**
 * One-shot DB content cleanup migration. Addresses the findings from
 * inspect-project-content.ts:
 *
 *   A. Rename "Lucas TVS Devnet" → "Lucas TVS"
 *   B. Fix Lucas TVS prose grammar ("a auto", "heat_pump")
 *   C. Re-encode Lucas TVS highlights from JSON string → JSONB array
 *   D. Lucas TVS management_text: "Exira-verified" → "Ascertainty-verified"
 *   E. Strip the "TabPFN v2 underwritten" entry from every project's
 *      highlights array (contradicts the architecture-flex framing
 *      now locked on /approach)
 *   F. Normalize underwriting_results.model_used to clean values:
 *        "exira_pinn_unified_v1"        → "PINN unified"
 *        "exira_pinn_compressed_air_v1" → "PINN compressed-air specialist"
 *        "PINN unified v0.1 (21-feature audit, IN-BEE)" → "PINN unified"
 *   G. Delete the duplicate "Smart Pumping for Agriculture" project row
 *      (keep oldest by created_at). Skip if either row has dependent
 *      transactions / baselines / verifications.
 *
 * Idempotent — safe to re-run. Reads before each write; reports counts.
 *
 * Usage:
 *   npx tsx scripts/cleanup-content.ts --dry-run   # preview, no writes
 *   npx tsx scripts/cleanup-content.ts             # apply
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

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const sql = postgres(url, { prepare: false });

  console.log(
    DRY_RUN
      ? "─── DRY RUN — no writes will be made ───\n"
      : "─── LIVE RUN — applying changes ───\n"
  );

  try {
    // ─────────────────────────────────────────────────────────────────
    // A. Rename Lucas TVS Devnet → Lucas TVS
    // ─────────────────────────────────────────────────────────────────
    const aRows = await sql<
      { id: string }[]
    >`SELECT id FROM projects WHERE msme_name = 'Lucas TVS Devnet'`;
    console.log(`[A] Rename Lucas TVS Devnet → Lucas TVS: ${aRows.length} row(s)`);
    if (!DRY_RUN && aRows.length > 0) {
      await sql`UPDATE projects SET msme_name = 'Lucas TVS' WHERE msme_name = 'Lucas TVS Devnet'`;
    }

    // ─────────────────────────────────────────────────────────────────
    // B. Fix Lucas TVS prose grammar + snake_case
    // ─────────────────────────────────────────────────────────────────
    const newDescription =
      "Lucas TVS finances a heat-pump retrofit on the plant utility loop at its Chennai auto-components facility. The upgrade displaces conventional thermal loads with high-COP heat-pump technology, reducing the site's primary energy bill while cutting carbon intensity.";
    const newAbout =
      "Lucas TVS retrofits its plant utility loop with a heat-pump system at the Chennai auto-components site. Capital is deployed under a transparent, escrow-backed structure with verified monthly savings driving investor returns.";
    const lucasRows = await sql<
      { id: string; description: string | null; about_project: string | null }[]
    >`SELECT id, description, about_project FROM projects WHERE msme_name IN ('Lucas TVS', 'Lucas TVS Devnet')`;
    const needsBFix = lucasRows.filter(
      (r) =>
        (r.description && (r.description.includes("a auto") || r.description.includes("heat_pump"))) ||
        (r.about_project && (r.about_project.includes("a auto") || r.about_project.includes("heat_pump")))
    );
    console.log(`[B] Fix Lucas TVS prose grammar: ${needsBFix.length} row(s)`);
    if (!DRY_RUN) {
      for (const row of needsBFix) {
        await sql`UPDATE projects SET description = ${newDescription}, about_project = ${newAbout} WHERE id = ${row.id}`;
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // C. Re-encode Lucas TVS highlights from string → JSONB array
    // ─────────────────────────────────────────────────────────────────
    const cRows = await sql<
      { id: string; highlights: unknown }[]
    >`SELECT id, highlights FROM projects WHERE msme_name IN ('Lucas TVS', 'Lucas TVS Devnet')`;
    let cFixed = 0;
    for (const row of cRows) {
      if (typeof row.highlights === "string") {
        try {
          const parsed = JSON.parse(row.highlights);
          if (Array.isArray(parsed)) {
            cFixed++;
            console.log(
              `[C] Lucas TVS highlights re-encode (id=${row.id}): string → ${parsed.length}-item array`
            );
            if (!DRY_RUN) {
              await sql`UPDATE projects SET highlights = ${JSON.stringify(parsed)}::jsonb WHERE id = ${row.id}`;
            }
          }
        } catch (err) {
          console.log(`[C] FAILED to parse highlights for id=${row.id}: ${err}`);
        }
      }
    }
    console.log(`[C] Total re-encoded: ${cFixed} row(s)`);

    // ─────────────────────────────────────────────────────────────────
    // D. Lucas TVS management_text: Exira-verified → Ascertainty-verified
    // ─────────────────────────────────────────────────────────────────
    const dRows = await sql<
      { id: string }[]
    >`SELECT id FROM projects WHERE management_text LIKE '%Exira-verified%'`;
    console.log(`[D] Exira-verified → Ascertainty-verified: ${dRows.length} row(s)`);
    if (!DRY_RUN && dRows.length > 0) {
      await sql`UPDATE projects SET management_text = REPLACE(management_text, 'Exira-verified', 'Ascertainty-verified') WHERE management_text LIKE '%Exira-verified%'`;
    }

    // ─────────────────────────────────────────────────────────────────
    // E. Strip TabPFN-mentioning entries from every project's highlights
    // ─────────────────────────────────────────────────────────────────
    const eRows = await sql<
      { id: string; msme_name: string; highlights: unknown }[]
    >`SELECT id, msme_name, highlights FROM projects WHERE highlights::text ILIKE '%TabPFN%'`;
    console.log(`[E] Projects with TabPFN highlights: ${eRows.length} row(s)`);
    let eFixed = 0;
    for (const row of eRows) {
      let arr: Array<{ title?: string; detail?: string; icon?: string }>;
      if (Array.isArray(row.highlights)) {
        arr = row.highlights as Array<{ title?: string; detail?: string; icon?: string }>;
      } else if (typeof row.highlights === "string") {
        try {
          arr = JSON.parse(row.highlights);
        } catch {
          console.log(`[E] SKIP id=${row.id} — couldn't parse highlights`);
          continue;
        }
      } else {
        continue;
      }
      const filtered = arr.filter((h) => {
        const t = (h?.title ?? "").toLowerCase();
        const d = (h?.detail ?? "").toLowerCase();
        return !t.includes("tabpfn") && !d.includes("tabpfn");
      });
      if (filtered.length !== arr.length) {
        eFixed++;
        console.log(
          `[E] ${row.msme_name}: ${arr.length} → ${filtered.length} highlights (id=${row.id})`
        );
        if (!DRY_RUN) {
          await sql`UPDATE projects SET highlights = ${JSON.stringify(filtered)}::jsonb WHERE id = ${row.id}`;
        }
      }
    }
    console.log(`[E] Total updated: ${eFixed} row(s)`);

    // ─────────────────────────────────────────────────────────────────
    // F. Normalize underwriting_results.model_used
    // ─────────────────────────────────────────────────────────────────
    const fRows = await sql<
      { deal_id: string; model_used: string }[]
    >`SELECT deal_id, model_used FROM underwriting_results WHERE model_used IS NOT NULL`;
    let fFixed = 0;
    for (const row of fRows) {
      let target: string | null = null;
      if (row.model_used.startsWith("exira_pinn_compressed_air")) {
        target = "PINN compressed-air specialist";
      } else if (row.model_used.startsWith("exira_pinn_unified")) {
        target = "PINN unified";
      } else if (/^PINN\s+compressed[- ]air/i.test(row.model_used)) {
        target = "PINN compressed-air specialist";
      } else if (/^PINN\s+unified/i.test(row.model_used)) {
        target = "PINN unified";
      }
      if (target && target !== row.model_used) {
        fFixed++;
        console.log(`[F] ${row.deal_id}: "${row.model_used}" → "${target}"`);
        if (!DRY_RUN) {
          await sql`UPDATE underwriting_results SET model_used = ${target} WHERE deal_id = ${row.deal_id}`;
        }
      }
    }
    console.log(`[F] Total updated: ${fFixed} row(s)`);

    // ─────────────────────────────────────────────────────────────────
    // G. Drop duplicate "Smart Pumping for Agriculture" (keep oldest)
    // ─────────────────────────────────────────────────────────────────
    const dupes = await sql<
      { id: string; created_at: Date }[]
    >`SELECT id, created_at FROM projects WHERE msme_name = 'Smart Pumping for Agriculture' ORDER BY created_at ASC`;
    console.log(`[G] Smart Pumping for Agriculture: ${dupes.length} row(s) found`);
    if (dupes.length > 1) {
      const keep = dupes[0];
      console.log(`[G] Keeping oldest: ${keep.id} (created ${keep.created_at.toISOString()})`);
      for (const row of dupes.slice(1)) {
        // Only transactions directly references projects.id. MRV tables go
        // through the mrv_projects bridge; pool_projects + positions etc
        // would error on DELETE due to FK if they exist (safe failure mode).
        const txns = await sql<
          { c: bigint }[]
        >`SELECT count(*)::bigint AS c FROM transactions WHERE project_id = ${row.id}`;
        const positions = await sql<
          { c: bigint }[]
        >`SELECT count(*)::bigint AS c FROM investor_positions WHERE project_id = ${row.id}`;
        const dep = Number(txns[0].c) + Number(positions[0].c);
        console.log(
          `[G] Candidate ${row.id}: ${dep} dependent rows (txns=${txns[0].c}, positions=${positions[0].c})`
        );
        if (dep > 0) {
          console.log(`[G]   SKIP delete — has dependents. Resolve manually.`);
        } else {
          console.log(`[G]   Safe to delete.`);
          if (!DRY_RUN) {
            await sql`DELETE FROM projects WHERE id = ${row.id}`;
          }
        }
      }
    }

    console.log("\nDone.");
    if (DRY_RUN) console.log("Re-run without --dry-run to apply changes.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
