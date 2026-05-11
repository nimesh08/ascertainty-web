/**
 * Sync all on-chain `Project` accounts into `public.projects`.
 *
 * Denormalises `msme_name/sector/location/upgrade_type` from the linked
 * `MrvProject` (Project on-chain doesn't carry them). Resolves the DB
 * `mrv_project_id` uuid by looking up `mrv_projects.onchain_pda`.
 *
 * Upsert key: `onchain_project_id`.
 */

import { getReadOnlyProgram } from "./connection";
import {
  bnToBigint,
  bnToNumber,
  bnToString,
  enumKey,
  fixedBytesToString,
  pkToString,
  tsToDate,
} from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

function mapProjectStatus(
  key: string | null
):
  | "pending"
  | "funding"
  | "active"
  | "repaying"
  | "completed"
  | "cancelled" {
  switch (key) {
    case "pending":
      return "pending";
    case "funding":
      return "funding";
    case "active":
      return "active";
    case "repaying":
      return "repaying";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export async function syncProjects(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).project.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const onchainProjectId = bnToBigint(a.projectId).toString();
      const mrvPda = pkToString(a.mrvProject);
      const tokenMint = pkToString(a.tokenMint);
      const usdcVault = pkToString(a.usdcVault);
      const targetUsdc = bnToString(a.targetAmount);
      const tokensSold = bnToString(a.tokensSold);
      const totalDistributed = bnToString(a.totalDistributed);
      const cumulativePerToken = bnToString(a.cumulativeUsdcPerToken);
      const termMonths = bnToNumber(a.termMonths);
      const status = mapProjectStatus(enumKey(a.status));
      const activatedAt = tsToDate(a.activatedAt);

      // Look up MRV row + denormalised name fields.
      const mrvRows = await sql<
        Array<{
          id: string;
          msme_name: string;
          sector: string;
          location: string;
          upgrade_type: string;
        }>
      >`
        SELECT id, msme_name, sector, location, upgrade_type
        FROM public.mrv_projects
        WHERE onchain_pda = ${mrvPda}
        LIMIT 1
      `;
      const mrv = mrvRows[0];

      // If the MRV hasn't been synced for some reason, try fetching directly
      // on-chain to at least populate the project row's NOT-NULL string cols.
      let msmeName = mrv?.msme_name ?? "";
      let sector = mrv?.sector ?? "";
      let location = mrv?.location ?? "";
      let upgradeType = mrv?.upgrade_type ?? "";
      if (!mrv) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mrvAcct: any = await (program.account as any).mrvProject.fetch(
            a.mrvProject
          );
          msmeName = fixedBytesToString(mrvAcct.msmeName);
          sector = fixedBytesToString(mrvAcct.sector);
          location = fixedBytesToString(mrvAcct.location);
          upgradeType = fixedBytesToString(mrvAcct.upgradeType);
        } catch (fetchErr) {
          console.warn(
            `[projects] MRV fetch fallback failed for ${mrvPda}: ${
              (fetchErr as Error).message
            }`
          );
        }
      }

      await sql`
        INSERT INTO public.projects (
          onchain_project_id, onchain_pda, token_mint, usdc_vault,
          msme_name, sector, location, upgrade_type,
          target_usdc, tokens_sold, total_distributed, cumulative_per_token,
          term_months, status, mrv_project_id, activated_at, synced_at
        ) VALUES (
          ${onchainProjectId}::bigint,
          ${pda},
          ${tokenMint},
          ${usdcVault},
          ${msmeName || `Project ${onchainProjectId}`},
          ${sector || "unknown"},
          ${location || "unknown"},
          ${upgradeType || "unknown"},
          ${targetUsdc}::numeric,
          ${tokensSold}::numeric,
          ${totalDistributed}::numeric,
          ${cumulativePerToken}::numeric,
          ${termMonths},
          ${status}::project_status,
          ${mrv?.id ?? null},
          ${activatedAt},
          now()
        )
        ON CONFLICT (onchain_project_id) DO UPDATE SET
          onchain_pda = EXCLUDED.onchain_pda,
          token_mint = EXCLUDED.token_mint,
          usdc_vault = EXCLUDED.usdc_vault,
          msme_name = EXCLUDED.msme_name,
          sector = EXCLUDED.sector,
          location = EXCLUDED.location,
          upgrade_type = EXCLUDED.upgrade_type,
          target_usdc = EXCLUDED.target_usdc,
          tokens_sold = EXCLUDED.tokens_sold,
          total_distributed = EXCLUDED.total_distributed,
          cumulative_per_token = EXCLUDED.cumulative_per_token,
          term_months = EXCLUDED.term_months,
          status = EXCLUDED.status,
          mrv_project_id = COALESCE(EXCLUDED.mrv_project_id, public.projects.mrv_project_id),
          activated_at = EXCLUDED.activated_at,
          synced_at = now()
      `;
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[projects] decode/upsert failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
