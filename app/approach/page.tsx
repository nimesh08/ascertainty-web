import type { Metadata } from "next";
import Link from "next/link";
import { Glyph } from "@/components/landing/ascertainty/glyph";
import { SectionHead } from "@/components/landing/ascertainty/section-head";
import { TimelineBandLoop } from "@/components/landing/ascertainty/timeline-band-loop";

export const metadata: Metadata = {
  title: "Approach | Ascertainty",
  description:
    "How Ascertainty underwrites. Six primitives, one ledger, every prediction reproducible. Calibrated physics-informed model, IoT M&V, on-chain audit-hash — verified at the meter.",
};

const PRIMITIVES = [
  {
    title: "Share-of-savings tokens",
    body: "Each project mints a token backed by measurable energy savings. Distributions accrue per-token; claims are pro-rata. v0 vaults sit on the underlying RWA protocol (Centrifuge / Huma rails) — Ascertainty contributes the underwriting + servicing layer.",
    chips: ["RWA rails", "Pro-rata", "Composable"],
    icon: "vault" as const,
  },
  {
    title: "MRV-verified",
    body: "Baselines and verifications are attested by licensed auditors. Every kWh saved is a signed reading reconciled against the meter on a fixed cadence.",
    chips: ["BEE", "KISEM", "IPMVP Option B"],
    icon: "meter" as const,
  },
  {
    title: "PINN underwriting",
    body: "Physics-informed neural network produces a calibrated P5/P50/P95 distribution per ECM. TabPFN foundation model conditioned on 14k IAC audits + 72-ECM KISEM corpus; 90% conformal prediction interval via MAPIE.",
    chips: ["PINN unified", "TabPFN", "PyTorch"],
    icon: "brain" as const,
  },
  {
    title: "Composable pools",
    body: "Diversify across a basket of underlying MSME projects with one token. Senior and junior tranches; junior absorbs first-loss before senior is touched.",
    chips: ["Senior · Junior", "Tranched", "exiraUSDC"],
    icon: "id" as const,
  },
  {
    title: "IoT telemetry feed",
    body: "On-site energy meters stream kWh deltas. Indexer reconciles realized savings against the forecast; covenants flag deviations to the risk dashboard.",
    chips: ["30s stream", "Edge cache", "Signed readings"],
    icon: "wave" as const,
  },
  {
    title: "Audit-hash commits",
    body: "Every prediction commits a sha256 of (inputs, outputs, git_commit) to a Solana Memo so the underwriting trail is tamper-evident and reproducible. Promoted from roadmap to default in v2.5.",
    chips: ["sha256", "Solana Memo", "Reproducible"],
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
    body: "Wallet signs a deposit. Funds queue into the next epoch on the underlying vault protocol. Share-of-savings token mints on settlement.",
    spec: [
      ["Settle", "≤ 4s"],
      ["Token", "exiraUSDC"],
      ["Custody", "RWA rails"],
    ],
  },
  {
    actor: "// PROTOCOL",
    title: "Vault routes to underwritten MSMEs.",
    body: "The PINN underwriting layer sizes per-deal exposure to the P5 floor of a calibrated 90% PI. Vault disperses to borrower wallets through pre-authorised destinations on the underlying protocol.",
    spec: [
      ["Model", "PINN unified"],
      ["Covenant", "DSCR @ P5 ≥ 1.30×"],
      ["Gas", "$0.0001"],
    ],
  },
  {
    actor: "// MSME",
    title: "Equipment ships. Audit baseline captures.",
    body: "Vendor receives stablecoin direct, milestone-gated. Asset commissions on-site. Auditor publishes MRV baseline. Meters come online.",
    spec: [
      ["Asset", "VFD / chiller"],
      ["Tenor", "1–7yr"],
      ["MRV", "Signed"],
    ],
  },
  {
    actor: "// IOT",
    title: "Telemetry streams kWh deltas every 30s.",
    body: "Edge gateway pushes signed readings. Indexer reconciles against forecast. Covenants flag deviations to the risk dashboard.",
    spec: [
      ["Stream", "30s"],
      ["Signed", "Yes"],
      ["Window", "Live"],
    ],
  },
  {
    actor: "// MSME",
    title: "Cashflow repays in USDC.",
    body: "Monthly payment in USDC, drawn from the saved energy cost. Distributions accrue pro-rata to share holders. Junior tranche absorbs first.",
    spec: [
      ["Cadence", "Monthly"],
      ["Currency", "USDC"],
      ["First-loss", "Junior"],
    ],
  },
  {
    actor: "// LENDER",
    title: "Claim or compose.",
    body: "Burn shares for principal + accrued, or hold and compose into Aave / Morpho / Pendle for additional leverage.",
    spec: [
      ["Window", "Anytime"],
      ["Notice", "T+0"],
      ["Compose", "Aave/Morpho"],
    ],
  },
];

