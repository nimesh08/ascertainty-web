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

// Default seed wallet retained for backwards compat — older runs of this script
// pre-seeded this address. Override via --wallet <pubkey> --name "Display Name".
const DEFAULT_SEED_WALLET = "AMBKUrFo8LM9psLtppLZBbbXqNU99BQuw9tfeHME2Ltg";
const DEFAULT_SEED_NAME = "Ascertainty Admin";

function parseArgs() {
  const args = process.argv.slice(2);
  let wallet: string | null = null;
  let name: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--wallet" && args[i + 1]) {
      wallet = args[++i];
    } else if (args[i] === "--name" && args[i + 1]) {
      name = args[++i];
    }
  }
  return { wallet, name };
}

async function main() {
  const { wallet, name } = parseArgs();
  const targetWallet = wallet ?? DEFAULT_SEED_WALLET;
  const targetName = name ?? (wallet ? "Admin" : DEFAULT_SEED_NAME);

  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    await sql`
      INSERT INTO admin_wallets(wallet_pubkey, display_name)
      VALUES (${targetWallet}, ${targetName})
      ON CONFLICT (wallet_pubkey) DO UPDATE SET display_name = EXCLUDED.display_name
    `;
    console.log(`✓ upserted admin: ${targetWallet} (${targetName})`);
    const rows = await sql`SELECT wallet_pubkey, display_name, added_at FROM admin_wallets ORDER BY added_at`;
    console.log("\nadmin_wallets:");
    for (const r of rows) console.log(" ", r);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
