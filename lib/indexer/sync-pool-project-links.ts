/**
 * Sync all on-chain `PoolProjectLink` accounts into `public.pool_projects`.
 *
 * The on-chain account carries the Pool PDA and Project PDA; we resolve to
 * DB uuids via `pools.onchain_pda` + `projects.onchain_pda` before insert.
 *
 * De-dupe key: composite `(pool_id, project_id)` -> ON CONFLICT DO NOTHING.
 */

import { getReadOnlyProgram } from "./connection";
import { pkToString } from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

export async function syncPoolProjectLinks(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).poolProjectLink.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const poolPda = pkToString(entry.account.pool);
      const projectPda = pkToString(entry.account.project);

      const poolRows = await sql<Array<{ id: string }>>`
        SELECT id FROM public.pools WHERE onchain_pda = ${poolPda} LIMIT 1
      `;
      const projectRows = await sql<Array<{ id: string }>>`
        SELECT id FROM public.projects WHERE onchain_pda = ${projectPda} LIMIT 1
      `;

      if (poolRows.length === 0 || projectRows.length === 0) {
        console.warn(
          `[pool_project_link] skip ${pda}: pool or project row missing ` +
            `(pool=${poolPda}, project=${projectPda})`
        );
        result.skipped++;
        continue;
      }

      await sql`
        INSERT INTO public.pool_projects (pool_id, project_id, added_at)
        VALUES (${poolRows[0].id}, ${projectRows[0].id}, now())
        ON CONFLICT (pool_id, project_id) DO NOTHING
      `;
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[pool_project_link] failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
