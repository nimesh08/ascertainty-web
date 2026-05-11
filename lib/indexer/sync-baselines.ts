/**
 * Sync all on-chain `Baseline` accounts into `public.mrv_baselines`.
 *
 * There's no FK from Baseline -> mrv_baselines.id on-chain; we match by
 * `(mrv_project_id, auditor_wallet)`, which is effectively the on-chain
 * PDA dedup key (baselines are one-per-project-per-auditor).
 *
 * Dedupe is done manually because the DB doesn't carry a unique constraint
 * on `(mrv_project_id, auditor_wallet)` yet. This keeps the sync idempotent
 * without requiring a schema change.
 */

import { getReadOnlyProgram } from "./connection";
import { bnToBigint, bytesToHex, fixedBytesToString, pkToString } from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

export async function syncBaselines(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).baseline.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const mrvPda = pkToString(a.mrvProject);
      const auditorWallet = pkToString(a.auditor);
      const energyKwhPerYear = bnToBigint(a.energyKwhPerYear).toString();
      const fuelType = fixedBytesToString(a.fuelType) || "unknown";
      const reportHash = bytesToHex(a.reportHash);

      const mrvRows = await sql<Array<{ id: string }>>`
        SELECT id FROM public.mrv_projects WHERE onchain_pda = ${mrvPda} LIMIT 1
      `;
      if (mrvRows.length === 0) {
        console.warn(
          `[baselines] skip ${pda}: mrv_projects row not found for ${mrvPda}`
        );
        result.skipped++;
        continue;
      }
      const mrvProjectId = mrvRows[0].id;

      const existing = await sql<Array<{ id: string }>>`
        SELECT id FROM public.mrv_baselines
        WHERE mrv_project_id = ${mrvProjectId}
          AND auditor_wallet = ${auditorWallet}
        LIMIT 1
      `;

      if (existing.length > 0) {
        await sql`
          UPDATE public.mrv_baselines SET
            energy_kwh_per_year = ${energyKwhPerYear}::bigint,
            fuel_type = ${fuelType},
            report_hash = ${reportHash}
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO public.mrv_baselines (
            mrv_project_id, auditor_wallet, energy_kwh_per_year, fuel_type, report_hash
          ) VALUES (
            ${mrvProjectId},
            ${auditorWallet},
            ${energyKwhPerYear}::bigint,
            ${fuelType},
            ${reportHash}
          )
        `;
      }
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[baselines] failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
