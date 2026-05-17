"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Lenders calculator — three interactive views in one tabbed
 * component so LPs can play with the math after reading the worked
 * example. All numbers are illustrative; production values would
 * pull from the live deal data.
 *
 *   Tab 1 — Yield: deposit + term → monthly USDC distribution
 *   Tab 2 — Tranche: Senior vs Junior — yield and risk trade
 *   Tab 3 — DSCR: drag realised-savings percentile, see DSCR vs covenant
 */

type Tab = "yield" | "tranche" | "dscr";

const TABS: { key: Tab; label: string }[] = [
  { key: "yield", label: "Yield" },
  { key: "tranche", label: "Tranche" },
  { key: "dscr", label: "DSCR scenario" },
];

// ─────────────────────────────────────────────────────────────────────
// Tab 1 — Yield calculator
// ─────────────────────────────────────────────────────────────────────
function YieldTab() {
  const [deposit, setDeposit] = useState(25000); // USDC
  const [years, setYears] = useState(3);

  // Senior tranche target yield (mid-point of 10-14% range)
  const apy = 0.12;
  const monthly = (deposit * apy) / 12;
  const totalReturn = deposit * apy * years;
  const totalReceived = deposit + totalReturn;

  return (
    <div className="calc-tab">
      <div className="calc-tab__controls">
        <label className="calc-tab__field">
          <span className="calc-tab__label">
            Deposit · <span className="calc-tab__hint">USDC</span>
          </span>
          <input
            type="range"
            min={25000}
            max={1000000}
            step={5000}
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="calc-tab__slider"
          />
          <div className="calc-tab__value">
            ${deposit.toLocaleString()}
          </div>
        </label>

        <label className="calc-tab__field">
          <span className="calc-tab__label">
            Term · <span className="calc-tab__hint">years</span>
          </span>
          <input
            type="range"
            min={1}
            max={7}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="calc-tab__slider"
          />
          <div className="calc-tab__value">
            {years} {years === 1 ? "year" : "years"}
          </div>
        </label>
      </div>

      <div className="calc-tab__outputs">
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Monthly distribution</span>
          <span className="calc-tab__output-value">
            ${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="calc-tab__output-sub">USDC, paid monthly</span>
        </div>
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Total return</span>
          <span className="calc-tab__output-value calc-tab__output-value--accent">
            +${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="calc-tab__output-sub">over {years} {years === 1 ? "year" : "years"} @ 12% APY</span>
        </div>
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Principal + return</span>
          <span className="calc-tab__output-value">
            ${totalReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="calc-tab__output-sub">end-of-term cumulative</span>
        </div>
      </div>

      <p className="calc-tab__footnote">
        Senior tranche · 12% APY illustrative midpoint of the 10–14%
        target band. Actual realised yield varies with portfolio
        performance; see <em>Risk framework</em> above for the layers.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tab 2 — Tranche selector
// ─────────────────────────────────────────────────────────────────────
function TrancheTab() {
  const [tranche, setTranche] = useState<"senior" | "junior">("senior");

  const senior = {
    apy: "10–14%",
    ltv: "60% of P5 floor",
    lossOrder: "Protected first",
    minTicket: "$25K",
    description:
      "Sized at 60% LTV against the calibrated P5 floor. Paid out before junior on every distribution; absorbs loss only after junior is fully depleted.",
  };
  const junior = {
    apy: "16–22%",
    ltv: "Residual 40%",
    lossOrder: "Absorbs first-loss",
    minTicket: "Varies by deal grade",
    description:
      "Junior tranche absorbs the first-loss layer in any default scenario. Higher yield compensates for the realized-vs-predicted residual risk. Sized to the difference between predicted P50 and P5.",
  };
  const t = tranche === "senior" ? senior : junior;

  return (
    <div className="calc-tab">
      <div className="calc-tab__tranche-toggle">
        <button
          type="button"
          className={cn(
            "calc-tab__tranche-btn",
            tranche === "senior" && "calc-tab__tranche-btn--active"
          )}
          onClick={() => setTranche("senior")}
        >
          Senior
        </button>
        <button
          type="button"
          className={cn(
            "calc-tab__tranche-btn",
            tranche === "junior" && "calc-tab__tranche-btn--active"
          )}
          onClick={() => setTranche("junior")}
        >
          Junior
        </button>
      </div>

      {/* Visual waterfall — two stacked rectangles showing both tranches,
          the active one is filled, the inactive one is outlined */}
      <div className="calc-tab__waterfall" aria-hidden>
        <div
          className={cn(
            "calc-tab__waterfall-block calc-tab__waterfall-block--junior",
            tranche === "junior" && "calc-tab__waterfall-block--active"
          )}
        >
          Junior · first-loss absorber
        </div>
        <div
          className={cn(
            "calc-tab__waterfall-block calc-tab__waterfall-block--senior",
            tranche === "senior" && "calc-tab__waterfall-block--active"
          )}
        >
          Senior · protected layer
        </div>
        <div className="calc-tab__waterfall-base">P5 floor of calibrated 90% PI</div>
      </div>

      <div className="calc-tab__outputs">
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Target APY</span>
          <span className="calc-tab__output-value calc-tab__output-value--accent">
            {t.apy}
          </span>
          <span className="calc-tab__output-sub">{t.minTicket} min ticket</span>
        </div>
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">LTV</span>
          <span className="calc-tab__output-value">{t.ltv}</span>
          <span className="calc-tab__output-sub">vs P5 floor</span>
        </div>
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Loss order</span>
          <span className="calc-tab__output-value">{t.lossOrder}</span>
          <span className="calc-tab__output-sub">
            {tranche === "senior" ? "after junior depleted" : "before senior touched"}
          </span>
        </div>
      </div>

      <p className="calc-tab__footnote">{t.description}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Tab 3 — DSCR scenario slider
// ─────────────────────────────────────────────────────────────────────
// Hotel-deal anchor points (matching the worked example):
//   P5  → 76,800 kWh/yr → DSCR 1.38×
//   P50 → 124,500 kWh/yr → DSCR 1.85×
//   P95 → 172,000 kWh/yr → DSCR ~2.55× (linear extrapolation)
function DscrTab() {
  const [percentile, setPercentile] = useState(50); // 0-100

  // Interpolate kWh and DSCR across the percentile range
  const interp = (p: number) => {
    if (p <= 5) {
      // Below P5: covenant breach territory — DSCR drops linearly to 1.0× at P0
      const t = p / 5;
      return { kwh: t * 76800, dscr: 1.0 + t * 0.38 };
    }
    if (p <= 50) {
      const t = (p - 5) / 45;
      return {
        kwh: 76800 + t * (124500 - 76800),
        dscr: 1.38 + t * (1.85 - 1.38),
      };
    }
    if (p <= 95) {
      const t = (p - 50) / 45;
      return {
        kwh: 124500 + t * (172000 - 124500),
        dscr: 1.85 + t * (2.55 - 1.85),
      };
    }
    const t = (p - 95) / 5;
    return {
      kwh: 172000 + t * 20000,
      dscr: 2.55 + t * 0.25,
    };
  };

  const { kwh, dscr } = interp(percentile);
  const revenue = kwh * 8.5; // ₹/kWh
  const aboveCovenant = dscr >= 1.3;

  return (
    <div className="calc-tab">
      <div className="calc-tab__controls">
        <label className="calc-tab__field">
          <span className="calc-tab__label">
            Realized savings percentile · <span className="calc-tab__hint">drag to explore</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={percentile}
            onChange={(e) => setPercentile(Number(e.target.value))}
            className="calc-tab__slider"
          />
          <div className="calc-tab__value">
            P{percentile}
          </div>
        </label>
      </div>

      <div className="calc-tab__outputs">
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Realised kWh / yr</span>
          <span className="calc-tab__output-value">
            {(kwh / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K
          </span>
          <span className="calc-tab__output-sub">at this percentile</span>
        </div>
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">Annual revenue</span>
          <span className="calc-tab__output-value">
            ₹{(revenue / 100000).toLocaleString(undefined, { maximumFractionDigits: 1 })}L
          </span>
          <span className="calc-tab__output-sub">@ ₹8.5/kWh</span>
        </div>
        <div className="calc-tab__output">
          <span className="calc-tab__output-label">DSCR</span>
          <span
            className={cn(
              "calc-tab__output-value calc-tab__output-value--big",
              aboveCovenant
                ? "calc-tab__output-value--accent"
                : "calc-tab__output-value--warn"
            )}
          >
            {dscr.toFixed(2)}×
          </span>
          <span className="calc-tab__output-sub">
            {aboveCovenant
              ? "✓ above 1.30× covenant"
              : "✗ below 1.30× — sculpted amort kicks in"}
          </span>
        </div>
      </div>

      <p className="calc-tab__footnote">
        Hotel deal anchor points: P5 = 76.8K kWh (DSCR 1.38×) · P50 =
        124.5K kWh (DSCR 1.85×) · P95 = 172K kWh. Drag to see how DSCR
        scales with realised savings — loans are sized so even the
        bottom-5% scenario stays above the 1.30× covenant.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────
export function LendersCalculator() {
  const [active, setActive] = useState<Tab>("yield");

  return (
    <div className="calc">
      <div className="calc__tabs" role="tablist" aria-label="Lenders calculator">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "calc__tab-btn",
              active === t.key && "calc__tab-btn--active"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="calc__body">
        {active === "yield" && <YieldTab />}
        {active === "tranche" && <TrancheTab />}
        {active === "dscr" && <DscrTab />}
      </div>
    </div>
  );
}
