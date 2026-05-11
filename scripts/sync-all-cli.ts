/**
 * One-shot CLI wrapper around `syncAll()`.
 *
 * Usage:
 *   cd /home/ubuntu/exira-web-v2 && npx tsx scripts/sync-all-cli.ts
 *
 * Env (auto-loaded from .env.local via dotenv):
 *   DATABASE_URL
 *   HELIUS_RPC_URL          (optional, preferred)
 *   NEXT_PUBLIC_SOLANA_RPC  (fallback)
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}

async function main() {
  loadEnvLocal();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set (check .env.local)");
  }
  const { syncAll } = await import("../lib/indexer/sync-all");
  const { closeIndexerSql } = await import("../lib/indexer/db");
  const result = await syncAll();
  console.log(JSON.stringify(result, null, 2));
  await closeIndexerSql();
  process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
  console.error("[sync-all-cli] ERROR:", e);
  process.exit(1);
});
