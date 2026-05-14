"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { MeterAnimation } from "@/components/landing/meter-animation";
import { SectionHead } from "@/components/landing/ascertainty/section-head";

export interface LandingStats {
  /** Best APY (%) across live projects. Null when none set. */
  bestApyPct?: number | null;
}

export function LandingClient({ stats }: { stats: LandingStats }) {
  const bestApy = stats.bestApyPct ?? 0;

  return (
    <>
      {/* HERO — framed-card pattern à la USD.AI: viewport-fitting tile with
          gutters + rounded corners so the section adapts cleanly to any
          browser chrome (bookmarks bar, full-screen, mobile address bar). */}
      <section className="a-hero a-hero--card">
        <div className="a-hero__bg" aria-hidden />
        <div className="shell a-hero__inner">
          <div>
            <Link href="/docs/underwriting-policy" className="a-hero__badge">
              <span className="a-hero__badge-dot" aria-hidden />
              <strong>Physics-informed underwriting</strong>
              <span className="a-hero__badge-sep" aria-hidden>·</span>
              <span className="a-hero__badge-sub">
                Calibrated uncertainty bounds disclosed per project
              </span>
              <span className="a-hero__badge-arrow" aria-hidden>→</span>
            </Link>
            <h1 className="a-hero__heading">
              Capital that <span className="accent">meters</span> itself.
            </h1>
            <p className="a-hero__sub">
              Non-recourse loans for industrial efficiency retrofits, underwritten by{" "}
              <strong className="a-hero__sub-em">physics-informed AI</strong> and
              verified by{" "}
              <span className="serif" style={{ color: "var(--accent)" }}>
                IoT meters
              </span>
              . Capital from{" "}
              <strong className="a-hero__sub-em">institutional LPs worldwide</strong>{" "}
              flows on-chain to{" "}
              <strong className="a-hero__sub-em">industrial SMEs</strong> across India
              and Southeast Asia, repaid from{" "}
              <strong className="a-hero__sub-em">the energy savings</strong> the upgrade
              generates.
            </p>
            <div className="a-hero__ctas">
              <Link className="a-btn a-btn--primary" href="/projects">
                Explore projects <span className="arrow">→</span>
              </Link>
              <Link className="a-btn a-btn--ghost" href="/portfolio">
                My portfolio
              </Link>
            </div>
            <div className="a-hero__meta">
              <div>
                <span className="label">Pilot region</span>
                <div className="val">India</div>
                <div className="a-hero__meta-foot">
                  Indonesia + SEA in v1
                </div>
              </div>
              <div>
                <span className="label">Min ticket</span>
                <div className="val num">$25K</div>
                <div className="a-hero__meta-foot">
                  Senior tranche
                </div>
              </div>
              <div>
                <span className="label">Target net APY</span>
                <div className="val num">
                  {bestApy > 0 ? `${bestApy}%` : "10–14%"}
                </div>
                <div className="a-hero__meta-foot">
                  Realized varies
                </div>
              </div>
              <div>
                <span className="label">Tenor</span>
                <div className="val num">1–7 yr</div>
                <div className="a-hero__meta-foot">
                  Sculpted amortization
                </div>
              </div>
            </div>
          </div>

          <div>
            <MeterAnimation />
          </div>
        </div>
      </section>

      {/* AUDIENCE TRIPTYCH */}
      <section id="01-who-its-for" className="a-section">
        <SectionHead
          idx="01"
          kicker="WHO IT'S FOR"
          title="One meter. Three views."
          intro="Every party reads from the same vault state and can verify every distribution down to the meter."
        />
        <div className="shell" style={{ paddingBottom: 0 }}>
          <div className="a-audience-grid">
            {/* 01 — LENDERS */}
            <Link href="/lenders" className="a-audience-card">
              <span className="a-kicker-pill">01 · Lenders · LPs</span>
              <h3 className="a-audience-card__title">
                Earn 10–14% yield on industrial efficiency credit.
              </h3>
              <p className="a-audience-card__desc">
                Non-recourse loans sized to the P5 floor of a calibrated 90%
                PI. DSCR @ P5 ≥ 1.30× hard covenant. Monthly USDC.
              </p>
              <svg
                className="a-audience-card__art aud-art--lenders"
                viewBox="0 0 160 100"
                fill="none"
                aria-hidden
              >
                <line x1="6" y1="82" x2="154" y2="82" stroke="#5fa67f" strokeWidth="0.75" opacity="0.35" />
                <line x1="6" y1="56" x2="154" y2="56" stroke="#5fa67f" strokeWidth="0.75" opacity="0.5" />
                <line x1="6" y1="30" x2="154" y2="30" stroke="#5fa67f" strokeWidth="0.75" opacity="0.35" />
                <path
                  className="curve"
                  d="M6 92 C 40 92, 60 18, 80 18 S 120 92, 154 92"
                  stroke="#5fa67f"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Brand-mark overlay: 3 nested arcs ascending to the triangle
                    peak. Proportions + stroke ratios match the real CoinMark
                    (22 / 16 / 12 px @ inner-scale 0.66, scaled by 0.239 here
                    so the bottom arc spans 44 units). Triangle peak lands on
                    (80,18) — the curve apex — simultaneously with the curve's
                    pen reaching that point. */}
                <path
                  className="logo-arc logo-arc-1"
                  pathLength="1"
                  d="M 58 62 A 22 10.5 0 0 1 102 62"
                  stroke="#5fa67f"
                  strokeWidth="5.3"
                  fill="none"
                />
                <path
                  className="logo-arc logo-arc-2"
                  pathLength="1"
                  d="M 65.7 47.6 A 14.3 7.7 0 0 1 94.3 47.6"
                  stroke="#5fa67f"
                  strokeWidth="3.8"
                  fill="none"
                />
                <path
                  className="logo-arc logo-arc-3"
                  pathLength="1"
                  d="M 71.6 35.7 A 8.4 4.3 0 0 1 88.4 35.7"
                  stroke="#5fa67f"
                  strokeWidth="2.9"
                  fill="none"
                />
                <path
                  className="logo-peak"
                  d="M 80 18 L 84.8 26.6 L 75.2 26.6 Z"
                  fill="#5fa67f"
                />
              </svg>
              <div className="a-audience-card__footer">
                <div className="a-audience-card__kpis">
                  <div>
                    <span className="label">Target APY</span>
                    <span className="num">
                      {bestApy > 0 ? `${bestApy}%` : "10–14%"}
                    </span>
                  </div>
                  <div>
                    <span className="label">Min ticket</span>
                    <span className="num">$25K</span>
                  </div>
                </div>
                <span className="a-audience-card__more">For lenders</span>
              </div>
            </Link>

            {/* 02 — BORROWERS */}
            <Link href="/borrowers" className="a-audience-card">
              <span className="a-kicker-pill">02 · MSME borrowers</span>
              <h3 className="a-audience-card__title">
                Upgrade your factory. Repay from the savings.
              </h3>
              <p className="a-audience-card__desc">
                4–6 weeks to close. Non-recourse to your business.
                ₹20L–₹100Cr facility sizes for vetted Indian MSMEs.
              </p>
              <svg
                className="a-audience-card__art aud-art--borrowers"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden
              >
                <circle cx="50" cy="50" r="38" stroke="#5fa67f" strokeWidth="0.75" opacity="0.5" />
                <circle cx="50" cy="50" r="30" stroke="#5fa67f" strokeWidth="0.5" opacity="0.3" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <line
                    key={deg}
                    x1="50"
                    y1="14"
                    x2="50"
                    y2="20"
                    stroke="#5fa67f"
                    strokeWidth="0.75"
                    opacity="0.6"
                    transform={`rotate(${deg} 50 50)`}
                  />
                ))}
                <line
                  className="needle"
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="22"
                  stroke="#5fa67f"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="3" fill="#5fa67f" />
              </svg>
              <div className="a-audience-card__footer">
                <div className="a-audience-card__kpis">
                  <div>
                    <span className="label">Time to close</span>
                    <span className="num">4–6 wk</span>
                  </div>
                  <div>
                    <span className="label">Recourse</span>
                    <span className="num">None</span>
                  </div>
                </div>
                <span className="a-audience-card__more">For borrowers</span>
              </div>
            </Link>

            {/* 03 — APPROACH */}
            <Link href="/approach" className="a-audience-card">
              <span className="a-kicker-pill">03 · Approach</span>
              <h3 className="a-audience-card__title">
                Every primitive auditable. Every prediction reproducible.
              </h3>
              <p className="a-audience-card__desc">
                Six primitives, one ledger. Vault custody on RWA rails;
                calibrated underwriting + IoT M&amp;V + audit-hash commits.
              </p>
              <svg
                className="a-audience-card__art aud-art--approach"
                viewBox="0 0 160 100"
                fill="none"
                aria-hidden
              >
                <polygon
                  className="hex"
                  points="40,16 60,28 60,52 40,64 20,52 20,28"
                  stroke="#5fa67f"
                  strokeWidth="1"
                  fill="none"
                />
                <polygon
                  className="hex"
                  points="80,40 100,52 100,76 80,88 60,76 60,52"
                  stroke="#5fa67f"
                  strokeWidth="1"
                  fill="none"
                />
                <polygon
                  className="hex"
                  points="120,16 140,28 140,52 120,64 100,52 100,28"
                  stroke="#5fa67f"
                  strokeWidth="1"
                  fill="none"
                />
                <line x1="40" y1="40" x2="80" y2="64" stroke="#5fa67f" strokeWidth="0.5" opacity="0.4" />
                <line x1="120" y1="40" x2="80" y2="64" stroke="#5fa67f" strokeWidth="0.5" opacity="0.4" />
              </svg>
              <div className="a-audience-card__footer">
                <div className="a-audience-card__kpis">
                  <div>
                    <span className="label">Model R²</span>
                    <span className="num">+0.56</span>
                  </div>
                  <div>
                    <span className="label">90% PI</span>
                    <span className="num">±69k kWh</span>
                  </div>
                </div>
                <span className="a-audience-card__more">How it works</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* BANKABLE COLLATERAL — the transformation that makes the loan possible.
          Answers the "what's the collateral?" question every credit reviewer asks
          first. Sets up §02.5 WORKED EXAMPLE which then shows the math in action. */}
      <section id="02-bankable-collateral" className="a-section">
        <SectionHead
          idx="02"
          kicker="BANKABLE COLLATERAL"
          title="A raw promise turns into a financial instrument."
          intro="Energy savings are not collateral by default — they're a promise. Four steps turn them into something a lender can underwrite."
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
                body: "Day-30 reconciliation by a KISEM-affiliated auditor today. Continuous IoT M&V via IPMVP Option B on the roadmap. Every prediction’s sha256 commits to a Solana Memo so the audit trail is tamper-evident.",
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
                <div className="bc-arrow" aria-hidden>
                  &rarr;
                </div>
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

      {/* BENCHMARKS — verifiable accuracy claims */}
      <section id="03-benchmarks" className="a-section">
        <SectionHead
          idx="03"
          kicker="BENCHMARKS"
          title="Calibrated, not just confident."
          intro="Our underwriting model produces a calibrated 90% confidence interval — meaning the P5 lower bound is honest, not an LLM hallucination. Numbers below come from leave-one-out cross-validation on the 72-ECM KISEM corpus after pretraining on 14,000 real US-DOE IAC industrial audits. The TabPFN in-context model achieves R² 0.56 with a distribution-free 90% PI; reproduction script below."
        />
        <div className="shell" style={{ paddingBottom: 56 }}>
          <div className="bench-grid" style={{ marginTop: 32 }}>
            <table className="a-tbl">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>R² (LOO)</th>
                  <th>MAPE-median</th>
                  <th>90% CI coverage</th>
                  <th>Verdict</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sector-median ratio (heuristic)</td>
                  <td>0.16</td>
                  <td>41.7%</td>
                  <td>—</td>
                  <td><span className="bench-verdict bench-verdict--ok">Decent</span></td>
                  <td>What unaided underwriters do today</td>
                </tr>
                <tr>
                  <td>BEE physics formula (industry default)</td>
                  <td>0.50</td>
                  <td>37.5%</td>
                  <td>—</td>
                  <td><span className="bench-verdict bench-verdict--good">Good</span></td>
                  <td>Leakage-known compressed-air only</td>
                </tr>
                <tr>
                  <td>Ascertainty PINN (physics-head)</td>
                  <td>−0.07</td>
                  <td>42.3%</td>
                  <td>88% (native σ-scaling)</td>
                  <td><span className="bench-verdict bench-verdict--bad">Worse than guessing</span></td>
                  <td>Physics-informed neural net, KISEM-only</td>
                </tr>
                <tr>
                  <td>Ascertainty CatBoost</td>
                  <td>+0.28</td>
                  <td>44.7%</td>
                  <td>±67,679 kWh (split-conformal)</td>
                  <td><span className="bench-verdict bench-verdict--ok">Decent</span></td>
                  <td>IAC pretrain + KISEM finetune, deployed</td>
                </tr>
                <tr style={{ background: "rgba(16,185,129,0.06)" }}>
                  <td><b>Ascertainty TabPFN (this product)</b></td>
                  <td><b>+0.56</b></td>
                  <td><b>41.6%</b></td>
                  <td><b>±69,254 kWh (split-conformal)</b></td>
                  <td><b><span className="bench-verdict bench-verdict--good">Good — within SOTA band</span></b></td>
                  <td><b>TabPFN in-context on IAC + KISEM. Hollmann et al., <i>Nature</i> 2025.</b></td>
                </tr>
              </tbody>
            </table>

            <details className="bench-explainer">
              <summary>
                <span className="bench-explainer__chevron">▸</span>
                <span>What do R², MAPE-median, and 90% CI coverage mean?</span>
              </summary>
              <div className="bench-explainer__body">
                <div className="bench-explainer__metric">
                  <h4>R² · &quot;How much of the variation does the model explain?&quot;</h4>
                  <ul>
                    <li><b>+1.0</b> = perfect prediction every time</li>
                    <li><b>0.0</b> = no better than always guessing the average</li>
                    <li><b>Negative</b> = worse than guessing the average — the model is actively misleading</li>
                  </ul>
                  <div className="bench-explainer__scale">
                    <span className="bench-verdict bench-verdict--bad">&lt; 0</span>
                    <span className="bench-verdict bench-verdict--ok">0 – 0.3</span>
                    <span className="bench-verdict bench-verdict--good">0.3 – 0.7 (SOTA band)</span>
                    <span className="bench-verdict bench-verdict--great">&gt; 0.7 (paper-grade)</span>
                  </div>
                  <p className="bench-explainer__context">
                    Industrial energy savings prediction papers (ORNL 2025 IAC analyses) report
                    R²=0.5–0.7. Residential-building papers with 10k+ rows reach 0.87 (Pampuri et al.,
                    Riga). Our TabPFN sits inside the industrial SOTA band with ~50× less
                    training data, thanks to the foundation-model pretraining.
                  </p>
                </div>

                <div className="bench-explainer__metric">
                  <h4>MAPE-median · &quot;For a typical prediction, how far off is it (%)?&quot;</h4>
                  <ul>
                    <li><b>0%</b> = perfect</li>
                    <li><b>10–20%</b> = excellent (rare on small data)</li>
                    <li><b>20–40%</b> = good for lender debt-sizing with a P5 floor</li>
                    <li><b>&gt;60%</b> = bad — don&apos;t underwrite from it alone</li>
                  </ul>
                  <p className="bench-explainer__context">
                    Example: with our 41.6% MAPE-median, a 100,000 kWh prediction has a typical actual
                    falling in the 60–140k range. That&apos;s why we never underwrite to the point estimate —
                    we underwrite to the P5 lower bound (the conformal-calibrated floor).
                  </p>
                </div>

                <div className="bench-explainer__metric">
                  <h4>90% CI coverage · &quot;Is the uncertainty band honest?&quot;</h4>
                  <ul>
                    <li>Model claims: &quot;the real number is between X and Y with 90% confidence&quot;</li>
                    <li>If reality lands inside [X, Y] <b>~90% of the time</b> → calibrated ✓</li>
                    <li>If &lt;90% → overconfident (dangerous for lenders)</li>
                    <li>If &gt;90% → bands too wide (safe but leaves money on the table)</li>
                  </ul>
                  <p className="bench-explainer__context">
                    Split-conformal prediction (MAPIE 1.4) gives a <b>statistical guarantee</b> of
                    coverage — not an estimate, a mathematical proof under the exchangeability
                    assumption. That&apos;s the strongest claim in tabular ML right now, and the reason
                    lenders can size debt against our P5 floor.
                  </p>
                </div>

                <div className="bench-explainer__metric">
                  <h4>Why R² matters more than MAPE for underwriting</h4>
                  <p>
                    A model can have low MAPE on individual predictions but high R² because it picks up
                    the <em>direction</em> of variation across deals — &quot;this one will save much
                    more than the average, that one less.&quot; That&apos;s exactly what a lender needs
                    when sizing a portfolio. MAPE-median on a single deal is secondary; the calibrated
                    P5 floor is what governs the loan amount.
                  </p>
                </div>
              </div>
            </details>
            <p style={{ marginTop: 16, fontSize: 12, color: "var(--fg-muted)" }}>
              Backbone = TabPFN (Hollmann et al., <i>Nature</i> 2025) — a pretrained
              transformer that performs in-context tabular regression. Pretrained on ~130M
              synthetic priors, conditioned at inference on the US Department of Energy
              Industrial Assessment Center database (14,000 implemented recommendations with
              client-reported realized savings, 1981–2024) plus our Indian KISEM 72-ECM cohort.
              Split-conformal prediction (MAPIE 1.4) gives a distribution-free 90% PI of
              ±69,254 kWh/yr, derived from leave-one-out residuals on the KISEM hold-outs.
              <br /><br />
              <b>Caveat — important for lenders:</b> IAC's "realized savings" is client-reported
              at 6–9 month phone follow-up, not metered M&V. Our own metered M&V loop closes the
              gap post-deployment via IPMVP Option B telemetry.
            </p>

            <details className="bench-explainer">
              <summary>
                <span className="bench-explainer__chevron">▸</span>
                <span>Why TabPFN is the benchmark headline, not the serving model — yet</span>
              </summary>
              <div className="bench-explainer__body">
                <div className="bench-explainer__metric">
                  <h4>Two models, two roles, on purpose</h4>
                  <ul>
                    <li>
                      <b>TabPFN — headline benchmark.</b> R²=+0.56 LOO on a 6-feature
                      corpus (baseline_kwh, sector, equipment_type, arc_group, source,
                      log_baseline). That&apos;s the headline number above. It proves that
                      a foundation-model approach generalises out-of-distribution from a
                      tiny Indian audit set when conditioned on 14k IAC rows.
                    </li>
                    <li>
                      <b>PINN unified — what serves live underwriting.</b> Trained on
                      the same 72-ECM KISEM corpus but ingests all 21 fields the auditor
                      actually collects (leakage_pct, rated_kw, hours/days, motor count,
                      plant context). On a small ECM where TabPFN would output a P5 near
                      zero from the 6-feature blur, the PINN delivers a usable lender-grade
                      band because it sees the richer audit signal.
                    </li>
                  </ul>
                  <p className="bench-explainer__context">
                    <b style={{ color: "var(--fg)" }}>Next iteration:</b> retrain TabPFN
                    on the full 21-feature audit schema, validate per-sample bands no
                    longer floor at zero for small ECMs, then flip the serving default.
                    The headline number is preserved; the moat (the audit signal that only
                    Ascertainty collects) becomes part of the model both at benchmark and
                    at serve time.
                  </p>
                  <p className="bench-explainer__context">
                    <b style={{ color: "var(--fg)" }}>What this means today:</b> every
                    project page on this site says &quot;Underwritten by PINN
                    unified&quot; because that&apos;s the model actually sizing the loan.
                    The TabPFN R²=+0.56 claim above is honest — it&apos;s the LOO score on
                    the corpus it was trained on, not a claim about live serving.
                  </p>
                </div>
              </div>
            </details>

            <div className="bench-snippet" style={{ marginTop: 28 }}>
              <pre className="a-code">
                <code>{`# Reproduce the Ascertainty PINN prediction for the Veejay
# compressed-air leakage example (LOO held-out, real audit):

curl -s https://inference.ascertainty.com/v1/predict \\
  -H 'content-type: application/json' \\
  -d '{
    "equipment_type": "compressed_air",
    "ecm_category": "compressed_air_leakage",
    "industry_sector": "textiles",
    "baseline_kwh_per_year": 322623,
    "compressor_rated_kw": 45,
    "leakage_pct": 42
  }' | jq

# {
#   "predicted_savings_kwh": 119913,
#   "savings_lower_p5_kwh":   29161,   <- P5 floor used for debt sizing
#   "savings_upper_p95_kwh": 210665,
#   "sigma_scale_applied":     2.82,
#   "model_used":  "exira_pinn_compressed_air_v1",
#   "confidence_grade": "C"
# }`}</code>
              </pre>
              <p style={{ marginTop: 12, fontSize: 12, color: "var(--fg-muted)" }}>
                Don&apos;t take our word for it — try the endpoint yourself. A Colab notebook
                that runs the same LOO-CV reproduction is{" "}
                <span style={{ color: "var(--accent)", borderBottom: "1px dashed var(--accent)" }}>
                  coming soon
                </span>{" "}
                (releases with the IAC pretraining update).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITION — why no one else does this. 3-column comparison vs Banks
          and ESCOs. Sets up the moat slides below by showing the empty quadrant. */}
      <section id="04-competition" className="a-section">
        <SectionHead
          idx="04"
          kicker="COMPETITION"
          title="Three industries try to serve this market. None can."
          intro="Banks won’t lend without salvage. ESCOs only serve $5M+ enterprises. The SME industrial-retrofit gap is structural, not accidental."
        />
        <div className="shell" style={{ paddingTop: 32, paddingBottom: 80 }}>
          <div className="cmp-tbl-wrap">
            <table className="cmp-tbl">
              <thead>
                <tr>
                  <th></th>
                  <th>Banks</th>
                  <th>ESCOs <span className="cmp-tbl__sub">(Johnson Controls, Trane, Honeywell)</span></th>
                  <th className="cmp-tbl__us">Ascertainty</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Min ticket", "$1M+", "$5–10M+", "$25K"],
                  ["Borrower credit required", "Strong balance sheet", "Investment-grade", "None (non-recourse)"],
                  ["Time to close", "6+ months", "12–24 months", "4–6 weeks"],
                  ["Underwriting transparency", "Internal model", "Black box", "Calibrated PINN + on-chain audit hash"],
                  ["Loan structure", "Full recourse", "ESPC corporate guarantee", "Non-recourse"],
                  ["SME-accessible", "✗", "✗", "✓"],
                  ["Geography", "OECD", "US + select EU", "India · SEA · expanding"],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="cmp-tbl__row-label">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td className="cmp-tbl__us">{row[3]}</td>
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
            ESCOs are the 1980s answer to “how do you finance industrial efficiency
            when you can’t underwrite savings?” Their answer: don’t — wrap savings
            in a corporate guarantee, charge enterprise customers a fat margin,
            stay out of the SME market entirely. Ascertainty is the 2026 answer:
            actually underwrite the savings using physics-informed AI.{" "}
            <strong style={{ color: "var(--fg)" }}>
              Same risk profile for the borrower (non-recourse + sculpted
              amortization), 10× bigger addressable market, 1/4 the friction.
            </strong>
          </p>
        </div>
      </section>

      {/* FAQ — three teasers + link to the full FAQ in /docs/faq */}
      <section id="05-faq" className="a-section">
        <SectionHead idx="05" kicker="FAQ" title="Answers." />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}
        >
          <Accordion type="single" collapsible>
            {[
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
            ].map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                style={{ borderBottom: "1px solid var(--line)" }}
              >
                <AccordionTrigger
                  className="text-base"
                  style={{ textTransform: "none", letterSpacing: 0 }}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent style={{ color: "var(--fg-muted)" }}>
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Link
            href="/docs/faq"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 22,
              fontSize: 12.5,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Full FAQ — lender · borrower · credit reviewer{" "}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* MOAT — why this is hard to copy */}
      <section id="06-moat" className="a-section">
        <SectionHead
          idx="06"
          kicker="MOAT"
          title="What stops a copycat."
          intro="Five reinforcing edges. The first is relational and copyable in 18 months. The second compounds with every loan we close. The third is a coordination problem no single counterparty wants to own. The fourth is the structural advantage over every other on-chain credit protocol: our underwriting is verifiable from a curl, not an expert's reputation. The fifth is the market itself — banks won't touch retrofits because the salvage leg is too weak, which is exactly why the gap exists and exactly why only a calibrated model can fill it."
        />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1100 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                num: "01",
                title: "KISEM funnel",
                lead: "Top-of-funnel cost ≈ ₹0",
                body: "Proprietary access to ~600 BEE/KISEM-audited MSMEs/year via IIT-Madras partnership. The 12 audits already in our corpus took a competitor 18 months to duplicate.",
                kind: "relational",
              },
              {
                num: "02",
                title: "PINN data flywheel",
                lead: "σ tightens with portfolio scale",
                body: "Every realized M&V data point recalibrates per-category σ-scales. After 50 loans our P5 is meaningfully tighter than a competitor with 5 — meaning we can price more competitively, win more deals, generate more data.",
                kind: "compounding",
              },
              {
                num: "03",
                title: "Coordination edge",
                lead: "7 capabilities in rare combination",
                body: "Auditor relationship + ML/physics underwriting + tokenization rails + Singapore-Asia regulatory wrappers + LP onboarding + NBFC INR disbursement + IoT M&V. Each individually doable; assembling all seven in parallel is the moat.",
                kind: "structural",
              },
              {
                num: "04",
                title: "Verifiable underwriting",
                lead: "calibrated model, not human curators",
                body: "Every other on-chain credit protocol underwrites via 'trust our independent experts' — a marketing claim, not a verifiable system. Ascertainty's underwriting is a calibrated ML model with a published 90% conformal PI (R²=+0.56 LOO, verifiable on /v1/health from a curl). DSCR @ P5 ≥ 1.30× is a quantitative covenant a lender writes into the contract. Reconciliation against realized Day-30 metered savings is mechanical. A future release commits a sha256 of every prediction's (inputs, outputs, git_commit) to a Solana Memo, making the audit trail tamper-evident on-chain.",
                kind: "verifiability",
              },
              {
                num: "05",
                title: "Weak-salvage market",
                lead: "the difficulty IS the moat",
                body: "A $500K compressed-air retrofit resells for ~$50K post-default — about 10% recovery. The same $500K of GPUs resells for ~$300K — about 60%. Retrofit equipment is custom-fitted to a specific factory's pipework; uninstallation often costs more than resale; the secondary market for used VFDs, chillers, and heat-exchangers is thin. A non-recourse loan needs two legs: salvage value (sell the asset) and cash flow (income the asset generates). Banks rely on the salvage leg, so they won't touch retrofits. We have only the cash-flow leg — but it's a leg only a calibrated physics model can build. Anyone with a balance sheet can compete in GPU credit. Nobody can compete here without our underwriting tech.",
                kind: "structural",
              },
            ].map((p) => (
              <div
                key={p.num}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--bg-1)",
                  padding: 20,
                  position: "relative",
                  minHeight: 260,
                }}
              >
                <span
                  className="label"
                  style={{
                    color: "var(--fg-faint)",
                    fontSize: 10,
                  }}
                >
                  M / {p.num}
                </span>
                <h3
                  style={{
                    fontSize: 20,
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
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 14,
                    fontSize: 10,
                    color: "var(--fg-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {p.kind} moat
                </div>
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
            The KISEM relationship gets us the wedge. The PINN flywheel turns the
            wedge into a durable position. The coordination edge keeps any
            single-discipline team from collapsing the gap.{" "}
            <Link
              href="/docs/underwriting-policy"
              style={{
                color: "var(--fg-muted)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Read the underwriting policy ↗
            </Link>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="a-section">
        <div
          className="shell"
          style={{
            padding: "120px 0 140px",
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
          <span className="label">
            // STOP LETTING MSMEs STAY LOCKED OUT
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(40px, 7vw, 96px)",
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              margin: "22px auto 0",
              maxWidth: "20ch",
              position: "relative",
            }}
          >
            On-chain capital,{" "}
            <span className="serif" style={{ color: "var(--accent)" }}>
              verified
            </span>{" "}
            down to the kilowatt-hour.
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
              Explore projects <span className="arrow">→</span>
            </Link>
            <Link className="a-btn a-btn--ghost" href="/pools">
              Browse pools
            </Link>
            <Link
              href="/docs/underwriting-policy"
              style={{
                alignSelf: "center",
                fontSize: 12,
                color: "var(--fg-muted)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Underwriting Policy ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
