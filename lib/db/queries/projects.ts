import "server-only";

import { db, schema } from "@/lib/db";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";

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

export interface UnderwritingLite {
  id: string;
  dealId: string;
  ecmId: string;
  equipmentType: string;
  description: string | null;
  modelUsed: string | null;
  pinnSavingsKwh: string | null;
  pinnP5LowerKwh: string | null;
  pinnP95UpperKwh: string | null;
  pinnSigmaKwh: string | null;
  confidenceGrade: string | null;
  baselineKwhPerYear: string | null;
  investmentInr: string | null;
  electricityRateInrKwh: string | null;
  annualSavingsInr: string | null;
  recommendedLoanInr: string | null;
  paybackMonths: string | null;
  p5PaybackMonths: string | null;
  dscrAtP5: string | null;
  dscrAtP50: string | null;
  carbonEligible: boolean | null;
  carbonTco2PerYear: string | null;
  carbonMethodology: string | null;
  eligibilityStatus: string | null;
  status: string;
  createdAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  mrvProject: MrvProjectLite | null;
  baseline: BaselineLite | null;
  verifications: VerificationLite[];
  recentTransactions: ProjectTxLite[];
  investorCount: number;
  // All ECM rows for this project, ordered by ecmId. Single-ECM deals just
  // have one entry; multi-ECM bundles render an accordion (B1.5 pattern).
  ecms: UnderwritingLite[];
}

/**
 * Bundle-level aggregates across a project's ECMs. Independent sigmas combine
 * in quadrature (RSS). Overall grade is the worst grade across ECMs (A < B < C).
 */
export interface EcmBundleAggregate {
  ecmCount: number;
  totalPredictedKwh: number;
  totalP5Kwh: number;
  totalP95Kwh: number;
  totalSigmaKwh: number;
  totalInvestmentInr: number;
  totalCarbonTco2: number;
  electricityRateInrKwh: number;
  overallGrade: "A" | "B" | "C" | null;
  worstDscrAtP5: number | null;
  worstDscrAtP50: number | null;
  worstPaybackMonths: number | null;
  primaryDealId: string | null;
}

export function aggregateEcms(ecms: UnderwritingLite[]): EcmBundleAggregate {
  if (ecms.length === 0) {
    return {
      ecmCount: 0,
      totalPredictedKwh: 0,
      totalP5Kwh: 0,
      totalP95Kwh: 0,
      totalSigmaKwh: 0,
      totalInvestmentInr: 0,
      totalCarbonTco2: 0,
      electricityRateInrKwh: 8.0,
      overallGrade: null,
      worstDscrAtP5: null,
      worstDscrAtP50: null,
      worstPaybackMonths: null,
      primaryDealId: null,
    };
  }
  const sumPredicted = ecms.reduce((a, e) => a + Number(e.pinnSavingsKwh ?? 0), 0);
  const sumP5 = ecms.reduce((a, e) => a + Number(e.pinnP5LowerKwh ?? 0), 0);
  const sumP95 = ecms.reduce((a, e) => a + Number(e.pinnP95UpperKwh ?? 0), 0);
  const sumSigma = Math.sqrt(
    ecms.reduce((a, e) => a + Math.pow(Number(e.pinnSigmaKwh ?? 0), 2), 0)
  );
  const sumInvest = ecms.reduce((a, e) => a + Number(e.investmentInr ?? 0), 0);
  const sumCarbon = ecms.reduce(
    (a, e) => a + (e.carbonEligible ? Number(e.carbonTco2PerYear ?? 0) : 0),
    0
  );
  const grades = ecms
    .map((e) => e.confidenceGrade)
    .filter((g): g is "A" | "B" | "C" => g === "A" || g === "B" || g === "C");
  const overallGrade: "A" | "B" | "C" | null = grades.includes("C")
    ? "C"
    : grades.includes("B")
      ? "B"
      : grades.length > 0
        ? "A"
        : null;
  const worstOf = (vals: Array<number | null>, cmp: "min" | "max") => {
    const ok = vals.filter((v): v is number => v != null);
    if (ok.length === 0) return null;
    return cmp === "min" ? Math.min(...ok) : Math.max(...ok);
  };
  return {
    ecmCount: ecms.length,
    totalPredictedKwh: sumPredicted,
    totalP5Kwh: sumP5,
    totalP95Kwh: sumP95,
    totalSigmaKwh: sumSigma,
    totalInvestmentInr: sumInvest,
    totalCarbonTco2: sumCarbon,
    electricityRateInrKwh: Number(ecms[0]?.electricityRateInrKwh ?? 8.0),
    overallGrade,
    worstDscrAtP5: worstOf(
      ecms.map((e) => (e.dscrAtP5 != null ? Number(e.dscrAtP5) : null)),
      "min"
    ),
    worstDscrAtP50: worstOf(
      ecms.map((e) => (e.dscrAtP50 != null ? Number(e.dscrAtP50) : null)),
      "min"
    ),
    worstPaybackMonths: worstOf(
      ecms.map((e) => (e.paybackMonths != null ? Number(e.paybackMonths) : null)),
      "max"
    ),
    primaryDealId: ecms[0]?.dealId ?? null,
  };
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

  const uwRows = await db
    .select()
    .from(schema.underwritingResults)
    .where(eq(schema.underwritingResults.projectId, base.id))
    .orderBy(asc(schema.underwritingResults.ecmId));

  const ecms: UnderwritingLite[] = uwRows.map((r) => ({
    id: r.id,
    dealId: r.dealId,
    ecmId: r.ecmId,
    equipmentType: r.equipmentType,
    description: r.description,
    modelUsed: r.modelUsed,
    pinnSavingsKwh: r.pinnSavingsKwh,
    pinnP5LowerKwh: r.pinnP5LowerKwh,
    pinnP95UpperKwh: r.pinnP95UpperKwh,
    pinnSigmaKwh: r.pinnSigmaKwh,
    confidenceGrade: r.confidenceGrade,
    baselineKwhPerYear: r.baselineKwhPerYear,
    investmentInr: r.investmentInr,
    electricityRateInrKwh: r.electricityRateInrKwh,
    annualSavingsInr: r.annualSavingsInr,
    recommendedLoanInr: r.recommendedLoanInr,
    paybackMonths: r.paybackMonths,
    p5PaybackMonths: r.p5PaybackMonths,
    dscrAtP5: r.dscrAtP5,
    dscrAtP50: r.dscrAtP50,
    carbonEligible: r.carbonEligible,
    carbonTco2PerYear: r.carbonTco2PerYear,
    carbonMethodology: r.carbonMethodology,
    eligibilityStatus: r.eligibilityStatus,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    ...base,
    mrvProject,
    baseline,
    verifications,
    recentTransactions,
    investorCount: countRow?.n ?? 0,
    ecms,
  };
}
