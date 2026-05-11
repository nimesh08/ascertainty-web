import "server-only";

import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

export interface InvestorPositionRow {
  id: string;
  kind: "project" | "pool";
  targetId: string;
  targetName: string;
  targetStatus: string;
  onchainPda: string | null;
  usdcVault: string | null;
  tokenMint: string | null;
  tokenAmount: string;
  lastCumulativePerToken: string;
  claimedTotal: string;
  cumulativePerToken: string;
  createdAt: string;
}

export interface InvestorTxRow {
  id: string;
  txSig: string;
  txType: string;
  amountUsdc: string | null;
  tokenAmount: string | null;
  projectId: string | null;
  poolId: string | null;
  blockTime: string | null;
  createdAt: string;
}

/**
 * Return all non-zero positions for a wallet, across projects AND pools,
 * including the parent target's cumulative_per_token so the UI can compute
 * claimable off-chain.
 */
export async function getPositionsForWallet(
  walletPubkey: string
): Promise<InvestorPositionRow[]> {
  const projRows = await db
    .select({
      pos: schema.investorPositions,
      project: schema.projects,
    })
    .from(schema.investorPositions)
    .innerJoin(schema.projects, eq(schema.investorPositions.projectId, schema.projects.id))
    .where(eq(schema.investorPositions.walletPubkey, walletPubkey));

  const poolRows = await db
    .select({
      pos: schema.investorPositions,
      pool: schema.pools,
    })
    .from(schema.investorPositions)
    .innerJoin(schema.pools, eq(schema.investorPositions.poolId, schema.pools.id))
    .where(eq(schema.investorPositions.walletPubkey, walletPubkey));

  const out: InvestorPositionRow[] = [];

  for (const { pos, project } of projRows) {
    out.push({
      id: pos.id,
      kind: "project",
      targetId: project.id,
      targetName: project.msmeName,
      targetStatus: project.status,
      onchainPda: project.onchainPda,
      usdcVault: project.usdcVault,
      tokenMint: project.tokenMint,
      tokenAmount: pos.tokenAmount,
      lastCumulativePerToken: pos.lastCumulativePerToken,
      claimedTotal: pos.claimedTotal,
      cumulativePerToken: project.cumulativePerToken,
      createdAt: pos.createdAt.toISOString(),
    });
  }

  for (const { pos, pool } of poolRows) {
    out.push({
      id: pos.id,
      kind: "pool",
      targetId: pool.id,
      targetName: pool.name,
      targetStatus: pool.status,
      onchainPda: pool.onchainPda,
      usdcVault: pool.usdcVault,
      tokenMint: pool.poolTokenMint,
      tokenAmount: pos.tokenAmount,
      lastCumulativePerToken: pos.lastCumulativePerToken,
      claimedTotal: pos.claimedTotal,
      cumulativePerToken: pool.cumulativePerToken,
      createdAt: pos.createdAt.toISOString(),
    });
  }

  out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}

export async function getTransactionsForWallet(
  walletPubkey: string,
  limit = 20
): Promise<InvestorTxRow[]> {
  const rows = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.walletPubkey, walletPubkey))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(limit);

  return rows.map((t) => ({
    id: t.id,
    txSig: t.txSig,
    txType: t.txType,
    amountUsdc: t.amountUsdc,
    tokenAmount: t.tokenAmount,
    projectId: t.projectId,
    poolId: t.poolId,
    blockTime: t.blockTime ? t.blockTime.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));
}
