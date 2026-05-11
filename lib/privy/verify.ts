import "server-only";

import { PrivyClient } from "@privy-io/server-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface VerifiedUser {
  userId: string;
  walletPubkey: string | null;
}

let _client: PrivyClient | null = null;
let _warnedMissingConfig = false;

export function getPrivyServerClient(): PrivyClient | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) {
    if (!_warnedMissingConfig) {
      console.warn(
        "[privy] NEXT_PUBLIC_PRIVY_APP_ID or PRIVY_APP_SECRET not set — auth verification disabled (demo mode)."
      );
      _warnedMissingConfig = true;
    }
    return null;
  }
  if (!_client) _client = new PrivyClient(appId, secret);
  return _client;
}

/**
 * Verify a Privy auth / id token. Returns the Privy user id and the first
 * linked Solana wallet pubkey (if any).
 *
 * The token may be either an access JWT (Authorization: Bearer ...) or an
 * id-token cookie. Privy's `verifyAuthToken` handles access tokens; for id
 * tokens we fall back to `getUser({ idToken })`.
 */
export async function verifyPrivyToken(token: string): Promise<VerifiedUser | null> {
  const client = getPrivyServerClient();
  if (!client) return null;
  let userId: string | null = null;
  try {
    const claims = await client.verifyAuthToken(token);
    userId = claims.userId ?? null;
  } catch {
    try {
      const user = await client.getUser({ idToken: token });
      userId = user.id;
    } catch {
      return null;
    }
  }
  if (!userId) return null;

  let walletPubkey: string | null = null;
  try {
    const user = await client.getUser(userId);
    const walletAccount = user.linkedAccounts.find(
      (a) => a.type === "wallet" && (a as { chainType?: string }).chainType === "solana"
    ) as { address?: string } | undefined;
    const fallback = user.wallet?.address;
    walletPubkey = walletAccount?.address ?? fallback ?? null;
  } catch {
    // ignore — userId alone is enough to return
  }

  return { userId, walletPubkey };
}

function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

/**
 * Extract and verify the Privy token from a Request's headers.
 *
 * Accepts (in priority order):
 *   1. `Authorization: Bearer <accessToken>`
 *   2. `Cookie: privy-token=<accessToken>`
 *   3. `Cookie: privy-id-token=<idToken>`
 */
export async function getAuthedUser(req: Request): Promise<VerifiedUser | null> {
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) {
      const v = await verifyPrivyToken(m[1]);
      if (v) return v;
    }
  }

  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const accessTok = cookies["privy-token"] ?? cookies["privy-access-token"];
  if (accessTok) {
    const v = await verifyPrivyToken(accessTok);
    if (v) return v;
  }
  const idTok = cookies["privy-id-token"];
  if (idTok) {
    const v = await verifyPrivyToken(idTok);
    if (v) return v;
  }

  return null;
}

export class AdminAuthError extends Error {
  response: Response;
  constructor(message = "unauthorized", status = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.response = new Response(message, { status });
  }
}

/**
 * Require that the request is from a registered admin wallet.
 *
 * In production: verify Privy token → extract Solana pubkey → DB lookup
 * `admin_wallets`.
 *
 * In local dev where Privy isn't configured, a one-shot bypass is available
 * via `DEV_ADMIN_PUBKEY`. Set this env var to a pubkey that already exists
 * in `admin_wallets` to unblock local admin workflows. Never set in prod.
 */
export async function requireAdmin(req: Request): Promise<{ walletPubkey: string }> {
  const devAdmin = process.env.DEV_ADMIN_PUBKEY;
  const privyConfigured = !!(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET
  );

  let walletPubkey: string | null = null;

  if (privyConfigured) {
    const user = await getAuthedUser(req);
    if (!user?.walletPubkey) {
      // Privy auth present but no wallet linked — or no token at all.
      if (devAdmin) {
        walletPubkey = devAdmin;
      } else {
        throw new AdminAuthError("unauthorized");
      }
    } else {
      walletPubkey = user.walletPubkey;
    }
  } else if (devAdmin) {
    console.warn("[requireAdmin] Privy not configured — falling back to DEV_ADMIN_PUBKEY");
    walletPubkey = devAdmin;
  } else {
    throw new AdminAuthError("unauthorized (Privy not configured and no DEV_ADMIN_PUBKEY)");
  }

  try {
    const rows = await db
      .select()
      .from(schema.adminWallets)
      .where(eq(schema.adminWallets.walletPubkey, walletPubkey))
      .limit(1);
    if (rows.length === 0) {
      throw new AdminAuthError("not an admin wallet", 403);
    }
  } catch (err) {
    if (err instanceof AdminAuthError) throw err;
    console.error("requireAdmin db lookup failed", err);
    throw new AdminAuthError("internal", 500);
  }

  return { walletPubkey };
}
