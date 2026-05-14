import type { Metadata } from "next";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SectionHead } from "@/components/landing/ascertainty/section-head";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "For Lenders | Ascertainty",
  description:
    "Earn 10–14% yield on industrial efficiency credit, underwritten by physics-informed AI. Non-recourse loans to Indian MSME industrial energy retrofits, sized to the P5 floor of a calibrated 90% prediction interval.",
};

async function loadFeaturedProjectId(): Promise<string | null> {
  try {
    const [featured] = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.msmeName, "HVAC Optimization for Hotel"))
      .limit(1);
    return featured?.id ?? null;
  } catch {
    return null;
  }
}

export default async function LendersPage() {
  const featuredProjectId = await loadFeaturedProjectId();

  return (
    <>
      {/* HERO */}
      <section className="a-hero a-hero--card">
        <div className="a-hero__bg" />
        <div
          className="shell"
          style={{ paddingTop: 72, paddingBottom: 72, position: "relative" }}
        >
          <span className="a-kicker-pill">For lenders · LPs</span>
          <h1
            className="a-hero__heading"
            style={{ maxWidth: "22ch", marginTop: 18 }}
          >
            Earn 10–14% yield on industrial efficiency credit, underwritten by{" "}
            <span className="accent">physics-informed AI</span>.
          </h1>
          <p className="a-hero__sub" style={{ maxWidth: "62ch", marginTop: 22 }}>
            Non-recourse loans to Indian MSME industrial retrofits, sized to
            the <strong className="a-hero__sub-em">P5 floor of a calibrated
            90% prediction interval</strong>. DSCR @ P5 ≥ 1.30× is a hard
            covenant. Distributions settle monthly in USDC.
          </p>
          <div className="a-hero__ctas" style={{ marginTop: 28 }}>
            <Link className="a-btn a-btn--primary" href="/projects">
              View data room <span className="arrow">→</span>
            </Link>
            <a className="a-btn a-btn--ghost" href="mailto:lp@ascertainty.com">
              Apply for LP onboarding
            </a>
          </div>
        </div>
      </section>

      {/* WHY UNSERVED — full 3-column comparison */}
      <section id="why-unserved" className="a-section">
        <SectionHead
          idx="01"
          kicker="WHY UNSERVED"
          title="Three industries try to serve this market. None can."
          intro="Banks won’t lend without salvage. ESCOs only serve $5M+ enterprises. Other on-chain credit protocols underwrite on curator reputation, not calibrated models. The SME industrial-retrofit gap is structural — and that’s exactly why the yield is here."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div className="cmp-tbl-wrap">
            <table className="cmp-tbl">
              <thead>
                <tr>
                  <th></th>
                  <th>Banks</th>
                  <th>ESCOs <span className="cmp-tbl__sub">(Johnson Controls, Trane, Honeywell)</span></th>
                  <th>On-chain credit <span className="cmp-tbl__sub">(curator-led pools)</span></th>
                  <th className="cmp-tbl__us">Ascertainty</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Min ticket", "$1M+", "$5–10M+", "$100K–500K", "$25K"],
                  ["Borrower credit required", "Strong balance sheet", "Investment-grade", "Curator-selected", "None (non-recourse, savings-secured)"],
                  ["Time to close", "6+ months", "12–24 months", "Weeks", "4–6 weeks"],
                  ["Underwriting transparency", "Internal model", "Black box", "Expert reputation", "Calibrated model — verifiable from a curl"],
                  ["P5 floor disclosed?", "No", "No", "No", "Yes (90% conformal PI)"],
                  ["Loan structure", "Full recourse", "ESPC corporate guarantee", "Curator-defined", "Non-recourse"],
                  ["SME-accessible", "✗", "✗", "Curator-gated", "✓"],
                  ["Geography", "OECD", "US + select EU", "OECD-centric", "India · SEA · expanding"],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="cmp-tbl__row-label">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>{row[3]}</td>
                    <td className="cmp-tbl__us">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p
            style={{
              marginTop: 24,
              fontSize: 13,
              color: "var(--fg-muted)",
              maxWidth: "70ch",
              lineHeight: 1.6,
            }}
          >
            Salvage value for a $500K compressed-air retrofit is ~$50K
            (~10% recovery). The same $500K of GPUs resells for ~$300K (~60%).
            A non-recourse loan needs two legs: salvage and cash flow. Banks
            rely on salvage so they won’t touch retrofits. We have only the
            cash-flow leg —{" "}
            <strong style={{ color: "var(--fg)" }}>
              but it’s a leg only a calibrated physics model can build
            </strong>
            . That is the unserved market, and the moat.
          </p>
        </div>
      </section>

      {/* BANKABLE COLLATERAL — the 4-step transformation */}
      <section id="bankable-collateral" className="a-section">
        <SectionHead
          idx="02"
          kicker="BANKABLE COLLATERAL"
          title="A raw promise turns into a financial instrument."
          intro="Energy savings are not collateral by default — they’re a promise. Four steps turn them into something a lender can underwrite."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div className="bc-grid">
            {[
              {
                step: "00",
                left: "“We’ll save kWh”",
                right: "Calibrated forecast with bounds",
                body: "TabPFN in-context model produces a P5 / P50 / P95 distribution per ECM. 90% conformal prediction interval calibrated on held-out audits.",
              },
              {
                step: "01",
                left: "“Trust us, the auditor signed off”",
                right: "IoT meters + on-chain audit hash",
                body: "Day-30 reconciliation by a KISEM-affiliated auditor today. Continuous IoT M&V via IPMVP Option B on the roadmap. Every prediction’s sha256 commits on-chain so the audit trail is tamper-evident.",
              },
              {
                step: "02",
                left: "“Pay us from savings”",
                right: "Legal assignment of utility delta to vault",
                body: "Loan documents assign the measured-vs-baseline kWh delta to the SPV. Borrower’s other business lines are untouched (non-recourse).",
              },
              {
                step: "03",
                left: "(Not bankable)",
                right: "Bankable",
                body: "Loan sized to the P5 floor under a DSCR @ P5 ≥ 1.30× covenant. Borrower stays solvent even in the bottom-5% savings scenario.",
              },
            ].map((r) => (
              <div key={r.step} className="bc-row">
                <div className="bc-step">{r.step}</div>
                <div className="bc-left">
                  <span className="label">Raw promise</span>
                  <div className="bc-text bc-text--muted">{r.left}</div>
                </div>
                <div className="bc-arrow" aria-hidden>&rarr;</div>
                <div className="bc-right">
                  <span className="label" style={{ color: "var(--accent-deep)" }}>
                    Bankable collateral
                  </span>
                  <div className="bc-text bc-text--accent">{r.right}</div>
                </div>
                <div className="bc-body">{r.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKED EXAMPLE */}
      <section id="worked-example" className="a-section">
        <SectionHead
          idx="03"
          kicker="WORKED EXAMPLE"
          title="One deal, end to end."
          intro="Numbers from a live seed deal on this site. Click through to the same project page to verify."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div
            className="we-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
              gap: 28,
              alignItems: "start",
            }}
          >
            <div style={{ borderTop: "1px solid var(--line)" }}>
              {[
                {
                  step: "01",
                  actor: "Site",
                  title: "Bangalore 4-star hotel · 142 rooms",
                  body: "Baseline electricity draw 482,000 kWh/yr at ₹8.5/kWh.",
                },
                {
                  step: "02",
                  actor: "Retrofit",
                  title: "Chiller plant + IoT setpoint controls",
                  body: "Magnetic-bearing chillers replace existing units; occupancy-aware setpoint optimization across 142 rooms shifts cooling to off-peak.",
                },
                {
                  step: "03",
                  actor: "Forecast",
                  title: "Calibrated savings prediction with 90% conformal PI",
                  body: "P5 floor 76,800 kWh/yr · P50 124,500 kWh/yr · P95 upper 172,000 kWh/yr. Grade B (senior + junior tranche split).",
                },
                {
                  step: "04",
                  actor: "Underwriting",
                  title: "Loan sized to the P5 floor, not the P50 point",
                  body: "DSCR at P5 = 1.38× (≥ 1.30× covenant). DSCR at P50 = 1.85×. Recommended facility $25,000 over 36 months. Junior absorbs first-loss per §5.5.",
                },
              ].map((r) => (
                <div
                  key={r.step}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr",
                    gap: 20,
                    padding: "22px 0",
                    borderBottom: "1px solid var(--line)",
                    alignItems: "start",
                  }}
                >
                  <div
                    className="num"
                    style={{
                      fontSize: 22,
                      color: "var(--fg-faint)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {r.step}
                  </div>
                  <div>
                    <div
                      className="label"
                      style={{ marginBottom: 6, color: "var(--fg-faint)" }}
                    >
                      {r.actor}
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        letterSpacing: "-0.01em",
                        color: "var(--fg)",
                        marginBottom: 6,
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--fg-muted)",
                        lineHeight: 1.55,
                      }}
                    >
                      {r.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                border: "1px solid var(--line)",
                background: "var(--bg-1)",
                padding: 22,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                  marginBottom: 16,
                }}
              >
                The math
              </div>
              {[
                ["Baseline draw", "482,000 kWh/yr"],
                ["Electricity rate", "₹8.5/kWh"],
                ["Predicted savings (P50)", "124,500 kWh/yr"],
                ["Annual savings @ P50", "₹1,058,250"],
                ["Annual savings @ P5", "₹652,800"],
                ["Carbon §11 accrual", "102.1 tCO₂/yr"],
                ["DSCR @ P5", "1.38×"],
                ["DSCR @ P50", "1.85×"],
                ["Recommended facility", "$25,000 · 36 mo"],
                ["Implied payback @ P5", "≈ 24 mo"],
                ["Senior tranche LTV", "60%"],
              ].map(([k, v], i, arr) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom:
                      i === arr.length - 1 ? "none" : "1px dashed var(--line)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--fg-muted)",
                    }}
                  >
                    {k}
                  </span>
                  <span
                    className="mono-num"
                    style={{ fontSize: 13, color: "var(--fg)" }}
                  >
                    {v}
                  </span>
                </div>
              ))}

              <Link
                href={
                  featuredProjectId
                    ? `/projects/${featuredProjectId}`
                    : "/projects"
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 18,
                  fontSize: 12.5,
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                See the live deal <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
          <p
            style={{
              marginTop: 22,
              fontSize: 12,
              color: "var(--fg-faint)",
              maxWidth: "70ch",
            }}
          >
            Carbon §11 figures use 0.82 kgCO₂/kWh (India grid factor). Loan
            sizing follows UNDERWRITING_POLICY §5 — DSCR @ P5 ≥ 1.30× is the
            hard covenant. Senior/junior split per the confidence grade.
          </p>
        </div>
      </section>

      {/* RISK FRAMEWORK */}
      <section id="risk" className="a-section">
        <SectionHead
          idx="04"
          kicker="RISK FRAMEWORK"
          title="Five layers between the LP and a loss."
          intro="The deal underwrites itself out of the median scenario. Below are the protections when the median misses."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                num: "01",
                title: "P5 sizing",
                lead: "DSCR @ P5 ≥ 1.30×",
                body: "Facilities are sized to the P5 floor of the calibrated 90% PI — not the median. The borrower stays solvent in the bottom-5% savings scenario by design.",
              },
              {
                num: "02",
                title: "Sculpted amortization",
                lead: "Payment scales to realized kWh",
                body: "If a quarter’s metered savings come in below forecast, the scheduled payment scales down. Excess in good quarters either pre-pays or accrues to a reserve. The borrower’s cash flow is never strained beyond the deal’s reality.",
              },
              {
                num: "03",
                title: "Tranche stack",
                lead: "Junior absorbs first-loss",
                body: "Senior tranche is sized at 60% LTV against the P5 floor. Junior tranche absorbs any first-loss; senior is protected until junior is exhausted. Pool LPs choose their tranche.",
              },
              {
                num: "04",
                title: "Recovery hierarchy",
                lead: "Five waterfall steps",
                body: "On default: (1) cure — borrower has 90 days to bring current; (2) repossess installed equipment (~10% expected recovery); (3) personal guarantee from promoter (one-deal scope); (4) insurance cover (v3.5 roadmap, SBI/ICICI/Bajaj BD); (5) court action via Indian Insolvency Code.",
              },
              {
                num: "05",
                title: "Servicing continuity",
                lead: "Loans persist on-chain",
                body: "Loans persist on the underlying vault protocol — they don’t depend on our company’s existence. Servicing is contractually transferable to a successor servicer. Every prediction’s audit hash is public so any qualified successor can pick up where we left off.",
              },
            ].map((p) => (
              <div
                key={p.num}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--bg-1)",
                  padding: 20,
                  minHeight: 230,
                  position: "relative",
                }}
              >
                <span
                  className="label"
                  style={{ color: "var(--fg-faint)", fontSize: 10 }}
                >
                  R / {p.num}
                </span>
                <h3
                  style={{
                    fontSize: 18,
                    letterSpacing: "-0.01em",
                    marginTop: 10,
                    color: "var(--fg)",
                  }}
                >
                  {p.title}
                </h3>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontFamily: "var(--font-mono, ui-monospace)",
                    color: "var(--accent-deep)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {p.lead}
                </div>
                <p
                  style={{
                    marginTop: 14,
                    fontSize: 13,
                    color: "var(--fg-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {p.body}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              color: "var(--fg-faint)",
              maxWidth: "60ch",
            }}
          >
            Full policy + math walk-through:{" "}
            <Link
              href="/docs/underwriting-policy"
              style={{
                color: "var(--fg-muted)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              UNDERWRITING POLICY ↗
            </Link>
          </p>
        </div>
      </section>

      {/* LIQUIDITY & EXIT */}
      <section id="liquidity" className="a-section">
        <SectionHead
          idx="05"
          kicker="LIQUIDITY & EXIT"
          title="A clear path to secondary."
          intro="LPs ask 'how do I exit?' before they wire. Our answer is dated, not vague — primary today, whitelisted OTC in Q1 2026, native in-house orderbook in Q3 2026, and a queue-priority auction mechanism triggered once senior TVL crosses ~$1M."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1100 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                phase: "v0 — TODAY",
                title: "Hold to maturity",
                state: "shipped",
                lines: [
                  "Primary subscription only",
                  "1–7 yr tenor, fixed schedule",
                  "Cash-flow distributions in USDC",
                ],
              },
              {
                phase: "v1 — Q1 2026",
                title: "Whitelisted OTC desk",
                state: "in-flight",
                lines: [
                  "Underlying vault protocol wrapper",
                  "Daily NAV transparency",
                  "KYC enforced on transfer",
                ],
              },
              {
                phase: "v2 — Q3 2026",
                title: "In-house orderbook",
                state: "planned",
                lines: [
                  "20 bps fee per secondary trade",
                  "Cross-chain via Wormhole NTT",
                  "Triggers when AUM > $50M",
                ],
              },
              {
                phase: "v3 — when senior TVL ≥ $1M",
                title: "Queue-priority auctions",
                state: "planned",
                lines: [
                  "FIFO redemption queue + auction priority bidding",
                  "Junior tranche absorbs queue stress first (§5.5)",
                  "Adopts the DePIN-credit QEV pattern, adapted to monthly USDC sweeps",
                ],
              },
            ].map((p, i) => {
              const isActive = p.state === "in-flight";
              const isShipped = p.state === "shipped";
              return (
                <div
                  key={i}
                  style={{
                    border: isActive
                      ? "1px solid var(--accent)"
                      : "1px solid var(--line)",
                    background: isActive ? "var(--accent-soft)" : "var(--bg-1)",
                    padding: 18,
                  }}
                >
                  <span
                    className="label"
                    style={{
                      color: isActive ? "var(--accent-deep)" : "var(--fg-muted)",
                    }}
                  >
                    {p.phase}
                  </span>
                  <h3
                    style={{
                      fontSize: 18,
                      letterSpacing: "-0.01em",
                      marginTop: 6,
                      color: isActive ? "var(--accent-deep)" : "var(--fg)",
                    }}
                  >
                    {p.title}
                  </h3>
                  <ul
                    style={{
                      marginTop: 12,
                      fontSize: 12.5,
                      color: "var(--fg-muted)",
                      listStyle: "none",
                      padding: 0,
                    }}
                  >
                    {p.lines.map((l, j) => (
                      <li key={j} style={{ padding: "3px 0" }}>
                        {isShipped ? "✓ " : "· "}
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA CLOSER */}
      <section className="a-section">
        <div
          className="shell"
          style={{
            padding: "100px 0 120px",
            position: "relative",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 50% 80% at 50% 100%, var(--accent-soft), transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <span className="label">// FOR ACCREDITED LPs · DFIs · CLIMATE FUNDS</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(36px, 6vw, 80px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              margin: "22px auto 0",
              maxWidth: "22ch",
              position: "relative",
            }}
          >
            Underwrite the energy transition,{" "}
            <span className="serif" style={{ color: "var(--accent)" }}>
              verifiably
            </span>
            .
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 36,
              flexWrap: "wrap",
              position: "relative",
            }}
          >
            <Link className="a-btn a-btn--primary" href="/projects">
              View data room <span className="arrow">→</span>
            </Link>
            <a className="a-btn a-btn--ghost" href="mailto:lp@ascertainty.com">
              Apply for LP onboarding
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
