import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead } from "@/components/landing/ascertainty/section-head";
import { HeroTimeline } from "@/components/borrowers/hero-timeline";
import { AuditIntakeFlow } from "@/components/borrowers/audit-intake-flow";

export const metadata: Metadata = {
  title: "For Borrowers | Ascertainty",
  description:
    "Upgrade your factory. We pay for the install; you repay from the energy savings. 4–6 weeks to close, no recourse to your business.",
};

export default function BorrowersPage() {
  return (
    <>
      {/* HERO — two-column: copy + CTAs on the left, time-compressed
          timeline sidecar on the right anchoring the "4–6 weeks" claim. */}
      <section className="a-hero a-hero--card">
        <div className="a-hero__bg" />
        <div
          className="shell"
          style={{ paddingTop: 56, paddingBottom: 56, position: "relative" }}
        >
          <div className="borrowers-hero__grid">
            <div>
              <span className="a-kicker-pill">For MSME borrowers</span>
              <h1
                className="a-hero__heading"
                style={{
                  maxWidth: "14ch",
                  marginTop: 18,
                  fontSize: "clamp(38px, 5.6vw, 72px)",
                }}
              >
                Upgrade your factory.{" "}
                <span className="accent">We pay for the install</span>; you repay
                from the energy savings.
              </h1>
              <p className="a-hero__sub" style={{ maxWidth: "56ch", marginTop: 22 }}>
                4–6 weeks to close. No recourse to your business — repayment is
                assigned to the kWh delta the upgrade generates.{" "}
                <strong className="a-hero__sub-em">₹20L–₹100Cr facility sizes</strong>{" "}
                for vetted Indian MSMEs.
              </p>
              <div className="a-hero__ctas" style={{ marginTop: 28 }}>
                <a className="a-btn a-btn--primary" href="mailto:borrowers@ascertainty.com">
                  Start an application <span className="arrow">→</span>
                </a>
                <Link className="a-btn a-btn--ghost" href="/projects">
                  See live deals
                </Link>
              </div>
            </div>
            <div className="borrowers-hero__sidecar">
              <HeroTimeline />
            </div>
          </div>
        </div>
      </section>

      {/* §01 ELIGIBILITY — am I qualified? */}
      <section id="eligibility" className="a-section">
        <SectionHead
          idx="01"
          kicker="ELIGIBILITY"
          title="What we look for before issuing a term sheet."
          intro="We can underwrite the savings — but the business has to be the kind that survives a 1–7 year tenor. Pulled from §4.1 of our underwriting policy."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {[
              {
                k: "5+ years operating history",
                v: "Audited financials available for the last three years. Pre-revenue or first-year operations do not qualify in v0.",
              },
              {
                k: "GST-compliant + filings current",
                v: "GSTIN active, monthly filings up to date for the last 12 months. We pull GSTN consent-flow data directly.",
              },
              {
                k: "Promoter CIBIL ≥ 700",
                v: "Personal guarantee from at least one promoter; CIBIL pull as part of intake. Sub-700 scores routed to the partner channel.",
              },
              {
                k: "Indian geography (v0)",
                v: "Pilot region is India. Indonesia and Vietnam open with v1 mainnet. Outside this footprint, please join the waitlist.",
              },
              {
                k: "ECM has a calibrated forecast",
                v: "The retrofit category must be one our PINN underwriting model has trained on (see ECM categories below). If not, we route to a partner ESCO.",
              },
            ].map((r, i, arr) => (
              <div
                key={r.k}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 1fr) 2fr",
                  gap: 28,
                  padding: "22px 0",
                  borderBottom:
                    i === arr.length - 1 ? "none" : "1px solid var(--line)",
                  alignItems: "start",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    color: "var(--fg)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {r.k}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--fg-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  {r.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §02 ECM CATEGORIES — do you fund my equipment? */}
      <section id="ecm-categories" className="a-section">
        <SectionHead
          idx="02"
          kicker="WHAT WE FINANCE"
          title="Six ECM categories. One calibrated model behind each."
          intro="Energy Conservation Measures we currently underwrite. Each has a per-category σ-scale that tightens with every realized M&V data point."
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
                cat: "VFDs / motor controls",
                why: "Variable-frequency drives on pumps, fans, compressors. Tightest σ in our corpus — physics is well-instrumented.",
                ticket: "$15K–$200K",
              },
              {
                cat: "Solar PV (rooftop, captive)",
                why: "Captive solar with net-metering or behind-the-meter. We underwrite the demand-offset, not the export tariff.",
                ticket: "$50K–$2M",
              },
              {
                cat: "LED retrofits",
                why: "Industrial lighting retrofits, including high-bay and warehouse. Predictable load reduction; fast payback.",
                ticket: "$10K–$300K",
              },
              {
                cat: "Cold storage",
                why: "Refrigeration efficiency upgrades — compressors, insulation, controls. Cooling-load model accounts for ambient.",
                ticket: "$50K–$1M",
              },
              {
                cat: "Chiller plant upgrades",
                why: "Magnetic-bearing chillers, plate heat exchangers, BMS controls. HVAC-heavy sites including hotels, hospitals, datacenters.",
                ticket: "$100K–$3M",
              },
              {
                cat: "Cogeneration / heat recovery",
                why: "CHP, waste-heat recovery, process steam optimization. Highest ticket sizes; σ widens for cogen due to load variability.",
                ticket: "$200K–$5M",
              },
            ].map((c) => (
              <div
                key={c.cat}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--bg-1)",
                  padding: 20,
                  minHeight: 180,
                  borderRadius: 8,
                }}
              >
                <h3
                  style={{
                    fontSize: 17,
                    letterSpacing: "-0.01em",
                    color: "var(--fg)",
                    marginBottom: 8,
                  }}
                >
                  {c.cat}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--fg-muted)",
                    lineHeight: 1.55,
                    marginBottom: 16,
                  }}
                >
                  {c.why}
                </p>
                <div
                  className="mono-num"
                  style={{
                    fontSize: 12,
                    color: "var(--accent-deep)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Ticket: {c.ticket}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: 24,
              fontSize: 13,
              color: "var(--fg-muted)",
              maxWidth: "70ch",
            }}
          >
            ECM not on this list? We can still issue a term sheet via a partner
            ESCO routing channel. Contact us with the audit report and we’ll
            scope it.
          </p>
        </div>
      </section>

      {/* §03 SAMPLE TERM SHEET — what does a real one look like? */}
      <section id="sample-term-sheet" className="a-section">
        <SectionHead
          idx="03"
          kicker="SAMPLE TERM SHEET"
          title="What a real term sheet looks like."
          intro="Illustrative numbers from the HVAC Hotel seed deal. The actual term sheet you receive will pin to your audit + the live PINN forecast for your site."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 760 }}>
          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--bg-1)",
              padding: 28,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--fg-muted)",
                marginBottom: 4,
              }}
            >
              Non-binding indicative term sheet
            </div>
            <h3
              style={{
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: "var(--fg)",
                marginBottom: 18,
              }}
            >
              Bangalore 4-star hotel · chiller plant retrofit
            </h3>
            {[
              ["Facility amount", "$25,000 (₹20.8L)"],
              ["Tenor", "36 months"],
              ["Repayment", "Sculpted to monthly metered kWh savings"],
              ["Floor", "DSCR @ P5 ≥ 1.30× covenant"],
              ["Estimated APR (P50 path)", "11.5% blended"],
              ["Senior tranche LTV", "60% of P5 floor"],
              ["Junior tranche", "Absorbs first-loss (§5.5 underwriting policy)"],
              ["Collateral", "Assignment of metered kWh delta + personal guarantee from promoter"],
              ["Recourse", "Non-recourse to other business lines"],
              ["Disbursement", "USDC, milestone-gated to approved installer"],
              ["Repayment currency", "USDC (FX via NBFC partner for INR settlement)"],
              ["M&V cadence", "Monthly, IPMVP Option B (IoT meter-based)"],
              ["Default cure window", "90 days before recovery hierarchy triggers"],
            ].map(([k, v], i, arr) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i === arr.length - 1 ? "none" : "1px dashed var(--line)",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.04em",
                    color: "var(--fg-muted)",
                  }}
                >
                  {k}
                </span>
                <span
                  className="mono-num"
                  style={{
                    fontSize: 13,
                    color: "var(--fg)",
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: 22,
              fontSize: 12,
              color: "var(--fg-faint)",
              maxWidth: "70ch",
            }}
          >
            Illustrative only. Actual term sheets are issued post-audit and pin
            to your site’s calibrated forecast. Full policy:{" "}
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

      {/* §04 PROCESS — how do I get there? */}
      <section id="process" className="a-section">
        <SectionHead
          idx="04"
          kicker="THE PROCESS"
          title="From audit to first M&V tranche in five steps."
          intro="Every step is logged. Every step has a contractual SLA. The audit and the loan are the same artifact."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1100 }}>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {[
              {
                step: "00",
                title: "Audit + Forecast",
                window: "Day 0–10",
                body: "Site audit by a KISEM-affiliated engineer. Inputs feed our PINN underwriting model; output is a calibrated P5 / P50 / P95 savings distribution per ECM with a 90% conformal PI.",
              },
              {
                step: "01",
                title: "Term Sheet",
                window: "Day 10–14",
                body: "Term sheet auto-generated from the conformal band: facility size pinned to the P5 floor, tenor, sculpted amortization schedule, junior/senior split. Reviewed with the borrower; non-binding.",
              },
              {
                step: "02",
                title: "PO + Escrow",
                window: "Day 14–21",
                body: "Borrower selects an approved installer; PO issued. Funds escrow into the vault. Personal guarantee + GST consent flow executed. Loan documents assign the metered kWh delta to the SPV.",
              },
              {
                step: "03",
                title: "Install + Commission",
                window: "Day 21–35",
                body: "Equipment ships direct from approved installer. Commissioning under auditor supervision. IoT meters online from day one. Vendor paid in USDC against milestones.",
              },
              {
                step: "04",
                title: "M&V Tranches",
                window: "Month 1+",
                body: "Day-30 baseline reconciliation; monthly metered savings vs forecast. Repayment scales to realized kWh. Excess in good months pre-pays or accrues to a reserve.",
              },
            ].map((r, i, arr) => (
              <div
                key={r.step}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1.4fr",
                  gap: 28,
                  padding: "28px 0",
                  borderBottom:
                    i === arr.length - 1 ? "none" : "1px solid var(--line)",
                  alignItems: "start",
                }}
              >
                <div
                  className="num"
                  style={{
                    fontSize: 32,
                    color: "var(--fg-faint)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {r.step}
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>
                    {r.window}
                  </div>
                  <h4
                    style={{
                      fontSize: 20,
                      letterSpacing: "-0.02em",
                      fontWeight: 400,
                      margin: 0,
                      color: "var(--fg)",
                    }}
                  >
                    {r.title}
                  </h4>
                </div>
                <div
                  style={{ color: "var(--fg-muted)", fontSize: 13, lineHeight: 1.55 }}
                >
                  {r.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §05 AUDIT INTAKE — animated walkthrough + 12-audit credibility grid */}
      <section id="audit-intake" className="a-section">
        <SectionHead
          idx="05"
          kicker="AUDIT INTAKE"
          title="Your report. Our pipeline. One artifact."
          intro="An audit report is already the most expensive part of an MSME's pre-finance work. We don't re-do it — we ingest it. Here's what happens to your data the moment it lands."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1200 }}>
          <AuditIntakeFlow />
        </div>
      </section>

      {/* §06 PARALLEL FINANCING — why fast vs. your bank (closer argument) */}
      <section id="parallel-financing" className="a-section">
        <SectionHead
          idx="06"
          kicker="WHY FAST"
          title="Audit and underwriting collapse into one motion."
          intro="Legacy lenders ask the audit team the same question they then re-ask their analysts: how much will this site save? That serial dependency is why retrofits take 9–18 months. We run it as one motion."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div
            className="pf-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
          >
            <div
              style={{
                border: "1px solid var(--line)",
                background: "var(--bg-1)",
                padding: 22,
                borderRadius: 12,
              }}
            >
              <div
                className="label"
                style={{ color: "var(--fg-faint)", marginBottom: 14 }}
              >
                Legacy · serial process
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Month 0–2", "Hire energy auditor → audit report"],
                  ["Month 2–5", "Bank or ESCO re-underwrites the report from scratch"],
                  ["Month 5–8", "Loan committee review + approval"],
                  ["Month 8–12+", "PO, install, commission"],
                ].map(([when, what]) => (
                  <div
                    key={when}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "92px 1fr",
                      gap: 12,
                      alignItems: "baseline",
                    }}
                  >
                    <div
                      className="mono-num"
                      style={{
                        fontSize: 11,
                        color: "var(--fg-faint)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {when}
                    </div>
                    <div
                      style={{
                        height: 22,
                        background: "var(--fg-dim)",
                        padding: "3px 10px",
                        fontSize: 12,
                        color: "var(--fg)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {what}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                  fontSize: 13,
                  color: "var(--fg-muted)",
                }}
              >
                End-to-end:{" "}
                <span className="mono-num" style={{ color: "var(--fg)" }}>
                  9–18 months
                </span>
                . Most MSMEs drop out before signing.
              </div>
            </div>

            <div
              style={{
                border: "1px solid var(--accent)",
                background: "var(--accent-soft)",
                padding: 22,
                borderRadius: 12,
              }}
            >
              <div
                className="label"
                style={{ color: "var(--accent-deep)", marginBottom: 14 }}
              >
                Ascertainty · parallel process
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Week 0–2", "Site audit + meter ingest → calibrated forecast = the underwriting"],
                  ["Week 2–3", "Term sheet auto-generated from the conformal band"],
                  ["Week 3–4", "Funds escrowed; PO issued to approved installer"],
                  ["Week 4+", "Install, commission, IoT M&V live from day one"],
                ].map(([when, what]) => (
                  <div
                    key={when}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "92px 1fr",
                      gap: 12,
                      alignItems: "baseline",
                    }}
                  >
                    <div
                      className="mono-num"
                      style={{
                        fontSize: 11,
                        color: "var(--accent-deep)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {when}
                    </div>
                    <div
                      style={{
                        height: 22,
                        background: "var(--accent)",
                        padding: "3px 10px",
                        fontSize: 12,
                        color: "var(--accent-ink)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {what}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--accent)",
                  fontSize: 13,
                  color: "var(--accent-deep)",
                }}
              >
                End-to-end:{" "}
                <span className="mono-num" style={{ color: "var(--accent-deep)" }}>
                  4–6 weeks
                </span>
                . One workflow, one output, one signature.
              </div>
            </div>
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
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(36px, 6vw, 80px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              margin: "0 auto",
              maxWidth: "22ch",
              position: "relative",
            }}
          >
            The retrofit pays for itself,{" "}
            <span className="serif" style={{ color: "var(--accent)" }}>
              transparently
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
            <a className="a-btn a-btn--primary" href="mailto:borrowers@ascertainty.com">
              Start an application <span className="arrow">→</span>
            </a>
            <Link className="a-btn a-btn--ghost" href="/projects">
              See live deals
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
