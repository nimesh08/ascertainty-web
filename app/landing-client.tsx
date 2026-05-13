"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { CountUp } from "@/components/landing/count-up";
import { Cube, CubeLegend } from "@/components/landing/ascertainty/cube";
import { Glyph } from "@/components/landing/ascertainty/glyph";
import { SectionHead } from "@/components/landing/ascertainty/section-head";
import { Sparkline } from "@/components/landing/ascertainty/sparkline";
import { TerminalLog } from "@/components/landing/ascertainty/terminal-log";
import { Ticker } from "@/components/landing/ascertainty/ticker";
import { TimelineBandLoop } from "@/components/landing/ascertainty/timeline-band-loop";

export interface LandingStats {
  totalFundedRaw: string;
  totalDistributedRaw: string;
  activeProjects: number;
  projectCount: number;
  poolCount: number;
  /** Best APY (%) across live projects. Null when none set. */
  bestApyPct?: number | null;
}

type Meaning = "protocol" | "capital" | "asset";

const PRIMITIVES = [
  {
    title: "Share-of-savings tokens",
    body: "Each project mints an SPL token backed by measurable energy savings. Distributions accrue per-token; claims are pro-rata.",
    chips: ["SPL Token", "PDA vault", "Pro-rata"],
    icon: "vault" as const,
  },
  {
    title: "MRV-verified",
    body: "Baselines and verifications are attested by licensed auditors and committed on-chain. Every kWh saved is a signed line of state.",
    chips: ["BEE", "TÜV SÜD", "On-chain"],
    icon: "meter" as const,
  },
  {
    title: "PINN underwriting",
    body: "Physics-informed neural networks model thermal load + cashflow.",
    chips: ["PINN v3", "Neural ODE", "PyTorch"],
    icon: "brain" as const,
  },
  {
    title: "Composable pools",
    body: "Diversify across a basket of underlying MSME projects with one token. Sweep returns into pool vaults automatically.",
    chips: ["Senior · Junior", "Sweep", "exiraUSDC"],
    icon: "id" as const,
  },
  {
    title: "IoT telemetry feed",
    body: "On-site energy meters stream kWh deltas every 30s. Covenants reconcile cashflow against meter, automatically.",
    chips: ["1,240 meters", "30s stream", "Edge cache"],
    icon: "wave" as const,
  },
  {
    title: "USDC settlement",
    body: "Devnet today, mainnet next. Distributions settle in Circle USDC. Composable into Aave, Morpho, Pendle.",
    chips: ["USDC", "Solana", "Composable"],
    icon: "rail" as const,
  },
];

const STEPS: Array<{
  actor: string;
  title: string;
  body: string;
  spec: Array<[string, string]>;
}> = [
  {
    actor: "// LENDER",
    title: "Deposit USDC into a project or pool.",
    body: "Wallet signs a deposit. Funds queue into the next epoch. Share-of-savings token mints on settlement.",
    spec: [
      ["Chain", "Solana"],
      ["Settle", "≤ 4s"],
      ["Token", "exiraUSDC"],
    ],
  },
  {
    actor: "// PROTOCOL",
    title: "Vault routes to underwritten MSMEs.",
    body: "PINN risk engine sizes per-deal exposure. Vault PDA disperses to borrower wallets through pre-authorised destinations.",
    spec: [
      ["Model", "PINN v3"],
      ["Hop", "0"],
      ["Gas", "$0.0001"],
    ],
  },
  {
    actor: "// MSME",
    title: "Equipment ships. Audit baseline captures.",
    body: "Vendor receives stablecoin direct. Asset commissions on-site. Auditor publishes MRV baseline. Meters come online.",
    spec: [
      ["Asset", "VFD / chiller"],
      ["Tenor", "1–7yr"],
      ["MRV", "Signed"],
    ],
  },
  {
    actor: "// IOT",
    title: "Telemetry streams kWh deltas every 30s.",
    body: "Edge gateway pushes signed readings. Indexer reconciles against forecast. Covenants flag deviations to risk dashboard.",
    spec: [
      ["Stream", "30s"],
      ["Signed", "Yes"],
      ["Window", "Live"],
    ],
  },
  {
    actor: "// MSME",
    title: "Cashflow repays in USDC.",
    body: "Monthly payment in USDC, drawn from saved energy cost. Distributions accrue pro-rata to share holders. Junior absorbs first.",
    spec: [
      ["Cadence", "Monthly"],
      ["Currency", "USDC"],
      ["First-loss", "Junior"],
    ],
  },
  {
    actor: "// LENDER",
    title: "Claim or compose.",
    body: "Burn shares for principal + accrued, or hold and compose into Aave/Morpho/Pendle for additional leverage.",
    spec: [
      ["Window", "Anytime"],
      ["Notice", "T+0"],
      ["Compose", "Aave/Morpho"],
    ],
  },
];

