/**
 * Sync all on-chain `Verification` accounts into `public.mrv_verifications`.
 *
 * Each on-chain `Verification` has an `index` u8 to distinguish periods, so
 * we use `(mrv_project_id, auditor_wallet, period_start, period_end)` as
 * the natural dedup key.
 */

import { getReadOnlyProgram } from "./connection";
import { bytesToHex, pkToString, tsToDate } from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

export async function syncVerifications(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).verification.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const mrvPda = pkToString(a.mrvProject);
      const auditorWallet = pkToString(a.auditor);
      const periodStart = tsToDate(a.periodStart);
      const periodEnd = tsToDate(a.periodEnd);
      const attested = Boolean(a.attested);
      const reportHash = bytesToHex(a.reportHash);

      if (!periodStart || !periodEnd) {
        console.warn(`[verifications] skip ${pda}: zero period timestamps`);
        result.skipped++;
        continue;
      }

      const mrvRows = await sql<Array<{ id: string }>>`
        SELECT id FROM public.mrv_projects WHERE onchain_pda = ${mrvPda} LIMIT 1
      `;
      if (mrvRows.length === 0) {
        console.warn(
          `[verifications] skip ${pda}: mrv_projects row not found for ${mrvPda}`
        );
        result.skipped++;
        continue;
      }
      const mrvProjectId = mrvRows[0].id;

      const existing = await sql<Array<{ id: string }>>`
        SELECT id FROM public.mrv_verifications
        WHERE mrv_project_id = ${mrvProjectId}
          AND auditor_wallet = ${auditorWallet}
          AND period_start = ${periodStart}
          AND period_end = ${periodEnd}
        LIMIT 1
      `;

      if (existing.length > 0) {
        await sql`
          UPDATE public.mrv_verifications SET
            attested = ${attested},
            report_hash = ${reportHash}
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO public.mrv_verifications (
            mrv_project_id, auditor_wallet, period_start, period_end,
            attested, report_hash
          ) VALUES (
            ${mrvProjectId},
            ${auditorWallet},
            ${periodStart},
            ${periodEnd},
            ${attested},
            ${reportHash}
          )
        `;
      }
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[verifications] failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
