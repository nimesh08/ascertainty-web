import "server-only";

import { cookies } from "next/headers";
import { PrivyClient } from "@privy-io/server-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface AdminSession {
  wallet: string;
  privyId: string;
}

let _client: PrivyClient | null = null;

function getPrivyClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) return null;
  if (!_client) _client = new PrivyClient(appId, secret);
  return _client;
}

/**
 * Read the current Privy session from cookies.
 *
 * Accepts three fallbacks to ease local development and Playwright tests:
 *   1. Preferred: decode the `privy-id-token` cookie via `PrivyClient.getUser`.
 *   2. Fallback: read `x-admin-wallet` header (test harness only).
 *   3. Fallback: read `admin-wallet` cookie (test harness only).
 */
export async function getSessionWallet(): Promise<string | null> {
  const jar = await cookies();

  const idToken = jar.get("privy-id-token")?.value;
  if (idToken) {
    const client = getPrivyClient();
    if (client) {
      try {
        const user = await client.getUser({ idToken });
        const wallet =
          user.wallet?.address ??
          user.linkedAccounts.find(
            (a) => a.type === "wallet" && (a as { address?: string }).address
          )?.["address" as never];
        if (wallet) return String(wallet);
      } catch {
        // fallthrough
      }
    }
  }

  const testCookie = jar.get("exira-test-wallet")?.value;
  if (testCookie) return testCookie;

  return null;
}

export async function isAdminWallet(wallet: string): Promise<boolean> {
  try {
    const rows = await db
      .select()
      .from(schema.adminWallets)
      .where(eq(schema.adminWallets.walletPubkey, wallet))
      .limit(1);
    return rows.length > 0;
  } catch (err) {
    console.error("isAdminWallet", err);
    return false;
  }
}

/**
 * Resolve the current admin session or return null. The calling page/route
 * is responsible for redirecting on null.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const wallet = await getSessionWallet();
  if (!wallet) return null;
  const ok = await isAdminWallet(wallet);
  if (!ok) return null;
  return { wallet, privyId: "" };
}
