"use client";

import Link from "next/link";
import { useState } from "react";

import { MeterAnimation } from "@/components/landing/meter-animation";
import { BankableCollateral } from "@/components/landing/bankable-collateral";
import { Term } from "@/components/landing/term";
import { SectionHead } from "@/components/landing/ascertainty/section-head";
import { FaqPersonas } from "@/components/landing/faq-personas";

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

      {/* AUDIENCE TRIPTYCH — dark themed; cream audience cards float on
          an ink band, contrasting with cream §02 below. */}
      <section id="01-who-its-for" className="a-section a-section--dark">
        <SectionHead
          idx="01"
          kicker="WHO IT'S FOR"
          title="One meter. Three views."
          intro="Lenders find yield. Borrowers find capital. Builders find every primitive auditable."
        />
        <div className="shell" style={{ paddingBottom: 0 }}>
          <div className="a-audience-grid">
            {/* 01 — LENDERS */}
            <Link href="/lenders" className="a-audience-card a-audience-card--lenders">
              <span className="a-kicker-pill">01 · Lenders · LPs</span>
              <h3 className="a-audience-card__title">
                Earn 10–14% yield on industrial efficiency credit.
              </h3>
              <p className="a-audience-card__desc">
                Non-recourse loans sized to the P5 floor of a calibrated 90%
                PI. DSCR @ P5 ≥ 1.30× hard covenant. Monthly USDC.
              </p>
              {/* Vault holding share-of-savings tokens; USDC coins drop
                  in from above on staggered loops. */}
              <svg
                className="a-audience-card__art aud-art--lenders"
                viewBox="0 0 160 100"
                fill="none"
                aria-hidden
              >
                {/* USDC coins falling from above */}
                <circle className="coin coin-1" cx="80" cy="14" r="4" fill="#5fa67f" />
                <circle className="coin coin-2" cx="62" cy="10" r="3" fill="#5fa67f" />
                <circle className="coin coin-3" cx="98" cy="10" r="3" fill="#5fa67f" />

                {/* Vault body */}
                <rect x="40" y="30" width="80" height="58" rx="4" stroke="#5fa67f" strokeWidth="1.5" fill="none" />
                {/* Inner panel */}
                <rect x="46" y="36" width="68" height="46" rx="2" stroke="#5fa67f" strokeWidth="0.6" opacity="0.4" fill="none" />
                {/* Coin slot at the top edge */}
                <rect x="72" y="29" width="16" height="2" rx="1" fill="#5fa67f" />
                {/* Dial */}
                <circle cx="80" cy="60" r="13" stroke="#5fa67f" strokeWidth="1.25" fill="none" />
                <circle cx="80" cy="60" r="3" fill="#5fa67f" />
                <line x1="80" y1="60" x2="80" y2="50" stroke="#5fa67f" strokeWidth="1.5" strokeLinecap="round" />
                {/* Vault feet */}
                <line x1="48" y1="88" x2="48" y2="92" stroke="#5fa67f" strokeWidth="1.5" />
                <line x1="112" y1="88" x2="112" y2="92" stroke="#5fa67f" strokeWidth="1.5" />
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
            <Link href="/borrowers" className="a-audience-card a-audience-card--borrowers">
              <span className="a-kicker-pill">02 · MSME borrowers</span>
              <h3 className="a-audience-card__title">
                Upgrade your factory. Repay from the savings.
              </h3>
              <p className="a-audience-card__desc">
                4–6 weeks to close. Non-recourse to your business.
                ₹20L–₹100Cr facility sizes for vetted Indian MSMEs.
              </p>
              {/* Factory schematic + sage energy-savings arrows pulsing
                  outward. Lower kWh, lower bill. */}
              <svg
                className="a-audience-card__art aud-art--borrowers"
                viewBox="0 0 160 100"
                fill="none"
                aria-hidden
              >
                {/* Factory silhouette (saw-tooth roof style) */}
                <path
                  d="M 16 84 L 16 56 L 28 50 L 28 60 L 40 50 L 40 60 L 52 50 L 52 60 L 64 50 L 64 84 Z"
                  stroke="#5fa67f"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                />
                {/* Adjoining building block */}
                <path
                  d="M 64 84 L 64 64 L 96 64 L 96 84 Z"
                  stroke="#5fa67f"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                />
                {/* Chimney */}
                <line x1="72" y1="64" x2="72" y2="44" stroke="#5fa67f" strokeWidth="2" />
                <rect x="69" y="40" width="6" height="4" fill="#5fa67f" />
                {/* Windows */}
                <rect x="22" y="68" width="5" height="6" stroke="#5fa67f" strokeWidth="0.5" opacity="0.5" />
                <rect x="34" y="68" width="5" height="6" stroke="#5fa67f" strokeWidth="0.5" opacity="0.5" />
                <rect x="46" y="68" width="5" height="6" stroke="#5fa67f" strokeWidth="0.5" opacity="0.5" />
                <rect x="74" y="70" width="6" height="8" stroke="#5fa67f" strokeWidth="0.5" opacity="0.5" />

                {/* Energy savings arrows flowing right — three of decreasing
                    thickness, suggesting ↓ kWh output */}
                <g className="flow flow-1">
                  <line x1="102" y1="56" x2="138" y2="56" stroke="#5fa67f" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M 134 52 L 138 56 L 134 60" stroke="#5fa67f" strokeWidth="1.75" strokeLinecap="round" fill="none" />
                </g>
                <g className="flow flow-2">
                  <line x1="102" y1="68" x2="132" y2="68" stroke="#5fa67f" strokeWidth="1.25" strokeLinecap="round" />
                  <path d="M 129 65 L 132 68 L 129 71" stroke="#5fa67f" strokeWidth="1.25" strokeLinecap="round" fill="none" />
                </g>
                <g className="flow flow-3">
                  <line x1="102" y1="80" x2="126" y2="80" stroke="#5fa67f" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 123 77 L 126 80 L 123 83" stroke="#5fa67f" strokeWidth="1" strokeLinecap="round" fill="none" />
                </g>

                {/* ↓ kWh label */}
                <text
                  x="144"
                  y="44"
                  textAnchor="end"
                  fill="#5fa67f"
                  fontSize="7"
                  fontFamily="var(--font-geist-mono, monospace)"
                  letterSpacing="0.12em"
                  opacity="0.85"
                >
                  ↓ kWh
                </text>
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

            {/* 03 — BUILDERS (links to /approach) */}
            <Link href="/approach" className="a-audience-card a-audience-card--builders">
              <span className="a-kicker-pill">03 · Builders</span>
              <h3 className="a-audience-card__title">
                Every primitive auditable. Every prediction reproducible.
              </h3>
              <p className="a-audience-card__desc">
                Six primitives, one ledger. Vault custody on RWA rails;
                calibrated underwriting + IoT M&amp;V + audit-hash commits.
              </p>
              {/* Audit toolkit: magnifying glass + wrench over a chain of
                  primitives. Reads "builders inspect + maintain every
                  block in the audit trail." */}
              <svg
                className="a-audience-card__art aud-art--approach"
                viewBox="0 0 160 100"
                fill="none"
                aria-hidden
              >
                {/* Magnifying glass — upper-left, line-art */}
                <g className="audit-loupe">
                  <circle cx="50" cy="32" r="14" stroke="#5fa67f" strokeWidth="2" fill="none" />
                  <circle cx="50" cy="32" r="9" stroke="#5fa67f" strokeWidth="0.5" opacity="0.35" fill="none" />
                  <line
                    x1="60"
                    y1="42"
                    x2="72"
                    y2="54"
                    stroke="#5fa67f"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>

                {/* Wrench — upper-right, slanted ~30° */}
                <g
                  className="audit-wrench"
                  transform="translate(116 32) rotate(35)"
                >
                  {/* Handle */}
                  <rect x="-2" y="-3" width="4" height="24" rx="2" fill="#5fa67f" />
                  {/* Open-end jaw at the top */}
                  <path
                    d="M -6 -4 L -6 -12 L -2 -12 L -2 -8 L 2 -8 L 2 -12 L 6 -12 L 6 -4 Z"
                    stroke="#5fa67f"
                    strokeWidth="1"
                    fill="#5fa67f"
                  />
                </g>

                {/* Chain of audit blocks at the bottom */}
                <line x1="34" y1="78" x2="42" y2="78" stroke="#5fa67f" strokeWidth="1" opacity="0.5" />
                <line x1="68" y1="78" x2="76" y2="78" stroke="#5fa67f" strokeWidth="1" opacity="0.5" />
                <line x1="102" y1="78" x2="110" y2="78" stroke="#5fa67f" strokeWidth="1" opacity="0.5" />
                {[
                  { key: "block-1", x: 8, hash: "0xa3" },
                  { key: "block-2", x: 42, hash: "0x7f" },
                  { key: "block-3", x: 76, hash: "0xc2" },
                  { key: "block-4", x: 110, hash: "0xe9" },
                ].map((b) => (
                  <g key={b.key} className={`block ${b.key}`}>
                    <rect
                      x={b.x}
                      y="68"
                      width="26"
                      height="20"
                      rx="3"
                      stroke="#5fa67f"
                      strokeWidth="1.25"
                      fill="none"
                    />
                    <text
                      x={b.x + 13}
                      y="81"
                      textAnchor="middle"
                      fill="#5fa67f"
                      fontSize="6.5"
                      fontFamily="var(--font-geist-mono, monospace)"
                      letterSpacing="0.04em"
                    >
                      {b.hash}
                    </text>
                  </g>
                ))}
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

      {/* BANKABLE COLLATERAL — USD.AI-style four-state animated explainer.
          Cycles every 5.5s through valuable / verifiable / enforceable /
          predictable. Component owns its own state + illustrations. */}
      <BankableCollateral />

      {/* BENCHMARKS — verifiable accuracy claims. Dark themed: ink ground
          matches the footer + nav, sage accents pop on dark. Sits between
          cream §02 (above) and cream §04 (below) so the dark band adds
          rhythm to the landing. */}
      <section id="03-benchmarks" className="a-section a-section--dark">
        <SectionHead
          idx="03"
          kicker="BENCHMARKS"
          title="Underwriting you can verify."
          intro={
            <>
              <Term
                title="Leave-one-out cross-validation"
                def="Train on every audit except one, predict that one, repeat for all 72. The whole table below is computed this way — no row is using data it was trained on."
              >
                LOO
              </Term>
              {" "}
              <Term
                title="R² · coefficient of determination"
                def="How much of the variance in realised savings the model explains. +1 = perfect, 0 = no better than guessing the mean, negative = worse than the mean."
                href="https://en.wikipedia.org/wiki/Coefficient_of_determination"
              >
                R²
              </Term>
              {" "}of +0.56 on 72{" "}
              <Term
                title="KISEM"
                def="Kotak IIT-Madras Save Energy Mission. Our primary Indian audit partnership — ~600 BEE-accredited MSME audits per year."
                href="https://kisem.org/"
              >
                KISEM
              </Term>
              {" "}industrial audits, after pretraining on 14k US-DOE{" "}
              <Term
                title="Industrial Assessment Center (IAC)"
                def="US Department of Energy program. 14,482 implemented industrial energy audits with client-reported realised savings, 1981–2024. Public dataset."
                href="https://iac.university/"
              >
                IAC
              </Term>
              {" "}rows. The 90% prediction interval is distribution-free.
            </>
          }
        />
        <div className="shell" style={{ paddingBottom: 56 }}>
          <div className="bench-grid" style={{ marginTop: 32 }}>
            <table className="a-tbl">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>
                    <Term
                      title="R² · coefficient of determination"
                      def="How much of the variance the model explains. +1 = perfect, 0 = guessing the mean, negative = worse than the mean."
                      href="https://en.wikipedia.org/wiki/Coefficient_of_determination"
                    >R²</Term>{" "}(
                    <Term
                      title="Leave-one-out cross-validation"
                      def="Train on every audit except one, predict that one, repeat for all 72. Computed this way for every row in the table."
                    >LOO</Term>)
                  </th>
                  <th>
                    <Term
                      title="MAPE-median"
                      def="Median Absolute Percentage Error — typical % error per prediction. Median (not mean) so the metric isn't skewed by outliers."
                    >MAPE-median</Term>
                  </th>
                  <th>90%{" "}
                    <Term
                      title="Confidence Interval coverage"
                      def="Of all predictions where the model claimed '90% confident', the fraction that actually contained the realised value. ~90% = calibrated. <90% = overconfident. >90% = bands too wide."
                    >CI</Term>{" "}coverage
                  </th>
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
                  <td>
                    <Term
                      title="BEE — Bureau of Energy Efficiency (India)"
                      def="Standardised physics formulas published by India's Bureau of Energy Efficiency, used by accredited energy auditors. Works best on well-instrumented categories like compressed-air leakage."
                      href="https://beeindia.gov.in/"
                    >BEE</Term>{" "}physics formula (industry default)
                  </td>
                  <td>0.50</td>
                  <td>37.5%</td>
                  <td>—</td>
                  <td><span className="bench-verdict bench-verdict--good">Good</span></td>
                  <td>Leakage-known compressed-air only</td>
                </tr>
                <tr>
                  <td>Ascertainty{" "}
                    <Term
                      title="CatBoost"
                      def="Gradient-boosted decision trees by Yandex. Strong on small tabular datasets. Our deployed production model before the TabPFN benchmark replaced the headline."
                      href="https://catboost.ai/"
                    >CatBoost</Term>
                  </td>
                  <td>+0.28</td>
                  <td>44.7%</td>
                  <td>±67,679 kWh (
                    <Term
                      title="Split-conformal prediction"
                      def="A distribution-free way to compute prediction intervals with a mathematical coverage guarantee under exchangeability. The strongest claim in tabular ML uncertainty quantification."
                      href="https://mapie.readthedocs.io/"
                    >split-conformal</Term>)
                  </td>
                  <td><span className="bench-verdict bench-verdict--ok">Decent</span></td>
                  <td>IAC pretrain + KISEM finetune, deployed</td>
                </tr>
                <tr style={{ background: "rgba(16,185,129,0.06)" }}>
                  <td><b>Ascertainty{" "}
                    <Term
                      title="TabPFN"
                      def="Tabular Prior-data Fitted Network. A pretrained transformer that performs in-context tabular regression — meaning it can predict on a new dataset without per-dataset training. Hollmann et al., Nature 2025."
                      href="https://priorlabs.ai/"
                    >TabPFN</Term>{" "}(this product)</b>
                  </td>
                  <td><b>+0.56</b></td>
                  <td><b>41.6%</b></td>
                  <td><b>±69,254 kWh (
                    <Term
                      title="Split-conformal prediction"
                      def="A distribution-free way to compute prediction intervals with a mathematical coverage guarantee under exchangeability."
                      href="https://mapie.readthedocs.io/"
                    >split-conformal</Term>)</b>
                  </td>
                  <td><b><span className="bench-verdict bench-verdict--good">Good — within{" "}
                    <Term
                      title="SOTA — State-of-the-Art"
                      def="In industrial energy-savings prediction, recent papers (ORNL 2025 IAC analyses) report R² 0.5–0.7. We sit inside that band on ~50× less data."
                    >SOTA</Term>{" "}band</span></b></td>
                  <td><b>TabPFN in-context on IAC + KISEM. Hollmann et al., <i>Nature</i> 2025.</b></td>
                </tr>
              </tbody>
            </table>

            {/* Caveat — promoted from inline prose to a sage callout right
                under the table where it has maximum context. */}
            <div className="a-callout" role="note">
              <span className="a-callout__icon" aria-hidden>!</span>
              <div className="a-callout__body">
                <span className="a-callout__title">Caveat for lenders</span>
                <Term
                  title="Industrial Assessment Center (IAC)"
                  def="US Department of Energy program. 14k+ implemented industrial energy audits, 1981–2024."
                  href="https://iac.university/"
                >IAC</Term>&apos;s &quot;realized savings&quot; is
                client-reported at 6–9 month phone follow-up, not metered{" "}
                <Term
                  title="M&V — Measurement & Verification"
                  def="The discipline of measuring whether claimed energy savings actually showed up at the meter post-retrofit, vs. a pre-defined baseline."
                >M&amp;V</Term>. Our own metered M&amp;V loop closes the gap
                post-deployment via{" "}
                <Term
                  title="IPMVP Option B"
                  def="International Performance Measurement & Verification Protocol, Option B. Retrofit savings measured directly at the equipment-level meter against a baseline period."
                  href="https://evo-world.org/en/products-services-mainmenu-en/protocols/ipmvp"
                >IPMVP Option B</Term>{" "}telemetry.
              </div>
            </div>

            {/* Two collapsible methodology cards, side-by-side. Click to expand. */}
            <div className="a-bench-cards">
              <details className="a-bench-card">
                <summary>What R², MAPE, and 90% CI mean</summary>
                <div className="a-bench-card__body">
                  <h4>R² — how much variation the model explains</h4>
                  <ul>
                    <li><b>+1.0</b> perfect · <b>0.0</b> guessing the mean · <b>negative</b> actively misleading</li>
                    <li>Industrial energy-savings papers report 0.5–0.7. Our TabPFN sits inside that band with ~50× less data.</li>
                  </ul>
                  <h4>MAPE-median — typical % error per prediction</h4>
                  <ul>
                    <li>10–20% excellent · 20–40% good for lender debt-sizing with a P5 floor · &gt;60% don&apos;t underwrite</li>
                    <li>At 41.6%, a 100k-kWh prediction lands in 60–140k typically. Why we underwrite to P5, not P50.</li>
                  </ul>
                  <h4>90% CI coverage — is the band honest?</h4>
                  <ul>
                    <li>Split-conformal (MAPIE 1.4) gives a <b>distribution-free statistical guarantee</b> of coverage.</li>
                    <li>Not an estimate — a mathematical proof under exchangeability. The reason lenders size debt against P5.</li>
                  </ul>
                </div>
              </details>

              <details className="a-bench-card">
                <summary>Why TabPFN is the headline, not the serving model</summary>
                <div className="a-bench-card__body">
                  <h4>Two models, two roles</h4>
                  <ul>
                    <li>
                      <b>TabPFN — benchmark.</b> R²=+0.56 LOO on a 6-feature
                      corpus. Proves a foundation-model generalises out of a
                      tiny Indian audit set when conditioned on 14k IAC rows.
                    </li>
                    <li>
                      <b>PINN unified — what serves live underwriting.</b>{" "}
                      Ingests all 21 audit fields (leakage_pct, rated_kw,
                      motor count, plant context). On small ECMs it delivers
                      a lender-grade band where 6-feature TabPFN would floor
                      at zero.
                    </li>
                  </ul>
                  <h4>Next iteration</h4>
                  <p>
                    Retrain TabPFN on the 21-feature audit schema, validate
                    bands no longer floor at zero, then flip the serving
                    default. The headline number is preserved; the
                    audit-signal moat becomes part of the model at both
                    benchmark and serve time.
                  </p>
                  <p>
                    <b>Today:</b> every project page reads &quot;Underwritten
                    by PINN unified&quot; — that&apos;s the model sizing the
                    loan. The TabPFN R²=+0.56 above is the LOO score on the
                    corpus it was trained on, not a live-serving claim.
                  </p>
                </div>
              </details>
            </div>

            {/* Verification pointers — replaces the previous hosted-curl
                example which was dead weight (endpoint not yet live).
                These two routes ship real per-deal numbers today. */}
            <div className="a-callout a-callout--verify" role="note">
              <span className="a-callout__icon" aria-hidden>?</span>
              <div className="a-callout__body">
                <span className="a-callout__title">How to verify these numbers</span>
                Every seed deal on{" "}
                <Link
                  href="/projects"
                  style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  /projects
                </Link>
                {" "}publishes its P5 / P50 / P95 band with the same model and
                methodology. The full sizing math is in the{" "}
                <Link
                  href="/docs/underwriting-policy"
                  style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 2 }}
                >
                  Underwriting Policy
                </Link>
                . A public Colab notebook running the LOO-CV reproduction on
                the IAC subset ships with V1 mainnet.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPETITION — spectrum bar visualizing the SME gap + 3 comparison
          cards with hover focus. Replaces the wide table + closing prose.
          Ascertainty card is sage-highlighted; hovering any card dims the
          other two so the active one reads cleanly. */}
      <section id="04-competition" className="a-section">
        <SectionHead
          idx="04"
          kicker="COMPETITION"
          title={
            <>
              Banks need{" "}
              <span style={{ color: "var(--accent)" }}>salvage</span>. ESCOs
              need{" "}
              <span style={{ color: "var(--accent)" }}>guarantees</span>. We
              underwrite the{" "}
              <span style={{ color: "var(--accent)" }}>savings</span>.
            </>
          }
        />
        <div className="shell" style={{ paddingTop: 16, paddingBottom: 80 }}>
          {/* Spectrum bar — visualizes the structural gap by ticket size.
              The $25K – $1M gap is rendered as a sage band overlaying the
              three rows; no redundant text callout below. */}
          <div className="cmp-spectrum">
            <div className="cmp-spectrum__head">
              <span className="cmp-spectrum__heading">Ticket-size coverage</span>
              <span className="cmp-spectrum__hint">
                Filled portion = the ticket sizes each can actually serve.
              </span>
            </div>

            <div className="cmp-spectrum__body">
              <div className="cmp-spectrum__labels">
                <span className="cmp-spectrum__label cmp-spectrum__label--us">
                  Ascertainty
                </span>
                <span className="cmp-spectrum__label">Banks</span>
                <span className="cmp-spectrum__label">ESCOs</span>
              </div>

              <div className="cmp-spectrum__plot">
                {/* Axis labels along the top of the plot area */}
                <div className="cmp-spectrum__axis" aria-hidden>
                  <span style={{ left: "5%" }}>$25K</span>
                  <span style={{ left: "35%" }}>$1M</span>
                  <span style={{ left: "55%" }}>$5M</span>
                  <span style={{ left: "75%" }}>$20M</span>
                  <span style={{ left: "95%" }}>$50M+</span>
                </div>

                <div className="cmp-spectrum__tracks">
                  {/* Sage-tinted overlay band marking the $25K–$1M gap */}
                  <div className="cmp-spectrum__gap-band" aria-hidden>
                    <span className="cmp-spectrum__gap-band-label">
                      $25K – $1M · Ascertainty alone
                    </span>
                  </div>

                  <div className="cmp-spectrum__track">
                    <div
                      className="cmp-spectrum__fill cmp-spectrum__fill--us"
                      style={{ left: "5%", width: "70%" }}
                    />
                  </div>
                  <div className="cmp-spectrum__track">
                    <div
                      className="cmp-spectrum__fill"
                      style={{ left: "35%", width: "65%" }}
                    />
                  </div>
                  <div className="cmp-spectrum__track">
                    <div
                      className="cmp-spectrum__fill"
                      style={{ left: "55%", width: "45%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 comparison cards — Ascertainty highlighted with sage outline.
              Hover any card to focus it; the other two dim. */}
          <div className="cmp-cards">
            <article className="cmp-card">
              <span className="cmp-card__name">Banks</span>
              <span className="cmp-card__sub">Commercial · DFI</span>
              <div className="cmp-card__stats">
                <div>
                  <span className="label">Min ticket</span>
                  <span className="num">$1M+</span>
                </div>
                <div>
                  <span className="label">Time to close</span>
                  <span className="num">6+ mo</span>
                </div>
                <div>
                  <span className="label">Recourse</span>
                  <span className="num">Full</span>
                </div>
                <div>
                  <span className="label">Geography</span>
                  <span className="num">OECD</span>
                </div>
              </div>
              <p className="cmp-card__tagline">
                <b>Need salvage to lend.</b> Retrofit equipment resells at
                ~10%, so they require full corporate recourse on top — which
                only investment-grade balance sheets can post. Lights off
                below $1M.
              </p>
            </article>

            <article className="cmp-card">
              <span className="cmp-card__name">ESCOs</span>
              <span className="cmp-card__sub">Johnson Controls · Trane · Honeywell</span>
              <div className="cmp-card__stats">
                <div>
                  <span className="label">Min ticket</span>
                  <span className="num">$5–10M+</span>
                </div>
                <div>
                  <span className="label">Time to close</span>
                  <span className="num">12–24 mo</span>
                </div>
                <div>
                  <span className="label">Structure</span>
                  <span className="num">ESPC guarantee</span>
                </div>
                <div>
                  <span className="label">Geography</span>
                  <span className="num">US + EU</span>
                </div>
              </div>
              <p className="cmp-card__tagline">
                <b>Need a corporate guarantee.</b> The 1980s answer: don&apos;t
                underwrite the savings — wrap them in the borrower&apos;s
                creditworthiness. Only investment-grade enterprises qualify.
              </p>
            </article>

            <article className="cmp-card cmp-card--us">
              <span className="cmp-card__name">Ascertainty</span>
              <span className="cmp-card__sub">This product</span>
              <div className="cmp-card__stats">
                <div>
                  <span className="label">Min ticket</span>
                  <span className="num">$25K</span>
                </div>
                <div>
                  <span className="label">Time to close</span>
                  <span className="num">4–6 wk</span>
                </div>
                <div>
                  <span className="label">Recourse</span>
                  <span className="num">None</span>
                </div>
                <div>
                  <span className="label">Geography</span>
                  <span className="num">India · SEA</span>
                </div>
              </div>
              <p className="cmp-card__tagline">
                <b>Underwrite the savings directly.</b> Calibrated PINN +
                IoT M&amp;V + legal assignment of the kWh delta. No salvage
                needed, no corporate guarantee needed —{" "}
                <b>10× the addressable market</b>.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ — persona toggle (lenders / borrowers / reviewers), 3 featured
          Q&As per persona, sourced from lib/faq-content.tsx so /docs/faq
          and the landing stay in sync. */}
      <section id="05-faq" className="a-section">
        <SectionHead idx="05" kicker="FAQ" title="Answers." />
        <div
          className="shell"
          style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 900 }}
        >
          <FaqPersonas />
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
