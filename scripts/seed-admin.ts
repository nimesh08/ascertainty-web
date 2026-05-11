import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import postgres from "postgres";

// dotenv defaults to .env; Next.js-style .env.local is the canonical file
// for this repo, so load it explicitly if DATABASE_URL is not already set.
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
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    const adminWallet = "AMBKUrFo8LM9psLtppLZBbbXqNU99BQuw9tfeHME2Ltg";
    await sql`INSERT INTO admin_wallets(wallet_pubkey, display_name) VALUES (${adminWallet}, 'Exira Admin') ON CONFLICT DO NOTHING`;
    const rows = await sql`SELECT * FROM admin_wallets`;
    console.log("admin_wallets:", rows);
  } finally {
    await sql.end();
  }
}

main();
