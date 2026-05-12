/**
 * Mock LP holdings for portfolio drill-down. Until real Solana-backed positions
 * have policy fields, the LP dashboard renders these fixtures with a clear
 * `Demo data · vault not yet originated` chip.
 *
 * Phase 2 (per implementation plan) — wired into /portfolio drill-down.
 */

export interface UnderlyingLoan {
  loanId: string;
  borrowerAnonId: string;
  sector: string;
  state: string;
  equipmentCategory: string;
  outstandingInr: number;
  daysPastDue: number;
  dscrAtP5: number;
  ebitdaCoverage: number;
  carbonEligible: boolean;
}

export interface DemoVault {
  vaultId: string;
  name: string;
  totalNavInr: number;
  blendedYieldPct: number;
  loans: UnderlyingLoan[];
  concentrationLimits: {
    maxSingleBorrowerPct: number; // §5.5
    maxSectorPct: number;
    maxStatePct: number;
  };
}

export const DEMO_VAULTS: DemoVault[] = [
  {
    vaultId: "demo-vault-tn-textile-01",
    name: "Tamil Nadu Textile MSME Vault",
    totalNavInr: 9_50_00_000,
    blendedYieldPct: 12.4,
    concentrationLimits: { maxSingleBorrowerPct: 15, maxSectorPct: 40, maxStatePct: 60 },
    loans: [
      {
        loanId: "L-001",
        borrowerAnonId: "TN-TEX-001",
        sector: "Textile",
        state: "Tamil Nadu",
        equipmentCategory: "Compressed Air",
        outstandingInr: 1_30_00_000,
        daysPastDue: 0,
        dscrAtP5: 1.42,
        ebitdaCoverage: 2.3,
        carbonEligible: true,
      },
      {
        loanId: "L-002",
        borrowerAnonId: "TN-TEX-002",
        sector: "Textile",
        state: "Tamil Nadu",
        equipmentCategory: "Motors",
        outstandingInr: 1_15_00_000,
        daysPastDue: 0,
        dscrAtP5: 1.55,
        ebitdaCoverage: 2.1,
        carbonEligible: true,
      },
      {
        loanId: "L-003",
        borrowerAnonId: "TN-FOU-001",
        sector: "Foundry",
        state: "Tamil Nadu",
        equipmentCategory: "VFD",
        outstandingInr: 95_00_000,
        daysPastDue: 0,
        dscrAtP5: 1.38,
        ebitdaCoverage: 1.95,
        carbonEligible: true,
      },
      {
        loanId: "L-004",
        borrowerAnonId: "TN-COL-001",
        sector: "Cold Chain",
        state: "Tamil Nadu",
        equipmentCategory: "Refrigeration",
        outstandingInr: 2_10_00_000,
        daysPastDue: 0,
        dscrAtP5: 1.62,
        ebitdaCoverage: 2.8,
        carbonEligible: true,
      },
      {
        loanId: "L-005",
        borrowerAnonId: "KA-TEX-001",
        sector: "Textile",
        state: "Karnataka",
        equipmentCategory: "Lighting",
        outstandingInr: 50_00_000,
        daysPastDue: 12,
        dscrAtP5: 1.31,
        ebitdaCoverage: 1.9,
        carbonEligible: true,
      },
      {
        loanId: "L-006",
        borrowerAnonId: "TN-FOO-001",
        sector: "Food Processing",
        state: "Tamil Nadu",
        equipmentCategory: "Compressed Air",
        outstandingInr: 1_75_00_000,
        daysPastDue: 0,
        dscrAtP5: 1.48,
        ebitdaCoverage: 2.4,
        carbonEligible: true,
      },
      {
        loanId: "L-007",
        borrowerAnonId: "TN-PUM-001",
        sector: "Pumps Mfg",
        state: "Tamil Nadu",
        equipmentCategory: "Motors",
        outstandingInr: 75_00_000,
        daysPastDue: 0,
        dscrAtP5: 1.71,
        ebitdaCoverage: 3.2,
        carbonEligible: true,
      },
    ],
  },
];

/**
 * Compute concentration % per dimension and flag breach against §5.5.
 */
export function computeConcentration(vault: DemoVault) {
  const sectorTotals = new Map<string, number>();
  const stateTotals = new Map<string, number>();
  const borrowerTotals = new Map<string, number>();
  for (const l of vault.loans) {
    sectorTotals.set(l.sector, (sectorTotals.get(l.sector) ?? 0) + l.outstandingInr);
    stateTotals.set(l.state, (stateTotals.get(l.state) ?? 0) + l.outstandingInr);
    borrowerTotals.set(
      l.borrowerAnonId,
      (borrowerTotals.get(l.borrowerAnonId) ?? 0) + l.outstandingInr
    );
  }
  const total = vault.loans.reduce((a, l) => a + l.outstandingInr, 0);
  const toRows = (m: Map<string, number>, limitPct: number) =>
    Array.from(m.entries())
      .map(([name, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        return { name, amount, pct, limitPct, breached: pct > limitPct };
      })
      .sort((a, b) => b.pct - a.pct);
  return {
    bySector: toRows(sectorTotals, vault.concentrationLimits.maxSectorPct),
    byState: toRows(stateTotals, vault.concentrationLimits.maxStatePct),
    byBorrower: toRows(borrowerTotals, vault.concentrationLimits.maxSingleBorrowerPct),
    total,
  };
}
