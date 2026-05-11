import * as fs from "node:fs";
import * as path from "node:path";

// Load .env.local so unit tests see DATABASE_URL / program id.
function loadEnv(file: string) {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  const lines = fs.readFileSync(p, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}

loadEnv(".env.local");
