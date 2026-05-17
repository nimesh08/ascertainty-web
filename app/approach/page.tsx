import type { Metadata } from "next";
import Link from "next/link";
import { Glyph } from "@/components/landing/ascertainty/glyph";
import { SectionHead } from "@/components/landing/ascertainty/section-head";
import { TimelineBandLoop } from "@/components/landing/ascertainty/timeline-band-loop";
import { CalibratedPIChart } from "@/components/lenders/calibrated-pi-chart";

export const metadata: Metadata = {
  title: "Approach | Ascertainty",
  description:
    "How Ascertainty underwrites. Six primitives, one ledger, every prediction reproducible. Calibrated physics-informed model, IoT M&V, on-chain audit-hash — verified at the meter.",
};

const PRIMITIVES = [
  {
    title: "Share-of-savings tokens",
    body: "Each project mints a token backed by measurable energy savings. Distributions accrue per-token; claims are pro-rata across the senior and junior tranches.",
    chips: ["RWA rails", "Pro-rata", "Composable"],
    icon: "vault" as const,
  },
  {
    title: "PINN underwriting",
    body: "Physics-informed neural network produces a calibrated P5 / P50 / P95 distribution per ECM, with a 90% conformal prediction interval. Loans are sized to the P5 floor — not the optimistic P50.",
    chips: ["72-ECM unified", "Conformal PI (MAPIE)", "Per-ECM σ"],
    icon: "brain" as const,
  },
  {
    title: "Verified at the meter",
    body: "Baselines attested by licensed auditors (KISEM, IPMVP Option B). After commissioning, on-site IoT meters stream signed kWh deltas every 30s; the indexer reconciles realized savings against the forecast and flags any covenant breach.",
    chips: ["KISEM", "IPMVP Option B", "30s telemetry"],
    icon: "meter" as const,
  },
  {
    title: "Composable pools",
    body: "Diversify across a basket of underlying MSME projects with one token. Senior and junior tranches; junior absorbs first-loss before senior is touched.",
    chips: ["Senior · Junior", "Tranched", "ascertaintyUSDC"],
    icon: "id" as const,
  },
];

