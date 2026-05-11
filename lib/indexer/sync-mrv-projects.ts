/**
 * Sync all on-chain `MrvProject` accounts into `public.mrv_projects`.
 *
 * Upsert key: `onchain_pda` (the PDA base58). We also carry
 * `onchain_project_id` (the u64 MRV `project_id`) so other sync steps can
 * find the MRV row by the linked `Project.project_id`.
 */

import { getReadOnlyProgram } from "./connection";
import {
  bnToBigint,
  enumKey,
  fixedBytesToString,
  pkToString,
} from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

function mapMrvStatus(
  key: string | null
): "registered" | "baseline_submitted" | "verified" | "rejected" {
  switch (key) {
    case "registered":
      return "registered";
    case "baselinesubmitted":
      return "baseline_submitted";
    // On-chain enum uses `InProgress` once baseline has been submitted but
    // verifications are still streaming in. Closest DB bucket is
    // `baseline_submitted`.
    case "inprogress":
      return "baseline_submitted";
    // On-chain `Completed` means all verifications done == DB `verified`.
    case "completed":
      return "verified";
    case "rejected":
      return "rejected";
    default:
      return "registered";
  }
}

export async function syncMrvProjects(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).mrvProject.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const onchainProjectId = bnToBigint(a.projectId).toString();
      const msmeName = fixedBytesToString(a.msmeName);
      const sector = fixedBytesToString(a.sector);
      const location = fixedBytesToString(a.location);
      const upgradeType = fixedBytesToString(a.upgradeType);
      const status = mapMrvStatus(enumKey(a.status));
      const baselineSubmitted = Boolean(a.baselineSubmitted);
      const verificationCount = Number(a.verificationCount ?? 0);

      await sql`
        INSERT INTO public.mrv_projects (
          onchain_pda, onchain_project_id, msme_name, sector, location,
          upgrade_type, status, baseline_submitted, verification_count,
          synced_at
        ) VALUES (
          ${pda},
          ${onchainProjectId}::bigint,
          ${msmeName || "unknown"},
          ${sector || "unknown"},
          ${location || "unknown"},
          ${upgradeType || "unknown"},
          ${status}::mrv_project_status,
          ${baselineSubmitted},
          ${verificationCount},
          now()
        )
        ON CONFLICT (onchain_pda) DO UPDATE SET
          onchain_project_id = EXCLUDED.onchain_project_id,
          msme_name = EXCLUDED.msme_name,
          sector = EXCLUDED.sector,
          location = EXCLUDED.location,
          upgrade_type = EXCLUDED.upgrade_type,
          status = EXCLUDED.status,
          baseline_submitted = EXCLUDED.baseline_submitted,
          verification_count = EXCLUDED.verification_count,
          synced_at = now()
      `;
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[mrv] decode/upsert failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
