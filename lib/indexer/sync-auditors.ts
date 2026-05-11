/**
 * Sync all on-chain `Auditor` accounts into `public.auditors`.
 *
 * Upsert key: `wallet_pubkey` (the primary key).
 */

import { getReadOnlyProgram } from "./connection";
import { fixedBytesToString, pkToString } from "./decode";
import { emptyResult, getIndexerSql, type SyncResult } from "./db";

export async function syncAuditors(): Promise<SyncResult> {
  const program = getReadOnlyProgram();
  const sql = getIndexerSql();
  const result = emptyResult();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = await (program.account as any).auditor.all();
  result.count = all.length;

  for (const entry of all) {
    const pda = pkToString(entry.publicKey);
    try {
      const a = entry.account;
      const wallet = pkToString(a.wallet);
      const name = fixedBytesToString(a.name) || `Auditor ${wallet.slice(0, 8)}`;
      const certification = fixedBytesToString(a.certification) || "unknown";
      const isActive = Boolean(a.isActive);

      await sql`
        INSERT INTO public.auditors (
          wallet_pubkey, name, certification, is_active, onchain_registered
        ) VALUES (
          ${wallet}, ${name}, ${certification}, ${isActive}, true
        )
        ON CONFLICT (wallet_pubkey) DO UPDATE SET
          name = EXCLUDED.name,
          certification = EXCLUDED.certification,
          is_active = EXCLUDED.is_active,
          onchain_registered = true
      `;
      result.upserted++;
    } catch (e) {
      const err = (e as Error).message;
      console.error(`[auditors] failed for ${pda}: ${err}`);
      result.errors.push({ pda, error: err });
      result.skipped++;
    }
  }

  return result;
}
