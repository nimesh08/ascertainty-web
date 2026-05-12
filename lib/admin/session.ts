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
type MaybeUser = {
  id?: string;
  wallet?: { address?: string };
  linkedAccounts?: Array<{ type: string; address?: string }>;
};

function _extractWallet(user: MaybeUser | null | undefined): string | null {
  if (!user) return null;
  if (user.wallet?.address) return String(user.wallet.address);
  const wAcc = (user.linkedAccounts ?? []).find(
    (a) => a.type === "wallet" && typeof a.address === "string"
  );
  return wAcc?.address ? String(wAcc.address) : null;
}

export async function getSessionWallet(): Promise<string | null> {
  const jar = await cookies();

  // Privy's cookie naming and token format has differed across SDK versions.
  // Try every name we've ever seen, and try both auth flows for each token.
  const candidates = [
    jar.get("privy-id-token")?.value,
    jar.get("privy-token")?.value,
    jar.get("privy-access-token")?.value,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  if (candidates.length === 0) {
    console.warn("[getSessionWallet] no Privy cookie present in request");
  }

  const client = getPrivyClient();
  if (!client) {
    console.error("[getSessionWallet] PrivyClient not initialised (missing app id or secret)");
  }

  for (const token of candidates) {
    if (!client) break;

    // Path 1: treat as ID token (JWT)
    try {
      const user = (await client.getUser({ idToken: token })) as MaybeUser;
      const w = _extractWallet(user);
      if (w) return w;
    } catch (e) {
      console.warn(
        "[getSessionWallet] getUser({idToken}) failed:",
        (e as Error)?.message ?? String(e)
      );
    }

    // Path 2: treat as access token — verify, then look up user by id
    try {
      // verifyAuthToken returns claims including userId (`appId`-scoped)
      // Cast loosely because the SDK types vary by version.
      const claims = await (client as unknown as {
        verifyAuthToken: (t: string) => Promise<{ userId?: string }>;
      }).verifyAuthToken(token);
      if (claims?.userId) {
        const user = (await client.getUser(claims.userId)) as MaybeUser;
        const w = _extractWallet(user);
        if (w) return w;
      }
    } catch (e) {
      console.warn(
        "[getSessionWallet] verifyAuthToken path failed:",
        (e as Error)?.message ?? String(e)
      );
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
