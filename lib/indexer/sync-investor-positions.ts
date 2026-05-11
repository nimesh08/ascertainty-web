/**
 * Sync all on-chain `InvestorPosition` accounts into `public.investor_positions`.
 *
 * Positions point at *either* a Project PDA or a Pool PDA via their `target`
 * field. We try projects first; if no match, try pools. If neither matches,
 * skip (log a warning) — can happen transiently when positions are synced
 * before their target account.
 *
 * Upsert key: `onchain_pda`.
 */

import { getReadOnlyProgram } from "./connection";
import { bnToString, pkToString } from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

export async function syncInvestorPositions(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).investorPosition.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const owner = pkToString(a.owner);
      const targetPda = pkToString(a.target);
      const tokenAmount = bnToString(a.tokensHeld);
      const lastCumulativePerToken = bnToString(a.lastClaimedPerToken);
      const claimedTotal = bnToString(a.totalClaimed);

      const projectRows = await sql<Array<{ id: string }>>`
        SELECT id FROM public.projects WHERE onchain_pda = ${targetPda} LIMIT 1
      `;
      let projectId: string | null = projectRows[0]?.id ?? null;
      let poolId: string | null = null;

      if (!projectId) {
        const poolRows = await sql<Array<{ id: string }>>`
          SELECT id FROM public.pools WHERE onchain_pda = ${targetPda} LIMIT 1
        `;
        poolId = poolRows[0]?.id ?? null;
      }

      if (!projectId && !poolId) {
        console.warn(
          `[investor_positions] skip ${pda}: target ${targetPda} not in projects or pools`
        );
        result.skipped++;
        continue;
      }

      // `onchain_pda` has no unique constraint in the schema, so we can't
      // use ON CONFLICT on it. Do a manual select-then-update/insert
      // against the natural dedup keys (partial unique indexes on
      // wallet+project or wallet+pool).
      const existing = await sql<Array<{ id: string }>>`
        SELECT id FROM public.investor_positions WHERE onchain_pda = ${pda} LIMIT 1
      `;
      if (existing.length > 0) {
        await sql`
          UPDATE public.investor_positions SET
            wallet_pubkey = ${owner},
            project_id = ${projectId},
            pool_id = ${poolId},
            token_amount = ${tokenAmount}::numeric,
            last_cumulative_per_token = ${lastCumulativePerToken}::numeric,
            claimed_total = ${claimedTotal}::numeric,
            synced_at = now()
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO public.investor_positions (
            wallet_pubkey, project_id, pool_id, token_amount,
            last_cumulative_per_token, claimed_total, onchain_pda, synced_at
          ) VALUES (
            ${owner}, ${projectId}, ${poolId},
            ${tokenAmount}::numeric,
            ${lastCumulativePerToken}::numeric,
            ${claimedTotal}::numeric,
            ${pda},
            now()
          )
        `;
      }
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[investor_positions] failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
