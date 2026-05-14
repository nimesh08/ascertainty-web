import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ | Ascertainty",
  description:
    "Frequently asked questions about Ascertainty — for lenders, borrowers, and credit / risk reviewers.",
};

const SECTIONS: Array<{
  heading: string;
  kicker: string;
  intro: string;
  entries: Array<{ q: string; a: React.ReactNode }>;
}> = [
  {
    heading: "For lenders & LPs",
    kicker: "GETTING STARTED",
    intro:
      "Basics about depositing, distributions, and exit. Risk-reviewer questions are in the third section below.",
    entries: [
      {
        q: "Who can invest today?",
        a: "v0 vaults are restricted to accredited investors and qualified institutional buyers under Singapore SFA and applicable jurisdictions. Onboarding is via Privy KYC + wallet (Phantom, Solflare, Backpack). The wallet that signs the deposit holds the share-of-savings token.",
      },
      {
        q: "What is the minimum investment?",
        a: "Senior tranche minimum is $25K in v0. Junior tranche minimums vary by deal grade. Both settle in USDC on the underlying RWA vault protocol.",
      },
      {
        q: "When are distributions paid?",
        a: "Monthly, after the M&V cycle reconciles realized kWh against the forecast. Distributions accrue pro-rata to your share-of-savings token; you claim by burning the share for principal + accrued, or hold and compose into Aave / Morpho / Pendle for additional leverage.",
      },
      {
        q: "How is the yield generated?",
        a: (
          <>
            The borrower repays from the energy bill they no longer have to
            pay. The calibrated savings forecast gives the LP a P5 floor that
            sizes the loan — DSCR @ P5 ≥ 1.30× is a hard covenant. The
            borrower stays solvent in the bottom-5% scenario; the LP earns the
            difference between the loan coupon and the realized cash flow.{" "}
            <Link
              href="/lenders#risk"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              See the risk framework →
            </Link>
          </>
        ),
      },
      {
        q: "Can I exit before maturity?",
        a: (
          <>
            Today: hold-to-maturity (1–7 yr tenor depending on the deal). On
            the roadmap, in order: whitelisted OTC desk → in-house orderbook →
            queue-priority auctions once senior TVL crosses $1M.{" "}
            <Link
              href="/lenders#liquidity"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              See the liquidity roadmap →
            </Link>
          </>
        ),
      },
    ],
  },
  {
    heading: "For borrowers",
    kicker: "APPLYING",
    intro:
      "Most common questions from MSMEs evaluating a retrofit facility. Full process detail on the borrower page.",
    entries: [
      {
        q: "How big a facility can I get?",
        a: "₹20L–₹100Cr depending on the audited savings forecast and DSCR @ P5 sizing. The PINN underwriting model produces a calibrated P5 floor for your specific site; the facility is sized to that floor under a DSCR ≥ 1.30× covenant.",
      },
      {
        q: "How long from first call to first disbursement?",
        a: (
          <>
            4–6 weeks end-to-end. Audit + forecast (Week 0–2) → term sheet
            (Week 2–3) → PO + escrow (Week 3–4) → install + commission (Week
            4+). M&V tranches start month 1 post-commissioning.{" "}
            <Link
              href="/borrowers#process"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              See the 5-step process →
            </Link>
          </>
        ),
      },
      {
        q: "Do I have to pledge other assets?",
        a: "No. The loan is non-recourse to your other business lines. Collateral is the legal assignment of the metered kWh delta to the SPV, plus a personal guarantee from one promoter (one-deal scope, not unlimited). Your other assets, lines of credit, and balance sheet are untouched.",
      },
      {
        q: "What if my realized savings come in lower than forecast?",
        a: "Sculpted amortization absorbs variance — the scheduled payment scales down with realized kWh. Below the P5 floor, the deal triggers a 90-day cure window before any recovery action starts. The roadmap insurance partner (SBI General / ICICI Lombard / Bajaj Allianz BD) will cover savings-shortfall once partnered.",
      },
      {
        q: "Can I prepay?",
        a: "Yes, anytime, without penalty. Prepayment closes out the assignment of the kWh delta and the personal guarantee.",
      },
    ],
  },
  {
    heading: "For credit & risk reviewers",
    kicker: "DUE DILIGENCE",
    intro:
      "Questions every LP credit committee asks before signing. Answers cite the underwriting policy and the public model.",
    entries: [
      {
        q: "How is this different from an ESCO?",
        a: "ESCOs are the 1980s answer: wrap savings in a corporate guarantee, charge enterprise customers a fat margin, stay out of the SME market entirely. Their model requires investment-grade borrowers, 12–24 month close cycles, and $5M+ ticket minimums. Ascertainty is the 2026 answer: actually underwrite the savings with physics-informed AI. Same risk profile for the borrower (non-recourse + sculpted amortization), 10× bigger addressable market, 1/4 the friction — $25K minimums, 4–6 week close, no recourse to the borrower’s balance sheet.",
      },
      {
        q: "What if savings don’t materialize?",
        a: "Three structural protections, in order. (1) Loans are sized to the P5 floor of the calibrated savings distribution, not the median — DSCR @ P5 ≥ 1.30× is a hard covenant. The borrower stays solvent in the bottom-5% scenario by design. (2) Sculpted amortization absorbs variance: if a quarter’s realized savings come in below forecast, the scheduled payment scales down. (3) Junior tranche absorbs first-loss before senior. Realized portfolio default rates within the model’s predicted band are priced into LP yield; that’s the deal LPs sign up for.",
      },
      {
        q: "What if Ascertainty goes out of business?",
        a: "Loans persist on-chain on the underlying vault protocol — they don’t depend on our company’s existence. Servicing is contractually transferable to a successor servicer. The underwriting policy + every prediction’s audit hash are public, so any qualified successor can pick up where we left off. LP capital is at risk to the borrowers’ performance, not to our corporate solvency.",
      },
      {
        q: "Is the loan a security?",
        a: (
          <>
            Depends on jurisdiction. Loans themselves are debt instruments,
            not securities; the share-of-savings tokens that represent
            fractional LP exposure to the loan’s cash flow have securities-law
            implications in most jurisdictions. v0 vaults are restricted to
            accredited investors and qualified institutional buyers under
            Singapore SFA and applicable jurisdictions. See the full{" "}
            <Link
              href="/docs/underwriting-policy"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              underwriting policy
            </Link>{" "}
            + vault subscription documents for the legal opinion.
          </>
        ),
      },
      {
        q: "How is the underwriting model verifiable?",
        a: (
          <>
            The benchmark is R²=+0.56 LOO on the 72-ECM KISEM corpus with a
            90% conformal prediction interval of ±69,254 kWh. Reproduction
            script via curl is on the landing’s benchmark section. The serving
            model and the headline-benchmark model differ in v0 (PINN unified
            serves live; TabPFN holds the headline R²) — that gap closes in
            v0.5 when TabPFN is retrained on the 21-feature audit schema and
            promoted to serving. Every /v1/predict will then commit a sha256
            of (inputs, outputs, git_commit) as a Solana Memo, making the
            underwriting trail tamper-evident on-chain.{" "}
            <Link
              href="/#03-benchmarks"
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              See the benchmark table →
            </Link>
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/" className="text-fg-muted hover:text-accent">
          ← Back to Ascertainty
        </Link>
        <Link
          href="/docs/underwriting-policy"
          className="text-fg-muted hover:text-accent"
        >
          Underwriting policy ↗
        </Link>
      </div>

      <header style={{ marginBottom: 40 }}>
        <span className="a-kicker-pill">FAQ</span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5vw, 56px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: "12px 0 0",
            fontWeight: 500,
            color: "var(--fg)",
          }}
        >
          Answers.
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            maxWidth: "62ch",
            marginTop: 16,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Three audiences, three concern profiles. Skip to the section that
          matches yours.
        </p>
      </header>

      {SECTIONS.map((s) => (
        <section
          key={s.heading}
          style={{ borderTop: "1px solid var(--line)", padding: "32px 0" }}
        >
          <span className="label" style={{ color: "var(--fg-muted)" }}>
            // {s.kicker}
          </span>
          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              color: "var(--fg)",
              margin: "8px 0 8px",
            }}
          >
            {s.heading}
          </h2>
          <p
            style={{
              color: "var(--fg-muted)",
              maxWidth: "62ch",
              fontSize: 13.5,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {s.intro}
          </p>
          <Accordion type="single" collapsible>
            {s.entries.map((e, i) => (
              <AccordionItem
                key={i}
                value={`${s.heading}-${i}`}
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <AccordionTrigger
                  className="text-base"
                  style={{ textTransform: "none", letterSpacing: 0 }}
                >
                  {e.q}
                </AccordionTrigger>
                <AccordionContent style={{ color: "var(--fg-muted)" }}>
                  {e.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "32px 0 12px",
          color: "var(--fg-muted)",
          fontSize: 13,
          lineHeight: 1.6,
          maxWidth: "62ch",
        }}
      >
        Question not answered here? Reach us at{" "}
        <a
          href="mailto:hello@ascertainty.com"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          hello@ascertainty.com
        </a>{" "}
        — LPs:{" "}
        <a
          href="mailto:lp@ascertainty.com"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          lp@ascertainty.com
        </a>
        ; borrowers:{" "}
        <a
          href="mailto:borrowers@ascertainty.com"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          borrowers@ascertainty.com
        </a>
        .
      </footer>
    </Container>
  );
}
