"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  computeConcentration,
  type DemoVault,
  type UnderlyingLoan,
} from "@/lib/demo/lp-positions";
import { DistributionChart } from "./DistributionChart";

interface PositionDrillDownProps {
  vault: DemoVault;
  className?: string;
}

const fmtInr = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function ConcentrationBar({
  rows,
  limitLabel,
}: {
  rows: Array<{ name: string; pct: number; limitPct: number; breached: boolean }>;
  limitLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-fg-muted">
        <span>{limitLabel}</span>
        <span>limit shown</span>
      </div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-12 items-center gap-2 text-xs">
            <div className="col-span-3 truncate text-fg">{r.name}</div>
            <div className="col-span-7 relative h-2 rounded-sm bg-bg-2 ring-1 ring-inset ring-line/60">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-sm",
                  r.breached ? "bg-signal-down/70" : "bg-accent/70"
                )}
                style={{ width: `${Math.min(100, r.pct)}%` }}
              />
              {/* limit marker */}
              <div
                className="absolute inset-y-0 w-px bg-fg-faint"
                style={{ left: `${Math.min(100, r.limitPct)}%` }}
                aria-label={`Limit ${r.limitPct}%`}
                title={`§5.5 limit ${r.limitPct}%`}
              />
            </div>
            <div
              className={cn(
                "col-span-2 text-right tabular-nums",
                r.breached ? "text-signal-down font-medium" : "text-fg"
              )}
            >
              {fmtPct(r.pct)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PositionDrillDown — expanded LP position view. Shows underlying loans
 * matching UNDERWRITING_POLICY.md §12 disclosure schedule, concentration
 * bars vs §5.5 limits, and a representative DistributionChart.
 *
 * Currently mocked from lib/demo/lp-positions.ts — clearly chip-marked.
 */
export function PositionDrillDown({ vault, className }: PositionDrillDownProps) {
  const conc = React.useMemo(() => computeConcentration(vault), [vault]);
  // Pick the largest loan as the chart focus
  const focus: UnderlyingLoan | undefined = React.useMemo(
    () => [...vault.loans].sort((a, b) => b.outstandingInr - a.outstandingInr)[0],
    [vault.loans]
  );
  // Synthesize a μ/σ for the focus loan from its outstanding (toy demo only)
  const focusPredictedKwh = focus ? focus.outstandingInr / 8.5 / 0.4 : 0;
  const focusSigmaKwh = focusPredictedKwh * 0.18;
  const focusP5 = focusPredictedKwh - 1.645 * focusSigmaKwh;
  const focusP95 = focusPredictedKwh + 1.645 * focusSigmaKwh;

  const carbonCount = vault.loans.filter((l) => l.carbonEligible).length;

  return (
    <div className={cn("space-y-5 border-t border-line/60 bg-bg-1 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-fg-muted">
          Underlying loans · §12 disclosure schedule
        </div>
        <Badge
          variant="outline"
          className="border-amber/40 bg-amber/10 text-[10px] text-amber"
        >
          Demo data · vault not yet originated
        </Badge>
      </div>

      {/* Underlying loans table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-fg-muted">
            <tr className="border-b border-line/60">
              <th className="px-2 py-1 text-left">Borrower</th>
              <th className="px-2 py-1 text-left">Sector</th>
              <th className="px-2 py-1 text-left">State</th>
              <th className="px-2 py-1 text-left">Equipment</th>
              <th className="px-2 py-1 text-right">Outstanding</th>
              <th className="px-2 py-1 text-right">DSCR P5</th>
              <th className="px-2 py-1 text-right">EBITDA Cov</th>
              <th className="px-2 py-1 text-right">DPD</th>
              <th className="px-2 py-1 text-center">Carbon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {vault.loans.map((l) => (
              <tr key={l.loanId}>
                <td className="px-2 py-1 font-mono text-fg">{l.borrowerAnonId}</td>
                <td className="px-2 py-1 text-fg-muted">{l.sector}</td>
                <td className="px-2 py-1 text-fg-muted">{l.state}</td>
                <td className="px-2 py-1 text-fg-muted">{l.equipmentCategory}</td>
                <td className="px-2 py-1 text-right tabular-nums text-fg">
                  {fmtInr(l.outstandingInr)}
                </td>
                <td
                  className={cn(
                    "px-2 py-1 text-right tabular-nums",
                    l.dscrAtP5 >= 1.3 ? "text-fg" : "text-signal-down"
                  )}
                >
                  {l.dscrAtP5.toFixed(2)}×
                </td>
                <td
                  className={cn(
                    "px-2 py-1 text-right tabular-nums",
                    l.ebitdaCoverage >= 1.8 ? "text-fg" : "text-signal-down"
                  )}
                >
                  {l.ebitdaCoverage.toFixed(2)}×
                </td>
                <td
                  className={cn(
                    "px-2 py-1 text-right tabular-nums",
                    l.daysPastDue > 0 ? "text-amber" : "text-fg-muted"
                  )}
                >
                  {l.daysPastDue}
                </td>
                <td className="px-2 py-1 text-center">
                  {l.carbonEligible ? (
                    <span className="text-accent">●</span>
                  ) : (
                    <span className="text-fg-faint">○</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Concentration vs §5.5 limits */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ConcentrationBar rows={conc.bySector} limitLabel="Sector concentration" />
        <ConcentrationBar rows={conc.byBorrower} limitLabel="Single borrower" />
        <ConcentrationBar rows={conc.byState} limitLabel="State concentration" />
      </div>

      {/* Carbon credit summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-bg-0 px-3 py-2 text-xs">
        <span className="text-fg-muted">
          Carbon credits accruing on{" "}
          <span className="text-fg font-medium">{carbonCount}</span> of{" "}
          <span className="text-fg font-medium">{vault.loans.length}</span>{" "}
          underlying loans (§11)
        </span>
        <span className="text-fg-faint">
          Distributed to LPs net of 10% platform fee
        </span>
      </div>

      {/* Distribution chart for the dominant underlying */}
      {focus ? (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-fg-muted">
            Dominant underlying · {focus.borrowerAnonId} ·{" "}
            {focus.equipmentCategory}
          </div>
          <DistributionChart
            predictedKwh={focusPredictedKwh}
            sigmaKwh={focusSigmaKwh}
            p5Kwh={focusP5}
            p95Kwh={focusP95}
            height={180}
          />
        </div>
      ) : null}
    </div>
  );
}