export default function ProtocolPage() {
  return (
    <>
      {/* HERO */}
      <section className="a-hero a-hero--card">
        <div className="a-hero__bg" />
        <div
          className="shell"
          style={{ paddingTop: 72, paddingBottom: 72, position: "relative" }}
        >
          <span className="a-kicker-pill">Approach</span>
          <h1
            className="a-hero__heading"
            style={{ maxWidth: "22ch", marginTop: 18 }}
          >
            How Ascertainty works —{" "}
            <span className="accent">every primitive auditable</span>.
          </h1>
          <p className="a-hero__sub" style={{ maxWidth: "62ch", marginTop: 22 }}>
            Six primitives. One ledger. The borrower’s meter is the lender’s
            invoice. Vault custody runs on RWA rails (Centrifuge / Huma);
            Ascertainty contributes the calibrated underwriting, IoT M&V, and
            tamper-evident audit hash.
          </p>
          <div className="a-hero__ctas" style={{ marginTop: 28 }}>
            <Link
              className="a-btn a-btn--primary"
              href="/docs/underwriting-policy"
            >
              Read the underwriting policy <span className="arrow">→</span>
            </Link>
            <a
              className="a-btn a-btn--ghost"
              href="https://inference.ascertainty.com/v1/health"
              target="_blank"
              rel="noreferrer"
            >
              Verify the model · /v1/health
            </a>
          </div>
        </div>
      </section>

      {/* PRIMITIVES */}
      <section id="primitives" className="a-section">
        <SectionHead
          idx="01"
          kicker="THE SYSTEM"
          title="Six primitives. One auditable vault."
          intro="Vault custody and settlement run on the underlying RWA protocol (Centrifuge / Huma). Ascertainty provides the layers above: calibrated underwriting, IoT M&V, tamper-evident audit-hash commits, and Asia-MSME servicing."
        />
        <div className="shell" style={{ marginTop: 32, paddingBottom: 80 }}>
          <div className="a-primitives">
            {PRIMITIVES.map((p, i) => (
              <div className="a-prim" key={i}>
                <div className="a-prim__icon">
                  <Glyph name={p.icon} />
                </div>
                <span className="a-prim__num">
                  P / {String(i + 1).padStart(2, "0")}
                </span>
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

      {/* MECHANICS — six-step ledger */}
      <section id="mechanics" className="a-section">
        <SectionHead
          idx="02"
          kicker="MECHANICS"
          title="From deposit to repayment in one continuous ledger."
          intro="No re-keying. No reconciliation. The borrower's meter is the lender's invoice."
        />
        <div className="shell" style={{ paddingBottom: 56 }}>
          <div
            style={{
              marginTop: 36,
              marginBottom: 56,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-muted)",
                marginBottom: 12,
                fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
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
                  style={{
                    color: "var(--fg-muted)",
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
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

      {/* MODEL + BENCHMARKS — link to landing's full benchmark table */}
      <section id="model" className="a-section">
        <SectionHead
          idx="03"
          kicker="THE MODEL"
          title="Calibrated, not just confident."
          intro="The headline R² is +0.56 LOO on a held-out 72-ECM Indian audit corpus, with a 90% conformal prediction interval of ±69,254 kWh. Calibrated means the P5 floor is honest — not an LLM hallucination. Full benchmark table on the landing page; reproduction script via curl."
        />
        <div className="shell" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 900 }}>
          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--bg-1)",
              padding: 28,
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
              Backbone
            </div>
            <h3
              style={{
                fontSize: 20,
                letterSpacing: "-0.01em",
                color: "var(--fg)",
                marginBottom: 16,
              }}
            >
              TabPFN — pretrained tabular foundation model
            </h3>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
              }}
            >
              Hollmann et al., <i>Nature</i> 2025. Pretrained on ~130M
              synthetic priors; conditioned at inference on the US Department
              of Energy IAC database (14k implemented audits, 1981–2024) plus
              our Indian KISEM 72-ECM cohort. Split-conformal prediction
              (MAPIE 1.4) gives a distribution-free 90% PI calibrated on
              leave-one-out residuals.{" "}
              <strong style={{ color: "var(--fg)" }}>
                Live serving today uses the 21-feature PINN unified model
              </strong>{" "}
              — TabPFN gets retrained on the same audit schema and promoted to
              serving in v2.5.
            </p>
            <Link
              href="/#05-benchmarks"
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
              See full benchmark table <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="a-section">
        <SectionHead idx="04" kicker="ROADMAP" title="The path to mainnet." />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}
        >
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {[
              {
                d: true,
                t: "Devnet program + investor app",
                s: "Solana program deployed with 92 tests passing. Buy, claim, and pool flows live on devnet today.",
              },
              {
                d: false,
                now: true,
                t: "Mainnet launch",
                s: "Audited program, real USDC, first seeded MSME deals. Licensed-auditor MRV attestations posted on-chain at funding and at Day-30 reconciliation.",
              },
              {
                d: false,
                t: "TabPFN serving + on-chain audit-hash",
                s: "TabPFN retrained on the 21-feature audit schema and promoted from headline-benchmark to serving. Every /v1/predict commits sha256(inputs, outputs, git_commit) as a Solana Memo — the underwriting trail becomes tamper-evident on-chain.",
              },
              {
                d: false,
                t: "Queue-priority liquidity",
                s: "FIFO redemption queue + auction-priority bidding for early exits; junior tranche absorbs queue stress first. Adapts the DePIN-credit QEV pattern to our monthly USDC sweep cadence. Triggers when senior tranche TVL ≥ $1M.",
              },
              {
                d: false,
                t: "MSME insurance partner",
                s: "Default + savings-shortfall cover via SBI General / ICICI Lombard / Bajaj Allianz — Indian-MSME analogue to the Munich Re collateral-value cover pattern. BD track, not engineering.",
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
          <span className="label">// EVERY CLAIM, VERIFIABLE</span>
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
            Read the policy.{" "}
            <span className="serif" style={{ color: "var(--accent)" }}>
              Verify
            </span>{" "}
            the model.
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
            <Link
              className="a-btn a-btn--primary"
              href="/docs/underwriting-policy"
            >
              UNDERWRITING POLICY <span className="arrow">→</span>
            </Link>
            <Link className="a-btn a-btn--ghost" href="/projects">
              See live deals
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
