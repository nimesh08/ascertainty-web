import type { Metadata } from "next";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SectionHead } from "@/components/landing/ascertainty/section-head";
import { RiskLayers } from "@/components/lenders/risk-layers";
import { CalibratedPIChart } from "@/components/lenders/calibrated-pi-chart";
import { LendersCalculator } from "@/components/lenders/lenders-calculator";

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
      {/* HERO — two-column: copy on the left, calibrated-PI chart on
          the right anchoring the "P5 floor" claim visually. */}
      <section className="a-hero a-hero--card">
        <div className="a-hero__bg" />
        <div
          className="shell"
          style={{ paddingTop: 56, paddingBottom: 56, position: "relative" }}
        >
          <div className="lenders-hero__grid">
            <div>
              <span className="a-kicker-pill">For lenders · LPs</span>
              <h1
                className="a-hero__heading"
                style={{
                  maxWidth: "14ch",
                  marginTop: 18,
                  fontSize: "clamp(38px, 5.6vw, 72px)",
                }}
              >
                Earn 10–14% yield on industrial efficiency credit, underwritten by{" "}
                <span className="accent">physics-informed AI</span>.
              </h1>
              <p className="a-hero__sub" style={{ maxWidth: "56ch", marginTop: 22 }}>
                Non-recourse loans to Indian MSME industrial retrofits, sized to
                the <strong className="a-hero__sub-em">P5 floor of a calibrated
                90% prediction interval</strong>. DSCR @ P5 ≥ 1.30× is a hard
                covenant. Distributions settle monthly in USDC.
              </p>
              <div className="a-hero__ctas" style={{ marginTop: 28 }}>
                <a className="a-btn a-btn--primary" href="mailto:lenders@ascertainty.com">
                  Apply for LP onboarding <span className="arrow">→</span>
                </a>
                <Link className="a-btn a-btn--ghost" href="/projects">
                  View data room
                </Link>
              </div>
            </div>
            <div className="lenders-hero__chart">
              <CalibratedPIChart />
            </div>
          </div>
        </div>
      </section>

      {/* WORKED EXAMPLE */}
      <section id="worked-example" className="a-section">
        <SectionHead
          idx="01"
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
                borderRadius: 12,
              }}
            >
              {/* Deal-specific distribution chart — visualises the
                  hotel deal's P5 / P50 / P95 with the actual DSCR */}
              <div style={{ marginBottom: 18, marginLeft: -10, marginRight: -10 }}>
                <CalibratedPIChart
                  p5Label="76.8k"
                  p50Label="124.5k"
                  p95Label="172k"
                  calloutText="DSCR @ P5 = 1.38×"
                  legendTitle="Hotel deal · 90% PI"
                  legendSub="grade B · senior + junior"
                  axisTitle="kWh savings / yr"
                  compact
                />
              </div>
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
          idx="02"
          kicker="RISK FRAMEWORK"
          title="Five layers between the LP and a loss."
          intro="P5 sizing handles the typical miss. These five layers handle everything beyond that."
        />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1100 }}
        >
          <RiskLayers />
          <div
            style={{
              marginTop: 20,
              fontSize: 12,
              color: "var(--fg-faint)",
            }}
          >
            <Link
              href="/docs/underwriting-policy"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Underwriting policy →
            </Link>
          </div>
        </div>
      </section>

      {/* INTERACTIVE — RUN THE NUMBERS */}
      <section id="calculator" className="a-section">
        <SectionHead
          idx="03"
          kicker="RUN THE NUMBERS"
          title="Your deposit, your tranche, your scenario."
          intro="Three sandboxes to feel the math: estimate yield on a deposit, weigh senior vs junior, and stress-test DSCR against realised savings."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1000 }}>
          <LendersCalculator />
        </div>
      </section>

      {/* LIQUIDITY & EXIT */}
      <section id="liquidity" className="a-section">
        <SectionHead
          idx="04"
          kicker="LIQUIDITY & EXIT"
          title="A clear path to secondary."
          intro="Today: primary subscription only. Three secondary-market upgrades on the roadmap."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1100 }}>
          <div className="liq-rail">
            <div className="liq-rail__track" aria-hidden />
            <div className="liq-rail__nodes">
              {[
                {
                  phase: "v0 — TODAY",
                  title: "Hold to maturity",
                  state: "shipped" as const,
                  lines: [
                    "Primary subscription only",
                    "1–7 yr tenor, fixed schedule",
                    "Cash-flow distributions in USDC",
                  ],
                },
                {
                  phase: "v1 — Q3 2026",
                  title: "Whitelisted OTC desk",
                  state: "in-flight" as const,
                  lines: [
                    "Underlying vault protocol wrapper",
                    "Daily NAV transparency",
                    "KYC enforced on transfer",
                  ],
                },
                {
                  phase: "v2 — Q1 2027",
                  title: "In-house orderbook",
                  state: "planned" as const,
                  lines: [
                    "20 bps fee per secondary trade",
                    "Cross-chain via Wormhole NTT",
                    "Triggers when AUM > $50M",
                  ],
                },
                {
                  phase: "v3 — senior TVL ≥ $1M",
                  title: "Queue-priority auctions",
                  state: "planned" as const,
                  lines: [
                    "FIFO redemption + auction priority bidding",
                    "Junior absorbs queue stress first (§5.5)",
                    "DePIN-credit QEV pattern, monthly USDC sweeps",
                  ],
                },
              ].map((p, i) => (
                <div
                  key={i}
                  className={`liq-rail__node liq-rail__node--${p.state}`}
                >
                  <div className="liq-rail__dot">
                    {p.state === "shipped" ? "✓" : p.state === "in-flight" ? "●" : ""}
                  </div>
                  <span className="liq-rail__phase">{p.phase}</span>
                  <h3 className="liq-rail__title">{p.title}</h3>
                  <ul className="liq-rail__list">
                    {p.lines.map((l, j) => (
                      <li key={j}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
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
            Yield on the energy transition,{" "}
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
            <a className="a-btn a-btn--primary" href="mailto:lenders@ascertainty.com">
              Apply for LP onboarding <span className="arrow">→</span>
            </a>
            <Link className="a-btn a-btn--ghost" href="/projects">
              View data room
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
