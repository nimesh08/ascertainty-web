"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Moat fortifications — five stacked bands, ordered top→bottom by
 * copy-difficulty. Each band shows the moat number, title, one-line
 * lead, a copy-difficulty meter (1-5 dots), and a kind tag. Click a
 * band to expand and reveal the body. Default open: tier 5 (the
 * weak-salvage market — the punchline of the build-up).
 *
 * Visual: sage saturation grows from tier 1 (light) to tier 5 (deep),
 * literal "the difficulty stacks up" metaphor for the section's claim
 * that the moats reinforce each other.
 */

type Moat = {
  num: string;
  title: string;
  lead: string;
  body: string;
  kind: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
};

const MOATS: Moat[] = [
  {
    num: "01",
    title: "KISEM funnel",
    lead: "Top-of-funnel cost ≈ ₹0",
    body: "Proprietary access to ~600 BEE/KISEM-audited MSMEs/year via IIT-Madras partnership. The 12 audits already in our corpus took a competitor 18 months to duplicate.",
    kind: "relational",
    difficulty: 2,
  },
  {
    num: "02",
    title: "PINN data flywheel",
    lead: "σ tightens with portfolio scale",
    body: "Every realized M&V data point recalibrates per-category σ-scales. After 50 loans our P5 is meaningfully tighter than a competitor with 5 — meaning we can price more competitively, win more deals, generate more data.",
    kind: "compounding",
    difficulty: 3,
  },
  {
    num: "03",
    title: "Coordination edge",
    lead: "7 capabilities in rare combination",
    body: "Auditor relationship + ML/physics underwriting + tokenization rails + Singapore-Asia regulatory wrappers + LP onboarding + NBFC INR disbursement + IoT M&V. Each individually doable; assembling all seven in parallel is the moat.",
    kind: "structural",
    difficulty: 4,
  },
  {
    num: "04",
    title: "Verifiable underwriting",
    lead: "calibrated model, not human curators",
    body: "Every other on-chain credit protocol underwrites via 'trust our independent experts' — a marketing claim, not a verifiable system. Ascertainty's underwriting is a calibrated ML model with a published 90% conformal PI (R²=+0.56 LOO, verifiable on /v1/health from a curl). DSCR @ P5 ≥ 1.30× is a quantitative covenant a lender writes into the contract. Reconciliation against realized Day-30 metered savings is mechanical. A future release commits a sha256 of every prediction's (inputs, outputs, git_commit) to a Solana Memo, making the audit trail tamper-evident on-chain.",
    kind: "verifiability",
    difficulty: 4,
  },
  {
    num: "05",
    title: "Weak-salvage market",
    lead: "the difficulty IS the moat",
    body: "A $500K compressed-air retrofit resells for ~$50K post-default — about 10% recovery. The same $500K of GPUs resells for ~$300K — about 60%. Retrofit equipment is custom-fitted to a specific factory's pipework; uninstallation often costs more than resale; the secondary market for used VFDs, chillers, and heat-exchangers is thin. A non-recourse loan needs two legs: salvage value (sell the asset) and cash flow (income the asset generates). Banks rely on the salvage leg, so they won't touch retrofits. We have only the cash-flow leg — but it's a leg only a calibrated physics model can build. Anyone with a balance sheet can compete in GPU credit. Nobody can compete here without our underwriting tech.",
    kind: "structural",
    difficulty: 5,
  },
];

export function MoatFortifications() {
  const [active, setActive] = useState<number | null>(MOATS.length - 1);

  return (
    <div className="moat-stack">
      {MOATS.map((m, i) => {
        const isActive = active === i;
        return (
          <article
            key={m.num}
            className={cn("moat-band", isActive && "moat-band--active")}
            data-tier={i + 1}
          >
            <button
              type="button"
              className="moat-band__head"
              onClick={() => setActive(isActive ? null : i)}
              aria-expanded={isActive}
              aria-controls={`moat-body-${m.num}`}
            >
              <div className="moat-band__title-block">
                <h3 className="moat-band__title">{m.title}</h3>
                <span className="moat-band__lead">{m.lead}</span>
              </div>
              <span
                className="moat-band__meter"
                aria-label={`Copy difficulty: ${m.difficulty} of 5`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "moat-band__dot",
                      n <= m.difficulty && "moat-band__dot--lit"
                    )}
                  />
                ))}
              </span>
              <span className="moat-band__kind">{m.kind}</span>
              <span className="moat-band__chevron" aria-hidden>
                ⌄
              </span>
            </button>
            <div
              id={`moat-body-${m.num}`}
              className="moat-band__body"
              role="region"
              aria-hidden={!isActive}
            >
              <p>{m.body}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
