import "server-only";

import { db, schema } from "@/lib/db";
import { and, desc, eq, or, sql } from "drizzle-orm";

export interface ProjectListItem {
  id: string;
  onchainProjectId: string | null;
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  totalDistributed: string;
  cumulativePerToken: string;
  termMonths: number;
  onchainPda: string | null;
  tokenMint: string | null;
  usdcVault: string | null;
  activatedAt: string | null;
  createdAt: string;
  // --- Admin-editable content (NULLABLE) -------------------------------------
  description: string | null;
  aboutProject: string | null;
  highlights:
    | Array<{ title: string; detail: string; icon?: string }>
    | null;
  managementText: string | null;
  financialsText: string | null;
  documents: Array<{ name: string; url: string }> | null;
  trustScore: number | null;
  expectedApyBps: number | null;
}

export interface ProjectListFilter {
  status?: string;
  sector?: string;
  limit?: number;
}

function rowToProjectListItem(r: typeof schema.projects.$inferSelect): ProjectListItem {
  return {
    id: r.id,
    onchainProjectId: r.onchainProjectId !== null ? r.onchainProjectId.toString() : null,
    msmeName: r.msmeName,
    sector: r.sector,
    location: r.location,
    upgradeType: r.upgradeType,
    status: r.status,
    targetUsdc: r.targetUsdc,
    tokensSold: r.tokensSold,
    totalDistributed: r.totalDistributed,
    cumulativePerToken: r.cumulativePerToken,
    termMonths: r.termMonths,
    onchainPda: r.onchainPda,
    tokenMint: r.tokenMint,
    usdcVault: r.usdcVault,
    activatedAt: r.activatedAt ? r.activatedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    description: r.description ?? null,
    aboutProject: r.aboutProject ?? null,
    highlights: r.highlights ?? null,
    managementText: r.managementText ?? null,
    financialsText: r.financialsText ?? null,
    documents: r.documents ?? null,
    trustScore: r.trustScore ?? null,
    expectedApyBps: r.expectedApyBps ?? null,
  };
}

export async function listProjects(
  filter: ProjectListFilter = {}
): Promise<ProjectListItem[]> {
  const where = [] as ReturnType<typeof eq>[];
  if (filter.status && filter.status !== "all") {
    where.push(eq(schema.projects.status, filter.status as "funding"));
  }
  if (filter.sector && filter.sector !== "all") {
    where.push(eq(schema.projects.sector, filter.sector));
  }
  const q = db
    .select()
    .from(schema.projects)
    .orderBy(desc(schema.projects.createdAt))
    .limit(filter.limit ?? 200);
  const rows = where.length
    ? await q.where(and(...where))
    : await q;
  return rows.map(rowToProjectListItem);
}

/**
 * Fetch a project by its UUID or by its on-chain project id (u64 as string).
 * Accepts both URL shapes.
 */
export async function getProject(
  idOrOnchainId: string
): Promise<ProjectListItem | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOrOnchainId
  );
  let rows: (typeof schema.projects.$inferSelect)[] = [];
  if (isUuid) {
    rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, idOrOnchainId))
      .limit(1);
  } else if (/^\d+$/.test(idOrOnchainId)) {
    const onchainId = BigInt(idOrOnchainId);
    rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.onchainProjectId, onchainId))
      .limit(1);
  } else {
    // fall back: try either column; defensive
    rows = await db
      .select()
      .from(schema.projects)
      .where(
        or(
          eq(schema.projects.id, idOrOnchainId),
          eq(schema.projects.onchainPda, idOrOnchainId)
        )
      )
      .limit(1);
  }
  if (rows.length === 0) return null;
  return rowToProjectListItem(rows[0]);
}

export interface MrvProjectLite {
  id: string;
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
  status: string;
  baselineSubmitted: boolean;
  verificationCount: number;
}

export interface BaselineLite {
  id: string;
  auditorWallet: string;
  energyKwhPerYear: string;
  fuelType: string;
  reportHash: string | null;
  createdAt: string;
}

export interface VerificationLite {
  id: string;
  auditorWallet: string;
  periodStart: string;
  periodEnd: string;
  attested: boolean;
  reportHash: string | null;
  createdAt: string;
}

export interface ProjectTxLite {
  id: string;
  txSig: string;
  txType: string;
  walletPubkey: string;
  amountUsdc: string | null;
  tokenAmount: string | null;
  blockTime: string | null;
  createdAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  mrvProject: MrvProjectLite | null;
  baseline: BaselineLite | null;
  verifications: VerificationLite[];
  recentTransactions: ProjectTxLite[];
  investorCount: number;
}

export async function getProjectWithDetails(
  idOrOnchainId: string
): Promise<ProjectDetail | null> {
  const base = await getProject(idOrOnchainId);
  if (!base) return null;

  let mrvProject: MrvProjectLite | null = null;
  let baseline: BaselineLite | null = null;
  let verifications: VerificationLite[] = [];

  const [projectRow] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id, base.id))
    .limit(1);

  if (projectRow?.mrvProjectId) {
    const [m] = await db
      .select()
      .from(schema.mrvProjects)
      .where(eq(schema.mrvProjects.id, projectRow.mrvProjectId))
      .limit(1);
    if (m) {
      mrvProject = {
        id: m.id,
        msmeName: m.msmeName,
        sector: m.sector,
        location: m.location,
        upgradeType: m.upgradeType,
        status: m.status,
        baselineSubmitted: m.baselineSubmitted,
        verificationCount: m.verificationCount,
      };
      const [b] = await db
        .select()
        .from(schema.mrvBaselines)
        .where(eq(schema.mrvBaselines.mrvProjectId, m.id))
        .orderBy(desc(schema.mrvBaselines.createdAt))
        .limit(1);
      if (b) {
        baseline = {
          id: b.id,
          auditorWallet: b.auditorWallet,
          energyKwhPerYear: b.energyKwhPerYear.toString(),
          fuelType: b.fuelType,
          reportHash: b.reportHash,
          createdAt: b.createdAt.toISOString(),
        };
      }
      const verRows = await db
        .select()
        .from(schema.mrvVerifications)
        .where(eq(schema.mrvVerifications.mrvProjectId, m.id))
        .orderBy(desc(schema.mrvVerifications.createdAt));
      verifications = verRows.map((v) => ({
        id: v.id,
        auditorWallet: v.auditorWallet,
        periodStart: v.periodStart.toISOString(),
        periodEnd: v.periodEnd.toISOString(),
        attested: v.attested,
        reportHash: v.reportHash,
        createdAt: v.createdAt.toISOString(),
      }));
    }
  }

  const txRows = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.projectId, base.id))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(10);

  const recentTransactions: ProjectTxLite[] = txRows.map((t) => ({
    id: t.id,
    txSig: t.txSig,
    txType: t.txType,
    walletPubkey: t.walletPubkey,
    amountUsdc: t.amountUsdc,
    tokenAmount: t.tokenAmount,
    blockTime: t.blockTime ? t.blockTime.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  const [countRow] = await db
    .select({
      n: sql<number>`count(*)::int`,
    })
    .from(schema.investorPositions)
    .where(eq(schema.investorPositions.projectId, base.id));

  return {
    ...base,
    mrvProject,
    baseline,
    verifications,
    recentTransactions,
    investorCount: countRow?.n ?? 0,
  };
}
