import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared FAQ source-of-truth — consumed by /docs/faq (full list) and the
 * landing page §05 persona toggle (3 featured per persona). Editing an
 * answer here updates both. Adding a new question requires giving it a
 * stable `id` slug so the landing-featured map keeps working.
 */

export type FaqPersona = "lenders" | "borrowers" | "reviewers";

export type FaqEntry = {
  id: string;
  q: string;
  a: ReactNode;
};

export type FaqSection = {
  persona: FaqPersona;
  heading: string;
  kicker: string;
  shortLabel: string;
  intro: string;
  /**
   * Short context line shown above the 3 featured Q&As on landing §05.
   * Differs from `intro` because the landing has no "see other section
   * below" navigation context.
   */
  landingIntro: string;
  entries: FaqEntry[];
};

const linkStyle = {
  color: "var(--accent)",
  textDecoration: "underline" as const,
  textUnderlineOffset: 2,
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    persona: "lenders",
    heading: "For lenders & LPs",
    kicker: "YIELD & EXIT",
    shortLabel: "For lenders",
    intro: "Basics about depositing, distributions, and exit.",
    landingIntro:
      "How yield is sized, when distributions arrive, exit liquidity.",
    entries: [
      {
        id: "who-can-invest",
        q: "Who can invest today?",
        a: "v0 vaults are restricted to accredited investors and qualified institutional buyers under Singapore SFA and applicable jurisdictions. Onboarding is via Privy KYC + wallet (Phantom, Solflare, Backpack). The wallet that signs the deposit holds the share-of-savings token.",
      },
      {
        id: "min-investment",
        q: "What is the minimum investment?",
        a: "Senior tranche minimum is $25K in v0. Junior tranche minimums vary by deal grade. Both settle in USDC on the underlying RWA vault protocol.",
      },
      {
        id: "distributions",
        q: "When are distributions paid?",
        a: "Monthly, after the M&V cycle reconciles realized kWh against the forecast. Distributions accrue pro-rata to your share-of-savings token; you claim by burning the share for principal + accrued, or hold and compose into Aave / Morpho / Pendle for additional leverage.",
      },
      {
        id: "yield",
        q: "How is the yield generated?",
        a: (
          <>
            The borrower repays from the energy bill they no longer have to
            pay. The calibrated savings forecast gives the LP a P5 floor that
            sizes the loan — DSCR @ P5 ≥ 1.30× is a hard covenant. The
            borrower stays solvent in the bottom-5% scenario; the LP earns the
            difference between the loan coupon and the realized cash flow.{" "}
            <Link href="/lenders#risk" style={linkStyle}>
              See the risk framework →
            </Link>
          </>
        ),
      },
      {
        id: "exit",
        q: "Can I exit before maturity?",
        a: (
          <>
            Today: hold-to-maturity (1–7 yr tenor depending on the deal). On
            the roadmap, in order: whitelisted OTC desk → in-house orderbook →
            queue-priority auctions once senior TVL crosses $1M.{" "}
            <Link href="/lenders#liquidity" style={linkStyle}>
              See the liquidity roadmap →
            </Link>
          </>
        ),
      },
    ],
  },
  {
    persona: "borrowers",
    heading: "For borrowers",
    kicker: "FACILITY TERMS",
    shortLabel: "For borrowers",
    intro:
      "Most common questions from MSMEs evaluating a retrofit facility.",
    landingIntro:
      "Timeline, collateral structure, savings-shortfall protections.",
    entries: [
      {
        id: "facility-size",
        q: "How big a facility can I get?",
        a: "₹20L–₹100Cr depending on the audited savings forecast and DSCR @ P5 sizing. The PINN underwriting model produces a calibrated P5 floor for your specific site; the facility is sized to that floor under a DSCR ≥ 1.30× covenant.",
      },
      {
        id: "close-time",
        q: "How long from first call to first disbursement?",
        a: (
          <>
            4–6 weeks end-to-end. Audit + forecast (Week 0–2) → term sheet
            (Week 2–3) → PO + escrow (Week 3–4) → install + commission (Week
            4+). M&V tranches start month 1 post-commissioning.{" "}
            <Link href="/borrowers#process" style={linkStyle}>
              See the 5-step process →
            </Link>
          </>
        ),
      },
      {
        id: "no-pledge",
        q: "Do I have to pledge other assets?",
        a: "No. The loan is non-recourse to your other business lines. Collateral is the legal assignment of the metered kWh delta to the SPV, plus a personal guarantee from one promoter (one-deal scope, not unlimited). Your other assets, lines of credit, and balance sheet are untouched.",
      },
      {
        id: "shortfall",
        q: "What if my realized savings come in lower than forecast?",
        a: "Sculpted amortization absorbs variance — the scheduled payment scales down with realized kWh. Below the P5 floor, the deal triggers a 90-day cure window before any recovery action starts. The roadmap insurance partner (SBI General / ICICI Lombard / Bajaj Allianz BD) will cover savings-shortfall once partnered.",
      },
      {
        id: "prepay",
        q: "Can I prepay?",
        a: "Yes, anytime, without penalty. Prepayment closes out the assignment of the kWh delta and the personal guarantee.",
      },
    ],
  },
  {
    persona: "reviewers",
    heading: "For credit & risk reviewers",
    kicker: "MODEL & RISK",
    shortLabel: "Due diligence",
    intro:
      "Questions every LP credit committee asks before signing. Answers cite the underwriting policy and the public model.",
    landingIntro:
      "Model verifiability, default mechanics, business continuity.",
    entries: [
      {
        id: "esco-diff",
        q: "How is this different from an ESCO?",
        a: "ESCOs are the 1980s answer: wrap savings in a corporate guarantee, charge enterprise customers a fat margin, stay out of the SME market entirely. Their model requires investment-grade borrowers, 12–24 month close cycles, and $5M+ ticket minimums. Ascertainty is the 2026 answer: actually underwrite the savings with physics-informed AI. Same risk profile for the borrower (non-recourse + sculpted amortization), 10× bigger addressable market, 1/4 the friction — $25K minimums, 4–6 week close, no recourse to the borrower’s balance sheet.",
      },
      {
        id: "savings-shortfall",
        q: "What if savings don’t materialize?",
        a: "Three structural protections, in order. (1) Loans are sized to the P5 floor of the calibrated savings distribution, not the median — DSCR @ P5 ≥ 1.30× is a hard covenant. The borrower stays solvent in the bottom-5% scenario by design. (2) Sculpted amortization absorbs variance: if a quarter’s realized savings come in below forecast, the scheduled payment scales down. (3) Junior tranche absorbs first-loss before senior. Realized portfolio default rates within the model’s predicted band are priced into LP yield; that’s the deal LPs sign up for.",
      },
      {
        id: "out-of-business",
        q: "What if Ascertainty goes out of business?",
        a: "Loans persist on-chain on the underlying vault protocol — they don’t depend on our company’s existence. Servicing is contractually transferable to a successor servicer. The underwriting policy + every prediction’s audit hash are public, so any qualified successor can pick up where we left off. LP capital is at risk to the borrowers’ performance, not to our corporate solvency.",
      },
      {
        id: "security",
        q: "Is the loan a security?",
        a: (
          <>
            Depends on jurisdiction. Loans themselves are debt instruments,
            not securities; the share-of-savings tokens that represent
            fractional LP exposure to the loan’s cash flow have securities-law
            implications in most jurisdictions. v0 vaults are restricted to
            accredited investors and qualified institutional buyers under
            Singapore SFA and applicable jurisdictions. See the full{" "}
            <Link href="/docs/underwriting-policy" style={linkStyle}>
              underwriting policy
            </Link>{" "}
            + vault subscription documents for the legal opinion.
          </>
        ),
      },
      {
        id: "model-verifiable",
        q: "How is the underwriting model verifiable?",
        a: (
          <>
            Three layers. (1){" "}
            <b>Headline benchmark</b>: R²=+0.56 LOO on the 72-ECM KISEM corpus
            with a calibrated 90% conformal prediction interval — the math
            behind P5 loan sizing, reproducible from the underlying audit
            corpus. (2) <b>Per-deal transparency</b>: every project on{" "}
            <Link href="/projects" style={linkStyle}>
              /projects
            </Link>{" "}
            publishes its own P5 / P50 / P95 band from the serving model, so
            each loan’s sizing is auditable at the asset level. (3){" "}
            <b>Public methodology</b>: the{" "}
            <Link href="/docs/underwriting-policy" style={linkStyle}>
              underwriting policy
            </Link>{" "}
            spells out every step from input features through the DSCR @ P5 ≥
            1.30× covenant. A public reproduction notebook for the LOO
            benchmark on the IAC subset is in preparation; on-chain
            audit-hash commits — per-prediction tamper-evidence tying inputs,
            outputs, and model commit — are on the roadmap.{" "}
            <Link href="/#05-benchmarks" style={linkStyle}>
              See the benchmark table →
            </Link>
          </>
        ),
      },
    ],
  },
];

/**
 * Which 3 entry ids to feature in the landing page §05 persona toggle.
 * Picked for highest "objection-handling impact" per persona — see commit
 * msg or the landing copy review for rationale. To re-pick, edit here.
 */
export const LANDING_FEATURED: Record<FaqPersona, string[]> = {
  lenders: ["yield", "exit", "min-investment"],
  borrowers: ["close-time", "no-pledge", "shortfall"],
  reviewers: ["model-verifiable", "savings-shortfall", "out-of-business"],
};

export function getFeaturedEntries(persona: FaqPersona): FaqEntry[] {
  const section = FAQ_SECTIONS.find((s) => s.persona === persona);
  if (!section) return [];
  const ids = LANDING_FEATURED[persona];
  return ids
    .map((id) => section.entries.find((e) => e.id === id))
    .filter((e): e is FaqEntry => e !== undefined);
}
