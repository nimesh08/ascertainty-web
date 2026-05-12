import "server-only";

import { db, schema } from "@/lib/db";
import { and, desc, eq, or, sql } from "drizzle-orm";

export interface PoolListItem {
  id: string;
  onchainPoolId: string | null;
  name: string;
  description: string | null;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  totalDistributed: string;
  cumulativePerToken: string;
  onchainPda: string | null;
  poolTokenMint: string | null;
  usdcVault: string | null;
  projectCount: number;
  createdAt: string;
  // Admin-editable
  aboutPool: string | null;
  highlights: Array<{ title: string; detail: string; icon?: string }> | null;
  managementText: string | null;
  financialsText: string | null;
  documents: Array<{ name: string; url: string }> | null;
  trustScore: number | null;
  expectedApyBps: number | null;
}

export interface PoolListFilter {
  status?: string;
  limit?: number;
}

export async function listPools(
  filter: PoolListFilter = {}
): Promise<PoolListItem[]> {
  const rows = await db
    .select({
      id: schema.pools.id,
      onchainPoolId: schema.pools.onchainPoolId,
      name: schema.pools.name,
      description: schema.pools.description,
      status: schema.pools.status,
      targetUsdc: schema.pools.targetUsdc,
      tokensSold: schema.pools.tokensSold,
      totalDistributed: schema.pools.totalDistributed,
      cumulativePerToken: schema.pools.cumulativePerToken,
      onchainPda: schema.pools.onchainPda,
      poolTokenMint: schema.pools.poolTokenMint,
      usdcVault: schema.pools.usdcVault,
      createdAt: schema.pools.createdAt,
      aboutPool: schema.pools.aboutPool,
      highlights: schema.pools.highlights,
      managementText: schema.pools.managementText,
      financialsText: schema.pools.financialsText,
      documents: schema.pools.documents,
      trustScore: schema.pools.trustScore,
      expectedApyBps: schema.pools.expectedApyBps,
      projectCount: sql<number>`(select count(*)::int from ${schema.poolProjects} where ${schema.poolProjects.poolId} = ${schema.pools.id})`,
    })
    .from(schema.pools)
    .where(
      filter.status && filter.status !== "all"
        ? eq(schema.pools.status, filter.status as "funding")
        : undefined
    )
    .orderBy(desc(schema.pools.createdAt))
    .limit(filter.limit ?? 200);

  return rows.map((r) => ({
    id: r.id,
    onchainPoolId: r.onchainPoolId !== null ? r.onchainPoolId.toString() : null,
    name: r.name,
    description: r.description,
    status: r.status,
    targetUsdc: r.targetUsdc,
    tokensSold: r.tokensSold,
    totalDistributed: r.totalDistributed,
    cumulativePerToken: r.cumulativePerToken,
    onchainPda: r.onchainPda,
    poolTokenMint: r.poolTokenMint,
    usdcVault: r.usdcVault,
    projectCount: r.projectCount ?? 0,
    createdAt: r.createdAt.toISOString(),
    aboutPool: r.aboutPool ?? null,
    highlights: r.highlights ?? null,
    managementText: r.managementText ?? null,
    financialsText: r.financialsText ?? null,
    documents: r.documents ?? null,
    trustScore: r.trustScore ?? null,
    expectedApyBps: r.expectedApyBps ?? null,
  }));
}

export interface PoolUnderlyingProject {
  projectId: string;
  msmeName: string;
  sector: string;
  location: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  addedAt: string;
}

export interface PoolTxLite {
  id: string;
  txSig: string;
  txType: string;
  walletPubkey: string;
  amountUsdc: string | null;
  createdAt: string;
}

export interface PoolDetail extends PoolListItem {
  underlying: PoolUnderlyingProject[];
  recentTransactions: PoolTxLite[];
}

export async function getPool(idOrOnchainId: string): Promise<PoolDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOrOnchainId
  );

  let poolRow: typeof schema.pools.$inferSelect | undefined;
  if (isUuid) {
    [poolRow] = await db
      .select()
      .from(schema.pools)
      .where(eq(schema.pools.id, idOrOnchainId))
      .limit(1);
  } else if (/^\d+$/.test(idOrOnchainId)) {
    [poolRow] = await db
      .select()
      .from(schema.pools)
      .where(eq(schema.pools.onchainPoolId, BigInt(idOrOnchainId)))
      .limit(1);
  } else {
    [poolRow] = await db
      .select()
      .from(schema.pools)
      .where(
        or(
          eq(schema.pools.id, idOrOnchainId),
          eq(schema.pools.onchainPda, idOrOnchainId)
        )
      )
      .limit(1);
  }

  if (!poolRow) return null;

  const links = await db
    .select({
      link: schema.poolProjects,
      project: schema.projects,
    })
    .from(schema.poolProjects)
    .innerJoin(schema.projects, eq(schema.poolProjects.projectId, schema.projects.id))
    .where(eq(schema.poolProjects.poolId, poolRow.id));

  const underlying: PoolUnderlyingProject[] = links.map((l) => ({
    projectId: l.project.id,
    msmeName: l.project.msmeName,
    sector: l.project.sector,
    location: l.project.location,
    status: l.project.status,
    targetUsdc: l.project.targetUsdc,
    tokensSold: l.project.tokensSold,
    addedAt: l.link.addedAt.toISOString(),
  }));

  const txs = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.poolId, poolRow.id))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(10);

  const recentTransactions: PoolTxLite[] = txs.map((t) => ({
    id: t.id,
    txSig: t.txSig,
    txType: t.txType,
    walletPubkey: t.walletPubkey,
    amountUsdc: t.amountUsdc,
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    id: poolRow.id,
    onchainPoolId: poolRow.onchainPoolId !== null ? poolRow.onchainPoolId.toString() : null,
    name: poolRow.name,
    description: poolRow.description,
    status: poolRow.status,
    targetUsdc: poolRow.targetUsdc,
    tokensSold: poolRow.tokensSold,
    totalDistributed: poolRow.totalDistributed,
    cumulativePerToken: poolRow.cumulativePerToken,
    onchainPda: poolRow.onchainPda,
    poolTokenMint: poolRow.poolTokenMint,
    usdcVault: poolRow.usdcVault,
    projectCount: underlying.length,
    createdAt: poolRow.createdAt.toISOString(),
    aboutPool: poolRow.aboutPool ?? null,
    highlights: poolRow.highlights ?? null,
    managementText: poolRow.managementText ?? null,
    financialsText: poolRow.financialsText ?? null,
    documents: poolRow.documents ?? null,
    trustScore: poolRow.trustScore ?? null,
    expectedApyBps: poolRow.expectedApyBps ?? null,
    underlying,
    recentTransactions,
  };
}

// Keep `and` export available for future callers.
void and;
