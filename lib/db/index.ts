import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __exiraPg: ReturnType<typeof postgres> | undefined;
}

const sql =
  globalThis.__exiraPg ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: 3,
    idle_timeout: 30,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__exiraPg = sql;
}

export const db = drizzle(sql, { schema });

export { schema };

export async function closeDb(): Promise<void> {
  await sql.end({ timeout: 5 });
}