const STEPS: Array<{
  actor: string;
  title: string;
  body: string;
  spec: Array<[string, string]>;
}> = [
  {
    actor: "Lender",
    title: "Deposit USDC into a project or pool.",
    body: "Wallet signs a deposit. Funds queue into the next epoch on the underlying vault protocol. Share-of-savings token mints on settlement.",
    spec: [
      ["Settle", "≤ 4s"],
      ["Token", "ascertaintyUSDC"],
      ["Custody", "RWA rails"],
    ],
  },
  {
    actor: "Protocol",
    title: "Vault routes to underwritten MSMEs.",
    body: "The PINN underwriting layer sizes per-deal exposure to the P5 floor of a calibrated 90% PI. Vault disperses to borrower wallets through pre-authorised destinations on the underlying protocol.",
    spec: [
      ["Model", "PINN unified"],
      ["Covenant", "DSCR @ P5 ≥ 1.30×"],
      ["Gas", "$0.0001"],
    ],
  },
  {
    actor: "MSME",
    title: "Equipment ships. Audit baseline captures.",
    body: "Vendor receives stablecoin direct, milestone-gated. Asset commissions on-site. Auditor publishes MRV baseline. Meters come online.",
    spec: [
      ["Asset", "VFD / chiller"],
      ["Tenor", "1–7yr"],
      ["MRV", "Signed"],
    ],
  },
  {
    actor: "IoT",
    title: "Telemetry streams kWh deltas every 30s.",
    body: "Edge gateway pushes signed readings. Indexer reconciles against forecast. Covenants flag deviations to the risk dashboard.",
    spec: [
      ["Stream", "30s"],
      ["Signed", "Yes"],
      ["Window", "Live"],
    ],
  },
  {
    actor: "MSME",
    title: "Cashflow repays in USDC.",
    body: "Monthly payment in USDC, drawn from the saved energy cost. Distributions accrue pro-rata to share holders. Junior tranche absorbs first.",
    spec: [
      ["Cadence", "Monthly"],
      ["Currency", "USDC"],
      ["First-loss", "Junior"],
    ],
  },
  {
    actor: "Lender",
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
      {/* HERO — two-column: copy + CTAs on the left, CalibratedPIChart
          sidecar on the right anchoring the "calibrated" claim
          visually. Mirrors /lenders + /borrowers hero layout. */}
      <section className="a-hero a-hero--card">
        <div className="a-hero__bg" />
        <div
          className="shell"
          style={{ paddingTop: 56, paddingBottom: 56, position: "relative" }}
        >
          <div className="approach-hero__grid">
            <div>
              <span className="a-kicker-pill">Approach</span>
              <h1
                className="a-hero__heading"
                style={{
                  maxWidth: "18ch",
                  marginTop: 18,
                  fontSize: "clamp(38px, 5.6vw, 72px)",
                }}
              >
                How Ascertainty works —{" "}
                <span className="accent">every primitive auditable</span>.
              </h1>
              <p className="a-hero__sub" style={{ maxWidth: "52ch", marginTop: 22 }}>
                Four primitives. One ledger. The borrower’s meter is the
                lender’s invoice. Vault custody runs on RWA rails; Ascertainty
                contributes the calibrated underwriting, IoT M&V, and
                reproducible audit trail.
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
            <div className="approach-hero__sidecar">
              <CalibratedPIChart />
            </div>
          </div>
        </div>
      </section>

      {/* PRIMITIVES */}
      <section id="primitives" className="a-section">
        <SectionHead
          idx="01"
          kicker="THE SYSTEM"
          title="Four primitives. One auditable vault."
          intro="Vault custody and settlement run on the underlying RWA protocol (Centrifuge / Huma). Ascertainty contributes the four layers above: calibrated underwriting, on-the-meter verification, share-of-savings tokenization, and tranched pool composition."
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
                  gridTemplateColumns: "80px 1fr 1.4fr",
                  gap: 28,
                  padding: "28px 0",
                  borderBottom:
                    i === STEPS.length - 1 ? "none" : "1px solid var(--line)",
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
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <span className="step-actor">{s.actor}</span>
                  <h4
                    style={{
                      fontSize: 20,
                      letterSpacing: "-0.02em",
                      fontWeight: 400,
                      margin: "10px 0 0",
                      color: "var(--fg)",
                    }}
                  >
                    {s.title}
                  </h4>
                </div>
                <div>
                  <div
                    style={{
                      color: "var(--fg-muted)",
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    {s.body}
                  </div>
                  <div className="step-specs">
                    {s.spec.map(([k, v], j) => (
                      <span key={j} className="step-spec">
                        <span className="step-spec__k">{k}</span>
                        <span className="step-spec__v">{v}</span>
                      </span>
                    ))}
                  </div>
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
          title="The model produces a floor. We underwrite to it."
          intro="A calibrated 90% prediction interval per ECM, fit on a 72-ECM Indian audit corpus. Loans size to the P5 floor — not the P50 best-case. Full benchmark table lives on the landing page; reproduction script via curl."
        />
        <div className="shell" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 1100 }}>
          <div className="model-grid">
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
                Backbone — tabular foundation model
              </div>
              <h3
                style={{
                  fontSize: 20,
                  letterSpacing: "-0.01em",
                  color: "var(--fg)",
                  marginBottom: 16,
                }}
              >
                Pretrained tabular FM, fine-tuned on the audit corpus
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--fg-muted)",
                  lineHeight: 1.6,
                }}
              >
                A tabular foundation model is pretrained on synthetic priors,
                then conditioned on the US DOE IAC database (14k implemented
                audits, 1981–2024) and the 72-ECM Indian KISEM cohort.
                Distribution-free 90% PI via split-conformal prediction (MAPIE
                1.4), calibrated on leave-one-out residuals.{" "}
                <strong style={{ color: "var(--fg)" }}>
                  Live serving today is the 21-feature PINN unified model
                </strong>
                . Current FM architecture iterates on the TabPFN family
                (Hollmann et al., <i>Nature</i> 2025); the backbone is
                expected to evolve as the calibration corpus grows.
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
            <div className="model-grid__chart">
              <CalibratedPIChart
                legendTitle="Calibrated 90% PI"
                legendSub="per-ECM σ · 72-ECM corpus"
                calloutText="P5 floor = underwriting floor"
              />
            </div>
          </div>
          <p
            style={{
              marginTop: 18,
              fontSize: 12,
              color: "var(--fg-faint)",
              maxWidth: "76ch",
            }}
          >
            Reproducibility: every prediction’s sha256(inputs, outputs,
            git_commit) is queryable, so any underwriting decision can be
            re-derived end-to-end against the source code that produced it.
          </p>
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
            Underwriting that meters itself,{" "}
            <span className="serif" style={{ color: "var(--accent)" }}>
              reproducibly
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
            <Link
              className="a-btn a-btn--primary"
              href="/docs/underwriting-policy"
            >
              Underwriting policy <span className="arrow">→</span>
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
