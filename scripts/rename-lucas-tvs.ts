/**
 * One-shot DB rename: "Lucas TVS Devnet" → "Lucas TVS".
 *
 * The project was seeded with a "Devnet" suffix to mark it as a devnet test
 * record (see scripts/seed-projects-v03.ts). The suffix leaked through to the
 * public /projects list. Other projects don't have the suffix, so renaming
 * brings this row in line with the rest of the corpus.
 *
 * Run: npx tsx scripts/rename-lucas-tvs.ts
 *
 * Idempotent: no-op if the row already reads "Lucas TVS".
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import postgres from "postgres";

// Load .env.local if DATABASE_URL is not in the environment.
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

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { prepare: false });

  try {
    const before = await sql<
      { id: string; msme_name: string }[]
    >`SELECT id, msme_name FROM projects WHERE msme_name = 'Lucas TVS Devnet'`;

    if (before.length === 0) {
      console.log("No row with msme_name = 'Lucas TVS Devnet' — nothing to rename.");
      return;
    }

    console.log(`Found ${before.length} row(s) to rename:`);
    for (const row of before) console.log(`  ${row.id}  ${row.msme_name}`);

    const updated = await sql<
      { id: string; msme_name: string }[]
    >`UPDATE projects SET msme_name = 'Lucas TVS' WHERE msme_name = 'Lucas TVS Devnet' RETURNING id, msme_name`;

    console.log(`\nRenamed ${updated.length} row(s):`);
    for (const row of updated) console.log(`  ${row.id}  ${row.msme_name}`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