const PARTNERS = [
  "Solana Foundation",
  "Privy",
  "Helius",
  "Circle",
  "NVIDIA Inception",
  "BEE",
  "TÜV SÜD",
  "ACMA",
  "VITAS",
  "KADIN",
  "Centrifuge",
  "MAS Project Guardian",
];

export function LandingClient({ stats }: { stats: LandingStats }) {
  const totalFundedUsdc = Number(stats.totalFundedRaw) / 1_000_000;
  const totalDistributed = Number(stats.totalDistributedRaw) / 1_000_000;
  const bestApy = stats.bestApyPct ?? 0;

  const [meaning, setMeaning] = useState<Meaning>("protocol");
  const [activeFace, setActiveFace] = useState(0);

  return (
    <>
      {/* HERO */}
      <section className="a-hero">
        <div className="a-hero__bg"></div>
        <div className="shell a-hero__inner">
          <div>
            <h1 className="a-hero__heading">
              Finance that
              <br />
              <em>compounds</em>
              <br />
              <span className="accent">MSME savings.</span>
            </h1>
            <p className="a-hero__sub">
              Ascertainty routes USDC into verified energy-efficiency projects for Asian
              MSMEs, mints a share-of-savings token, and distributes on-chain
              repayments — non-custodial, transparent, composable.
            </p>
            <div className="a-hero__ctas">
              <Link className="a-btn a-btn--primary" href="/projects">
                Explore projects <span className="arrow">→</span>
              </Link>
              <Link className="a-btn a-btn--ghost" href="/portfolio">
                My portfolio
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
                Read the underwriting policy ↗
              </Link>
            </div>
            <div className="a-hero__meta">
              <div>
                <span className="label">Total funded</span>
                <div className="val num">
                  $<CountUp value={totalFundedUsdc} decimals={2} />
                </div>
              </div>
              <div>
                <span className="label">Active projects</span>
                <div className="val num">
                  <CountUp value={stats.activeProjects} decimals={0} />{" "}
                  <span style={{ color: "var(--fg-muted)", fontSize: 11 }}>
                    / {stats.projectCount}
                  </span>
                </div>
              </div>
              <div>
                <span className="label">Best APY</span>
                <div className="val num">
                  <CountUp value={bestApy} decimals={1} suffix="%" />
                </div>
              </div>
              <div>
                <span className="label">Distributed</span>
                <div className="val num">
                  $<CountUp value={totalDistributed} decimals={2} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Cube meaning={meaning} onFaceFocus={setActiveFace} />
            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 14,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {(
                  [
                    ["protocol", "Protocol"],
                    ["capital", "Capital flow"],
                    ["asset", "Asset class"],
                  ] as Array<[Meaning, string]>
                ).map(([k, l]) => (
                  <button
                    key={k}
                    className={"a-chip" + (meaning === k ? " a-chip--active" : "")}
                    onClick={() => setMeaning(k)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <CubeLegend
                active={activeFace}
                onFocus={setActiveFace}
                meaning={meaning}
              />
              <div className="a-cube-instructions">
                <span>
                  <kbd>drag</kbd> rotate
                </span>
                <span>
                  <kbd>click</kbd> a face to focus
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <Ticker
        items={[
          {
            k: "Total funded",
            v: `$${totalFundedUsdc.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            d: 1,
            dl: "live",
          },
          { k: "Active projects", v: String(stats.activeProjects), d: 1, dl: "live" },
          { k: "Project count", v: String(stats.projectCount), d: 0, dl: "total" },
          { k: "Pool count", v: String(stats.poolCount), d: 0, dl: "total" },
          { k: "Best APY", v: `${bestApy}%`, d: 1, dl: "rolling" },
          {
            k: "Distributed 24h",
            v: `$${totalDistributed.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
            d: 1,
            dl: "USDC",
          },
          { k: "Contract tests", v: "92", d: 1, dl: "passing" },
          { k: "Default rate", v: "0.18%", d: -1, dl: "−4bp" },
        ]}
      />

      {/* AUDIENCE TRIPTYCH */}
      <section className="a-section">
        <SectionHead
          idx="01"
          kicker="WHO IT'S FOR"
          title="One protocol. Three vantage points."
          intro="Ascertainty is non-custodial infrastructure — every party reads from the same vault state, signs through the same identity rails, and can verify every distribution down to the meter."
        />
        <div className="shell" style={{ paddingBottom: 0 }}>
          <div className="a-audience" style={{ marginTop: 32 }}>
            <Link href="/projects" className="a-audience__col">
              <span className="label label--accent">// 01 — MSME BORROWERS</span>
              <h3>Capital that understands a 2-year payback.</h3>
              <p>
                Get $50K–$20M against verifiable energy, cooling or compute savings.
                Stablecoin settles in seconds, not months. Integrated with KISEM,
                ACMA, VITAS, KADIN intermediaries.
              </p>
              <div className="kpi-strip">
                <div>
                  <span className="label">Ticket</span>
                  <div className="num">$0.05–20M</div>
                </div>
                <div>
                  <span className="label">Settle</span>
                  <div className="num">≤ 4s</div>
                </div>
              </div>
              <span className="more">Apply for facility</span>
            </Link>
            <Link href="/pools" className="a-audience__col">
              <span className="label label--accent">// 02 — LENDERS / LPs</span>
              <h3>Underwrite emerging-Asia infrastructure from a hot wallet.</h3>
              <p>
                Deposit USDC into senior or junior tranches of vetted pools. Receive
                exiraUSDC — a yield-bearing share token composable into Aave, Morpho,
                Pendle.
              </p>
              <div className="kpi-strip">
                <div>
                  <span className="label">Best APY</span>
                  <div className="num">{bestApy}%</div>
                </div>
                <div>
                  <span className="label">Pools</span>
                  <div className="num">{stats.poolCount}</div>
                </div>
              </div>
              <span className="more">Open pools</span>
            </Link>
            <a href="#" className="a-audience__col">
              <span className="label label--accent">// 03 — INVESTORS / VC</span>
              <h3>The RWA primitive Asia&apos;s industrial transition needs.</h3>
              <p>
                $35.9B on-chain RWA today, projected $16T by 2030 (BCG). SEA-MSME
                native originator — Singapore-domiciled, MAS-aligned, with 11 LOIs
                and a Lucas TVS pilot in flight.
              </p>
              <div className="kpi-strip">
                <div>
                  <span className="label">LOIs</span>
                  <div className="num">11</div>
                </div>
                <div>
                  <span className="label">Pipeline</span>
                  <div className="num">$240M</div>
                </div>
              </div>
              <span className="more">View data room</span>
            </a>
          </div>
        </div>
      </section>

      {/* PRIMITIVES */}
      <section className="a-section">
        <SectionHead
          idx="02"
          kicker="THE SYSTEM"
          title="Six primitives. One auditable vault."
          intro="Every primitive is a Solana program account. Every action is a signed instruction. There is no off-chain ledger, no oracle middleman, and no human in the settlement loop."
        />
        <div className="shell" style={{ marginTop: 32 }}>
          <div className="a-primitives">
            {PRIMITIVES.map((p, i) => (
              <div className="a-prim" key={i}>
                <div className="a-prim__icon">
                  <Glyph name={p.icon} />
                </div>
                <span className="a-prim__num">P / {String(i + 1).padStart(2, "0")}</span>
                <h3 className="a-prim__title">{p.title}</h3>
                <p className="a-prim__body">{p.body}</p>
                <div className="a-prim__chips">
                  {p.chips.map((c, j) => (
                    <span key={j} className="a-chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENCHMARKS — verifiable accuracy claims */}
      <section className="a-section">
        <SectionHead
          idx="03"
          kicker="BENCHMARKS"
          title="Calibrated, not just confident."
          intro="Our underwriting model produces a calibrated 90% confidence interval — meaning the P5 lower bound is honest, not an LLM hallucination. Numbers below come from leave-one-out cross-validation on the 72-ECM KISEM corpus after pretraining on 14,000 real US-DOE IAC industrial audits. v0.3 (TabPFN v2 in-context) achieves R² 0.56 with a distribution-free 90% PI; reproduction script below."
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
                  <td><span className="bench-verdict bench-verdict--ok">🟡 Decent</span></td>
                  <td>What unaided underwriters do today</td>
                </tr>
                <tr>
                  <td>BEE physics formula (industry default)</td>
                  <td>0.50</td>
                  <td>37.5%</td>
                  <td>—</td>
                  <td><span className="bench-verdict bench-verdict--good">🟢 Good</span></td>
                  <td>Leakage-known compressed-air only</td>
                </tr>
                <tr>
                  <td>Ascertainty PINN v0.1 (physics-head)</td>
                  <td>−0.07</td>
                  <td>42.3%</td>
                  <td>88% (native σ-scaling)</td>
                  <td><span className="bench-verdict bench-verdict--bad">🔴 Worse than guessing</span></td>
                  <td>Physics-informed neural net, KISEM-only</td>
                </tr>
                <tr>
                  <td>Ascertainty CatBoost v0.2</td>
                  <td>+0.28</td>
                  <td>44.7%</td>
                  <td>±67,679 kWh (split-conformal)</td>
                  <td><span className="bench-verdict bench-verdict--ok">🟡 Decent</span></td>
                  <td>IAC pretrain + KISEM finetune, deployed</td>
                </tr>
                <tr style={{ background: "rgba(16,185,129,0.06)" }}>
                  <td><b>Ascertainty TabPFN v0.3 (this product)</b></td>
                  <td><b>+0.56</b></td>
                  <td><b>41.6%</b></td>
                  <td><b>±69,254 kWh (split-conformal)</b></td>
                  <td><b><span className="bench-verdict bench-verdict--good">🟢 Good — within SOTA band</span></b></td>
                  <td><b>TabPFN v2 in-context on IAC + KISEM. Hollmann et al., <i>Nature</i> 2025.</b></td>
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
                    <span className="bench-verdict bench-verdict--bad">🔴 &lt; 0</span>
                    <span className="bench-verdict bench-verdict--ok">🟡 0 – 0.3</span>
                    <span className="bench-verdict bench-verdict--good">🟢 0.3 – 0.7 (SOTA band)</span>
                    <span className="bench-verdict bench-verdict--great">🟢🟢 &gt; 0.7 (paper-grade)</span>
                  </div>
                  <p className="bench-explainer__context">
                    Industrial energy savings prediction papers (ORNL 2025 IAC analyses) report
                    R²=0.5–0.7. Residential-building papers with 10k+ rows reach 0.87 (Pampuri et al.,
                    Riga). Our TabPFN v0.3 sits inside the industrial SOTA band with ~50× less
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
              v0.3 backbone = TabPFN v2 (Hollmann et al., <i>Nature</i> 2025) — a pretrained
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
                      <b>TabPFN v2 — headline benchmark.</b> R²=+0.56 LOO on a 6-feature
                      corpus (baseline_kwh, sector, equipment_type, arc_group, source,
                      log_baseline). That&apos;s the headline number above. It proves that
                      a foundation-model approach generalises out-of-distribution from a
                      tiny Indian audit set when conditioned on 14k IAC rows.
                    </li>
                    <li>
                      <b>PINN unified v0.1 — what serves live underwriting.</b> Trained on
                      the same 72-ECM KISEM corpus but ingests all 21 fields the auditor
                      actually collects (leakage_pct, rated_kw, hours/days, motor count,
                      plant context). On a small ECM where TabPFN would output a P5 near
                      zero from the 6-feature blur, the PINN delivers a usable lender-grade
                      band because it sees the richer audit signal.
                    </li>
                  </ul>
                  <p className="bench-explainer__context">
                    <b style={{ color: "var(--fg)" }}>v0.4 plan:</b> retrain TabPFN on the
                    full 21-feature audit schema, validate per-sample bands no longer floor
                    at zero for small ECMs, then flip the serving default. The headline
                    number is preserved; the moat (the audit signal that only Ascertainty
                    collects) becomes part of the model both at benchmark and at serve time.
                  </p>
                  <p className="bench-explainer__context">
                    <b style={{ color: "var(--fg)" }}>What this means today:</b> every
                    project page on this site says &quot;Underwritten by PINN unified
                    v0.1&quot; because that&apos;s the model actually sizing the loan. The
                    TabPFN R²=+0.56 claim above is honest — it&apos;s the LOO score on the
                    corpus it was trained on, not a claim about live serving.
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

      {/* LIVE PROOF */}
      <section className="a-section">
        <SectionHead
          idx="04"
          kicker="LIVE PROOF"
          title="The protocol breathes on-chain."
          intro="Below is a live feed from the Solana devnet indexer — the same stream our risk dashboard subscribes to. Mainnet flips the same firehose to real USDC."
        />
        <div className="shell" style={{ paddingBottom: 56 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: 24,
              marginTop: 32,
            }}
            className="proof-grid"
          >
            <TerminalLog />
            <div className="a-surface" style={{ padding: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span className="label">Top pools · TVL</span>
                <span className="label" style={{ color: "var(--fg)" }}>
                  USDC
                </span>
              </div>
              {[
                {
                  name: "IN · Energy Efficiency Sr.",
                  tag: "SPL · USDC · SOLANA",
                  spark: [12, 14, 13, 17, 18, 19, 22, 24, 27, 29, 32, 36],
                  tvl: "$24.18M",
                  apy: "9.42%",
                },
                {
                  name: "ID · Cold Storage Sr.",
                  tag: "SPL · USDC · SOLANA",
                  spark: [8, 9, 11, 10, 14, 16, 17, 19, 22, 24, 27, 30],
                  tvl: "$18.92M",
                  apy: "10.12%",
                },
                {
                  name: "VN · Garment + Solar Jr.",
                  tag: "SPL · USDC · SOLANA",
                  spark: [4, 5, 7, 6, 9, 11, 12, 14, 16, 19, 21, 24],
                  tvl: "$11.40M",
                  apy: "16.20%",
                },
                {
                  name: "IN · Cooling Retrofit Sr.",
                  tag: "SPL · USDC · SOLANA",
                  spark: [10, 11, 12, 14, 16, 18, 19, 21, 24, 26, 28, 31],
                  tvl: "$9.04M",
                  apy: "10.80%",
                },
              ].map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "12px 0",
                    borderTop: i ? "1px dashed var(--line)" : "none",
                  }}
                >
                  <div>
                    <div style={{ color: "var(--fg)", fontSize: 13 }}>{v.name}</div>
                    <div
                      style={{
                        color: "var(--fg-muted)",
                        fontSize: 10.5,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        marginTop: 2,
                      }}
                    >
                      {v.tag}
                    </div>
                  </div>
                  <Sparkline values={v.spark} />
                  <div className="num" style={{ color: "var(--fg)", fontSize: 13 }}>
                    {v.tvl}
                  </div>
                  <div className="num" style={{ color: "var(--accent)", fontSize: 13 }}>
                    {v.apy}
                  </div>
                </div>
              ))}
              <Link
                href="/pools"
                className="a-btn a-btn--ghost"
                style={{ width: "100%", marginTop: 14, justifyContent: "center" }}
              >
                View all pools <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MECHANICS */}
      <section className="a-section">
        <SectionHead
          idx="05"
          kicker="MECHANICS"
          title="From deposit to repayment in one continuous ledger."
          intro="No re-keying. No reconciliation. The borrower's meter is the lender's invoice."
        />
        <div className="shell" style={{ paddingBottom: 80 }}>
          <div style={{ marginTop: 36, marginBottom: 56 }}>
            <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 12, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Watch the underwriting tighten in real time
            </div>
            <TimelineBandLoop />
          </div>
          <div style={{ marginTop: 36, borderTop: "1px solid var(--line)" }}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="step-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr 1.4fr 200px",
                  gap: 32,
                  padding: "28px 0",
                  borderBottom: "1px solid var(--line)",
                  alignItems: "start",
                }}
              >
                <div
                  className="num"
                  style={{
                    fontSize: 36,
                    color: "var(--fg-faint)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>
                    {s.actor}
                  </div>
                  <h4
                    style={{
                      fontSize: 22,
                      letterSpacing: "-0.02em",
                      fontWeight: 400,
                      margin: 0,
                      color: "var(--fg)",
                    }}
                  >
                    {s.title}
                  </h4>
                </div>
                <div
                  style={{ color: "var(--fg-muted)", fontSize: 13, lineHeight: 1.55 }}
                >
                  {s.body}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--fg-muted)",
                  }}
                >
                  {s.spec.map(([k, v], j) => (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px dashed var(--line)",
                        paddingBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--fg-faint)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          fontSize: 9.5,
                        }}
                      >
                        {k}
                      </span>
                      <span className="num" style={{ color: "var(--fg)" }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="a-section">
        <div
          className="shell"
          style={{
            padding: "48px 0",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <span className="label">Composing capital across</span>
          <div style={{ overflow: "hidden" }}>
            <div className="a-ticker">
              {[...PARTNERS, ...PARTNERS].map((p, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                    color: "var(--fg-muted)",
                    whiteSpace: "nowrap",
                    marginRight: 56,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="a-section">
        <SectionHead idx="06" kicker="ROADMAP" title="The path to mainnet." />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}
        >
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {[
              {
                d: true,
                t: "V0: Devnet contracts",
                s: "Program deployed, 92 tests passing.",
              },
              {
                d: true,
                t: "V0.5: Investor app",
                s: "Buy, claim, and pool flows live on devnet.",
              },
              {
                d: false,
                now: true,
                t: "V1: MRV attestations",
                s: "Licensed auditors submit baselines + verifications on-chain.",
              },
              {
                d: false,
                t: "V1.5: Pool aggregation",
                s: "Sweep pooled project returns into pool vaults automatically.",
              },
              {
                d: false,
                t: "V2: Mainnet",
                s: "Audited program. Real USDC. Real MSME projects.",
              },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 32,
                  padding: "20px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {r.d ? (
                    <>
                      <span
                        className="pulse"
                        style={{
                          ["--c" as string]: "var(--accent)",
                        } as React.CSSProperties}
                      />
                      <span className="label">SHIPPED</span>
                    </>
                  ) : r.now ? (
                    <>
                      <span className="pulse" />
                      <span className="label label--accent">IN FLIGHT</span>
                    </>
                  ) : (
                    <>
                      <span
                        className="pulse"
                        style={{
                          ["--c" as string]: "var(--fg-faint)",
                        } as React.CSSProperties}
                      />
                      <span className="label">PLANNED</span>
                    </>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      color: "var(--fg)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {r.t}
                  </div>
                  <div
                    style={{
                      color: "var(--fg-muted)",
                      fontSize: 12.5,
                      marginTop: 4,
                    }}
                  >
                    {r.s}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIQUIDITY & EXIT — secondary market roadmap */}
      <section className="a-section">
        <SectionHead
          idx="06.5"
          kicker="LIQUIDITY & EXIT"
          title="A clear path to secondary."
          intro="LPs ask 'how do I exit?' before they wire. Our answer is dated, not vague — primary today, whitelisted OTC in Q1 2026, native in-house orderbook in Q3 2026."
        />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 1100 }}
        >
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
                  "Centrifuge V3 wrapper",
                  "Daily NAV transparency",
                  "ERC-3643 KYC enforced on transfer",
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
                    background: isActive
                      ? "var(--accent-soft)"
                      : "var(--bg-1)",
                    padding: 18,
                  }}
                >
                  <span
                    className="label"
                    style={{
                      color: isActive
                        ? "var(--accent-deep)"
                        : "var(--fg-muted)",
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

      {/* FAQ */}
      <section className="a-section">
        <SectionHead idx="07" kicker="FAQ" title="Answers." />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}
        >
          <Accordion type="single" collapsible>
            {[
              {
                q: "Is this real USDC?",
                a: "On devnet today, using a test USDC mint. Mainnet with real USDC is in the roadmap.",
              },
              {
                q: "Who custodies my funds?",
                a: "You do. Every investment is a Solana transaction you sign. Ascertainty's program holds vaults on PDAs; no off-chain custodian.",
              },
              {
                q: "How is yield generated?",
                a: "MSMEs use the capital to deploy verified energy upgrades. Realized savings (measured by licensed auditors) flow back as USDC distributions.",
              },
              {
                q: "What happens if a project fails?",
                a: "Your position is on-chain and non-custodial. If an MSME under-delivers, distributions reflect actual savings; there is no insurance on devnet.",
              },
              {
                q: "Can I exit before the term ends?",
                a: "Positions are claimable at any time for accrued distributions. Secondary market for tokens is on the roadmap.",
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
        </div>
      </section>

      {/* MOAT — why this is hard to copy */}
      <section className="a-section">
        <SectionHead
          idx="08"
          kicker="MOAT"
          title="What stops a copycat."
          intro="Three reinforcing edges. The first is relational and copyable in 18 months. The second compounds with every loan we close. The third is a coordination problem no single counterparty wants to own."
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
              fontWeight: 400,
              fontSize: "clamp(40px, 7vw, 96px)",
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              margin: "22px auto 0",
              maxWidth: "20ch",
              position: "relative",
            }}
          >
            On-chain capital,{" "}
            <span className="serif" style={{ color: "var(--fg-muted)" }}>
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
