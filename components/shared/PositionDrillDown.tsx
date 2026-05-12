"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import {
  computeConcentration,
  type DemoVault,
  type UnderlyingLoan,
} from "@/lib/demo/lp-positions";
import {
  CARBON_PRICE_USD_PER_TCO2,
  INDIA_GRID_TCO2_PER_MWH,
} from "@/lib/demo/carbon";
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
  const limit = rows[0]?.limitPct;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-fg-muted">
        <span>{limitLabel}</span>
        {limit != null ? (
          <span className="text-fg-faint">§5.5 limit {limit}%</span>
        ) : null}
      </div>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-12 items-center gap-2 text-xs">
            <div className="col-span-4 truncate text-fg sm:col-span-3" title={r.name}>
              {r.name}
            </div>
            <div className="col-span-6 relative h-2 bg-bg-2 ring-1 ring-inset ring-line/60 sm:col-span-7">
              <div
                className={cn(
                  "absolute inset-y-0 left-0",
                  r.breached ? "bg-signal-down/70" : "bg-accent/70"
                )}
                style={{ width: `${Math.min(100, r.pct)}%` }}
              />
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

  const carbonLoans = vault.loans.filter((l) => l.carbonEligible);
  const carbonCount = carbonLoans.length;
  // Demo aggregate: assume ~12% of outstanding INR proxies annual saved kWh × 8.5 INR.
  // Translate that back to MWh, then to tCO2 and USD.
  const proxyAnnualKwh = carbonLoans.reduce(
    (a, l) => a + (l.outstandingInr * 0.12) / 8.5,
    0
  );
  const aggregateTco2 = (proxyAnnualKwh / 1000) * INDIA_GRID_TCO2_PER_MWH;
  const aggregateUsd = aggregateTco2 * CARBON_PRICE_USD_PER_TCO2;
  const lpShareUsd = aggregateUsd * 0.9; // 10% platform fee per §11

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

      {/* Carbon credit aggregate per §11 */}
      <div className="border border-accent/30 bg-accent-soft/40 p-3">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-accent-deep">
          <span>Carbon credit accrual · §11</span>
          <Link
            href="/docs/underwriting-policy#section-11"
            className="text-fg-faint hover:text-accent"
          >
            policy ↗
          </Link>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
          <div>
            <div className="text-fg-muted">Eligible loans</div>
            <div className="mt-0.5 font-medium tabular-nums text-fg">
              {carbonCount} / {vault.loans.length}
            </div>
          </div>
          <div>
            <div className="text-fg-muted">tCO₂ avoided / yr</div>
            <div className="mt-0.5 font-medium tabular-nums text-fg">
              {aggregateTco2.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-fg-muted">Gross / yr</div>
            <div className="mt-0.5 font-medium tabular-nums text-fg">
              ${Math.round(aggregateUsd).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-fg-muted">LP share / yr</div>
            <div className="mt-0.5 font-medium tabular-nums text-accent-deep">
              ${Math.round(lpShareUsd).toLocaleString()}
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-fg-faint">
          Net of 10% platform fee. India grid factor 0.71 tCO₂/MWh @ $
          {CARBON_PRICE_USD_PER_TCO2}/tCO₂. Demo estimate from outstanding
          principal proxy; replace with realized M&V data once issuance
          pipeline is live.
        </p>
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
