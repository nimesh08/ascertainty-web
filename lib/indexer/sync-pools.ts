/**
 * Sync all on-chain `Pool` accounts into `public.pools`.
 *
 * Pool accounts on-chain don't carry a display `name`/`description` yet, so
 * we fall back to `Pool #<id>` / empty string for those.
 *
 * Upsert key: `onchain_pool_id`.
 */

import { getReadOnlyProgram } from "./connection";
import { bnToBigint, bnToString, enumKey, pkToString } from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

function mapPoolStatus(
  key: string | null
): "funding" | "active" | "distributing" | "completed" | "cancelled" {
  switch (key) {
    case "funding":
      return "funding";
    case "active":
      return "active";
    case "distributing":
      return "distributing";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "funding";
  }
}

export async function syncPools(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).pool.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const onchainPoolId = bnToBigint(a.poolId).toString();
      const poolTokenMint = pkToString(a.poolTokenMint);
      const usdcVault = pkToString(a.usdcVault);
      const targetUsdc = bnToString(a.targetAmount);
      const tokensSold = bnToString(a.tokensSold);
      const totalDistributed = bnToString(a.totalDistributed);
      const cumulativePerToken = bnToString(a.cumulativeUsdcPerToken);
      const status = mapPoolStatus(enumKey(a.status));

      await sql`
        INSERT INTO public.pools (
          onchain_pool_id, onchain_pda, pool_token_mint, usdc_vault,
          name, description, target_usdc, tokens_sold, total_distributed,
          cumulative_per_token, status, synced_at
        ) VALUES (
          ${onchainPoolId}::bigint,
          ${pda},
          ${poolTokenMint},
          ${usdcVault},
          ${`Pool #${onchainPoolId}`},
          ${null},
          ${targetUsdc}::numeric,
          ${tokensSold}::numeric,
          ${totalDistributed}::numeric,
          ${cumulativePerToken}::numeric,
          ${status}::pool_status,
          now()
        )
        ON CONFLICT (onchain_pool_id) DO UPDATE SET
          onchain_pda = EXCLUDED.onchain_pda,
          pool_token_mint = EXCLUDED.pool_token_mint,
          usdc_vault = EXCLUDED.usdc_vault,
          target_usdc = EXCLUDED.target_usdc,
          tokens_sold = EXCLUDED.tokens_sold,
          total_distributed = EXCLUDED.total_distributed,
          cumulative_per_token = EXCLUDED.cumulative_per_token,
          status = EXCLUDED.status,
          synced_at = now()
      `;
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[pools] decode/upsert failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
