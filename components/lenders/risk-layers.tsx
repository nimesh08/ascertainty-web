"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Risk layers — five stacked bands between the LP and a loss. Same
 * visual pattern as the landing's MoatFortifications (and shares the
 * same .moat-band* CSS classes for visual consistency), but the
 * narrative is "depth of defense": tier 1 = the always-on outermost
 * defense (P5 sizing); tier 5 = the deep-tail last resort
 * (servicing continuity if Ascertainty itself fails).
 *
 * The dot meter reads as "scenario severity addressed": tier 1
 * handles a median miss; tier 5 handles Ascertainty going out of
 * business. Sage saturation grows top→bottom, so the deeper you go,
 * the rarer-but-graver the scenario each layer is built for.
 */

type RiskLayer = {
  num: string;
  title: string;
  lead: string;
  body: string;
  kind: string;
  severity: 1 | 2 | 3 | 4 | 5;
};

const RISK_LAYERS: RiskLayer[] = [
  {
    num: "01",
    title: "P5 sizing",
    lead: "DSCR @ P5 ≥ 1.30×",
    body: "Facilities are sized to the P5 floor of the calibrated 90% PI — not the median. The borrower stays solvent in the bottom-5% savings scenario by design. This is the always-on outermost defense: even a median miss never threatens debt service.",
    kind: "structural",
    severity: 1,
  },
  {
    num: "02",
    title: "Sculpted amortization",
    lead: "Payment scales to realized kWh",
    body: "If a quarter's metered savings come in below forecast, the scheduled payment scales down. Excess in good quarters either pre-pays or accrues to a reserve. The borrower's cash flow is never strained beyond the deal's reality — variance gets absorbed in the schedule, not the relationship.",
    kind: "amortization",
    severity: 2,
  },
  {
    num: "03",
    title: "Tranche stack",
    lead: "Junior absorbs first-loss",
    body: "Senior tranche is sized at 60% LTV against the P5 floor. Junior tranche absorbs any first-loss; senior is protected until junior is exhausted. Pool LPs choose their tranche — yield differential reflects the protection. Junior is priced for the realized-vs-predicted residual.",
    kind: "tranched",
    severity: 3,
  },
  {
    num: "04",
    title: "Recovery hierarchy",
    lead: "Five-step waterfall on default",
    body: "On default: (1) cure — borrower has 90 days to bring current; (2) repossess installed equipment (~10% expected recovery); (3) personal guarantee from promoter (one-deal scope); (4) insurance cover (v3.5 roadmap, SBI / ICICI / Bajaj BD); (5) court action via the Indian Insolvency Code. By the time this layer activates, three others have already failed.",
    kind: "waterfall",
    severity: 4,
  },
  {
    num: "05",
    title: "Servicing continuity",
    lead: "Loans persist on-chain",
    body: "Loans persist on the underlying vault protocol — they don't depend on our company's existence. Servicing is contractually transferable to a successor servicer. Every prediction's audit hash is public so any qualified successor can pick up where we left off. LP capital is at risk to the borrowers' performance, not to our corporate solvency.",
    kind: "continuity",
    severity: 5,
  },
];

export function RiskLayers() {
  const [active, setActive] = useState<number | null>(0);

  return (
    <div className="moat-stack">
      {RISK_LAYERS.map((r, i) => {
        const isActive = active === i;
        return (
          <article
            key={r.num}
            className={cn("moat-band", isActive && "moat-band--active")}
            data-tier={i + 1}
          >
            <button
              type="button"
              className="moat-band__head"
              onClick={() => setActive(isActive ? null : i)}
              aria-expanded={isActive}
              aria-controls={`risk-body-${r.num}`}
            >
              <div className="moat-band__title-block">
                <h3 className="moat-band__title">{r.title}</h3>
                <span className="moat-band__lead">{r.lead}</span>
              </div>
              <span
                className="moat-band__meter"
                aria-label={`Scenario severity: ${r.severity} of 5`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "moat-band__dot",
                      n <= r.severity && "moat-band__dot--lit"
                    )}
                  />
                ))}
              </span>
              <span className="moat-band__kind">{r.kind}</span>
              <span className="moat-band__chevron" aria-hidden>
                ⌄
              </span>
            </button>
            <div
              id={`risk-body-${r.num}`}
              className="moat-band__body"
              role="region"
              aria-hidden={!isActive}
            >
              <p>{r.body}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
