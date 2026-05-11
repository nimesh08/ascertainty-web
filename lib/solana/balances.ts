import type { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { and, isNotNull } from "drizzle-orm";

import { db as defaultDb, schema } from "@/lib/db";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";

export type TokenKind = "usdc" | "project" | "pool" | "other";

export type TokenBalance = {
  mint: string;
  symbol: string;
  label: string;
  kind: TokenKind;
  amount: string; // raw base units
  uiAmount: number;
  decimals: number;
  projectId?: string;
  poolId?: string;
};

export type WalletBalances = {
  sol: { lamports: string; ui: number };
  usdc: TokenBalance | null;
  projectTokens: TokenBalance[];
  poolTokens: TokenBalance[];
  otherTokens: TokenBalance[];
};

type DbLike = typeof defaultDb;

interface ParsedTokenAccountInfo {
  mint: string;
  owner: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
    uiAmountString: string;
  };
}

interface ParsedAccount {
  parsed?: { info?: ParsedTokenAccountInfo };
}

function projectSymbol(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 5)
    .toUpperCase();
  return slug || "PRJ";
}

function poolSymbol(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 5)
    .toUpperCase();
  return slug || "POOL";
}

/**
 * Reads wallet balances (SOL + SPL tokens) and annotates SPL tokens with
 * Exira-specific metadata by cross-referencing the DB. Safe to call either
 * server-side or client-side (with a browser-reachable Connection).
 *
 * @param connection - Solana `Connection` (Helius URL on devnet).
 * @param owner - Wallet public key.
 * @param db - Optional Drizzle client. When omitted, the shared pool is used;
 *             callers running on the client MUST provide a no-op fetch layer
 *             or leave this undefined — DB queries are only attempted when a
 *             working client is available.
 */
export async function getWalletBalances(
  connection: Connection,
  owner: PublicKey,
  db?: DbLike
): Promise<WalletBalances> {
  const client = db ?? defaultDb;

  const [lamports, splRes, projectRows, poolRows] = await Promise.all([
    connection.getBalance(owner, "confirmed"),
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    }),
    client
      .select({
        id: schema.projects.id,
        msmeName: schema.projects.msmeName,
        tokenMint: schema.projects.tokenMint,
        onchainProjectId: schema.projects.onchainProjectId,
      })
      .from(schema.projects)
      .where(and(isNotNull(schema.projects.tokenMint))),
    client
      .select({
        id: schema.pools.id,
        name: schema.pools.name,
        poolTokenMint: schema.pools.poolTokenMint,
      })
      .from(schema.pools)
      .where(and(isNotNull(schema.pools.poolTokenMint))),
  ]);

  const projectByMint = new Map<
    string,
    { id: string; msmeName: string }
  >();
  for (const r of projectRows) {
    if (r.tokenMint) projectByMint.set(r.tokenMint, { id: r.id, msmeName: r.msmeName });
  }
  const poolByMint = new Map<string, { id: string; name: string }>();
  for (const r of poolRows) {
    if (r.poolTokenMint) poolByMint.set(r.poolTokenMint, { id: r.id, name: r.name });
  }

  const USDC_MINT = DEVNET_USDC_MINT.toBase58();

  let usdc: TokenBalance | null = null;
  const projectTokens: TokenBalance[] = [];
  const poolTokens: TokenBalance[] = [];
  const otherTokens: TokenBalance[] = [];

  for (const { account } of splRes.value) {
    const data = account.data as ParsedAccount;
    const info = data.parsed?.info;
    if (!info) continue;
    const { mint, tokenAmount } = info;
    const ui = tokenAmount.uiAmount ?? 0;
    if (ui === 0) {
      // Skip empty accounts entirely — they clutter the list and can't hold
      // meaningful value without a subsequent mint-to.
      continue;
    }
    const base: Omit<TokenBalance, "kind" | "label" | "symbol"> = {
      mint,
      amount: tokenAmount.amount,
      uiAmount: ui,
      decimals: tokenAmount.decimals,
    };
    if (mint === USDC_MINT) {
      usdc = { ...base, kind: "usdc", symbol: "USDC", label: "USDC (devnet)" };
      continue;
    }
    const project = projectByMint.get(mint);
    if (project) {
      projectTokens.push({
        ...base,
        kind: "project",
        symbol: projectSymbol(project.msmeName),
        label: `${project.msmeName} (project)`,
        projectId: project.id,
      });
      continue;
    }
    const pool = poolByMint.get(mint);
    if (pool) {
      poolTokens.push({
        ...base,
        kind: "pool",
        symbol: poolSymbol(pool.name),
        label: `${pool.name} (pool)`,
        poolId: pool.id,
      });
      continue;
    }
    otherTokens.push({
      ...base,
      kind: "other",
      symbol: mint.slice(0, 4).toUpperCase(),
      label: `${mint.slice(0, 4)}…${mint.slice(-4)}`,
    });
  }

  projectTokens.sort((a, b) => b.uiAmount - a.uiAmount);
  poolTokens.sort((a, b) => b.uiAmount - a.uiAmount);

  return {
    sol: { lamports: lamports.toString(), ui: lamports / 1e9 },
    usdc,
    projectTokens,
    poolTokens,
    otherTokens,
  };
}
