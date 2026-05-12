import "server-only";

import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSessionWallet } from "@/lib/admin/session";

export interface AuditorSession {
  wallet: string;
  name: string;
  certification: string;
}

/**
 * Resolve the current auditor session. An auditor is any wallet that:
 *  - has a valid Privy session (or test-harness cookie), AND
 *  - exists in the `auditors` table with is_active=true.
 *
 * For v0.1 Portal MVP, ALSO allow admin wallets to act as auditors
 * (operators shadow-entering audit data during a live field test).
 */
export async function getAuditorSession(): Promise<AuditorSession | null> {
  const wallet = await getSessionWallet();
  if (!wallet) return null;

  try {
    const auditorRows = await db
      .select()
      .from(schema.auditors)
      .where(
        and(
          eq(schema.auditors.walletPubkey, wallet),
          eq(schema.auditors.isActive, true)
        )
      )
      .limit(1);
    if (auditorRows.length > 0) {
      return {
        wallet,
        name: auditorRows[0].name,
        certification: auditorRows[0].certification,
      };
    }

    // v0.1 fallback: admin wallets are also auditors during shadow dogfooding
    const adminRows = await db
      .select()
      .from(schema.adminWallets)
      .where(eq(schema.adminWallets.walletPubkey, wallet))
      .limit(1);
    if (adminRows.length > 0) {
      return {
        wallet,
        name: adminRows[0].displayName ?? "Ascertainty Admin (shadow auditor)",
        certification: "exira-admin",
      };
    }
  } catch (err) {
    console.error("getAuditorSession", err);
  }
  return null;
}
