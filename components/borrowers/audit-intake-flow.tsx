"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * §05 — Audit intake animation.
 *
 * Centerpiece: a five-stage SVG pipeline that walks one KISEM audit
 * report through the underwriting model. Auto-loops every 18 seconds.
 *
 *   Stage 1 — PDF audit lands
 *   Stage 2 — Field extraction (key-value JSON streaming)
 *   Stage 3 — ECM split (the report fans out into per-ECM lanes)
 *   Stage 4 — Physics heads (per-ECM constraints check the extraction)
 *   Stage 5 — Calibrated forecast (P5/P50/P95 + term-sheet pill)
 *
 * Below: a static grid of the 12 real KISEM audits we've ingested,
 * color-coded by underwriting outcome. Doubles as a credibility
 * footer ("we've already processed twelve") and a legend for the
 * animation above (any one of these is the "report" in the loop).
 */

// 12 audits from the KISEM portfolio. Status legend:
//   green  → underwritten / eligible
//   amber  → pending / in progress
//   red    → routed to partner ESCO (ECM not in v0 coverage)
//   blank  → not yet reviewed
const KISEM_AUDITS: ReadonlyArray<{
  company: string;
  sector: string;
  activity: string;
  status: "green" | "amber" | "red" | "blank";
}> = [
  { company: "Dietech India Pvt Ltd · Unit I", sector: "Mech. & Metal Casting", activity: "Die Cast Manufacturing", status: "green" },
  { company: "Dietech India Pvt Ltd · Unit II", sector: "Mech. & Metal Casting", activity: "Die Cast Manufacturing", status: "green" },
  { company: "LSI Mech Engineers Pvt Ltd", sector: "Mech. & Metal Casting", activity: "Mechanical Engineering", status: "red" },
  { company: "Shreyas Machine Tools & Meta Castings", sector: "Mech. & Metal Casting", activity: "Machine Tools & Metal Castings", status: "green" },
  { company: "Raini Industries India Pvt Ltd", sector: "Plastics & Molding", activity: "Injection / Blow molding / sheet metal", status: "amber" },
  { company: "UNITECH PLASTO COMPONENTS", sector: "Plastics & Molding", activity: "Injection Moulding", status: "red" },
  { company: "Alphaa Springs Chennai Pvt Ltd", sector: "Textiles & Apparel", activity: "Yarn Manufacturing", status: "red" },
  { company: "Alpine Knits", sector: "Textiles & Apparel", activity: "Yarn Manufacturing", status: "green" },
  { company: "Amaravathy Spinning Mills", sector: "Textiles & Apparel", activity: "Yarn Manufacturing", status: "blank" },
  { company: "Gomuki Spinning Mills · Unit 2", sector: "Textiles & Apparel", activity: "Yarn Manufacturing", status: "amber" },
  { company: "Prakash Cotex India LLP", sector: "Textiles & Apparel", activity: "Weaving Industry", status: "green" },
  { company: "Veejay Syntex Pvt Ltd", sector: "Textiles & Apparel", activity: "Synthetic Textiles", status: "amber" },
];

// ─────────────────────────────────────────────────────────────────────
// Animation layout constants
// ─────────────────────────────────────────────────────────────────────
const VB = { w: 1100, h: 480 };
const STAGE_Y = 80;
const STAGE_H = 280;
const STAGE_W = 168;
// Five stages, evenly spaced horizontally
const STAGE_X = [40, 240, 460, 670, 892] as const;
const LOOP_DUR = 18; // seconds, full cycle
// Per-stage fade-in window (start, fully visible)
// Each stage stays visible from its start time through end of loop.
const STAGE_FADES: Array<[number, number]> = [
  [0.0, 0.06],
  [0.16, 0.22],
  [0.34, 0.40],
  [0.52, 0.58],
  [0.74, 0.80],
];

// Helper — emit keyTimes + values for a fade-in that stays visible
function fadeIn(start: number, end: number): { keyTimes: string; values: string } {
  // values: opacity 0 → 0 → 1 → 1 (held at 1 to loop end, then back to 0)
  // padding both ends so SMIL keyTimes spans [0, 1]
  const safeStart = Math.max(start - 0.001, 0);
  const safeEnd = Math.min(end, 0.999);
  return {
    keyTimes: `0;${safeStart};${safeEnd};1`,
    values: "0;0;1;1",
  };
}

// Helper — emit dot motion across the 5 stages
// The dot pulses at each stage center, then moves to the next.
function dotMotion(): { keyTimes: string; values: string } {
  // 5 stage centers, dot dwells then moves
  const cx = STAGE_X.map((x) => x + STAGE_W / 2);
  const cy = STAGE_Y + STAGE_H / 2;
  const pts: string[] = [];
  // 0.00 → stage 1
  // 0.16 → arrive stage 2
  // 0.34 → arrive stage 3
  // 0.52 → arrive stage 4
  // 0.74 → arrive stage 5
  // 0.95 → return to stage 1 (fast)
  const stops = [0.0, 0.06, 0.16, 0.22, 0.34, 0.40, 0.52, 0.58, 0.74, 0.80, 0.95, 1.0];
  const positions = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 0];
  for (const p of positions) pts.push(`${cx[p]},${cy}`);
  return {
    keyTimes: stops.join(";"),
    values: pts.join(";"),
  };
}

const DOT_MOTION = dotMotion();

// ─────────────────────────────────────────────────────────────────────
// Stage content fragments
// ─────────────────────────────────────────────────────────────────────
function StageCard({
  i,
  label,
  caption,
  children,
}: {
  i: number;
  label: string;
  caption: string;
  children: React.ReactNode;
}) {
  const x = STAGE_X[i];
  const fade = fadeIn(...STAGE_FADES[i]);
  return (
    <g>
      <g opacity={i === 0 ? 1 : 0}>
        {/* Card frame — translucent so the section's blurred desk photo
            bleeds through, completing the liquid-glass layering. */}
        <rect
          x={x}
          y={STAGE_Y}
          width={STAGE_W}
          height={STAGE_H}
          rx={10}
          fill="rgba(255, 255, 255, 0.62)"
          stroke="rgba(22, 36, 33, 0.10)"
          strokeWidth={1}
        />
        {/* Kicker */}
        <text
          x={x + 14}
          y={STAGE_Y + 26}
          fontFamily="var(--font-display)"
          fontSize={12}
          fontWeight={500}
          letterSpacing="-0.005em"
          fill="var(--fg-muted)"
        >
          <tspan fill="var(--fg-faint)">{String(i + 1).padStart(2, "0")}</tspan>
          {"  "}{label}
        </text>
        {/* Inner content */}
        {children}
        {/* Caption */}
        <text
          x={x + 14}
          y={STAGE_Y + STAGE_H - 16}
          fontFamily="var(--font-display)"
          fontSize={11}
          letterSpacing="-0.005em"
          fill="var(--fg-faint)"
        >
          {caption}
        </text>
        {i > 0 && (
          <animate
            attributeName="opacity"
            dur={`${LOOP_DUR}s`}
            keyTimes={fade.keyTimes}
            values={fade.values}
            repeatCount="indefinite"
          />
        )}
      </g>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────
export function AuditIntakeFlow() {
  const [activeSector, setActiveSector] = useState<string | "all">("all");
  const visibleAudits = activeSector === "all"
    ? KISEM_AUDITS
    : KISEM_AUDITS.filter((a) => a.sector === activeSector);

  return (
    <div className="audit-intake">
      {/* Animated pipeline */}
      <div className="audit-intake__pipeline">
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="audit-intake__svg"
          role="img"
          aria-label="Pipeline: audit PDF flows through extraction, ECM split, physics heads, into calibrated forecast"
        >
          {/* Connecting dashed line behind the cards */}
          {STAGE_X.slice(0, -1).map((x, i) => (
            <line
              key={i}
              x1={x + STAGE_W}
              y1={STAGE_Y + STAGE_H / 2}
              x2={STAGE_X[i + 1]}
              y2={STAGE_Y + STAGE_H / 2}
              stroke="var(--line-strong)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          ))}

          {/* Stage 1 — PDF cover */}
          <StageCard i={0} label="AUDIT INTAKE" caption="KISEM · 47 fields">
            {/* Document glyph */}
            <rect
              x={STAGE_X[0] + 38}
              y={STAGE_Y + 56}
              width={92}
              height={120}
              rx={4}
              fill="var(--bg-0)"
              stroke="var(--accent)"
              strokeWidth={1.5}
            />
            {/* Folded corner */}
            <polygon
              points={`${STAGE_X[0] + 130},${STAGE_Y + 56} ${STAGE_X[0] + 130},${STAGE_Y + 72} ${STAGE_X[0] + 114},${STAGE_Y + 56}`}
              fill="var(--accent-soft)"
              stroke="var(--accent)"
              strokeWidth={1.5}
            />
            {/* Text lines on the doc */}
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <line
                key={j}
                x1={STAGE_X[0] + 48}
                y1={STAGE_Y + 86 + j * 12}
                x2={STAGE_X[0] + 120 - (j % 2 === 0 ? 0 : 18)}
                y2={STAGE_Y + 86 + j * 12}
                stroke="var(--fg-faint)"
                strokeWidth={1.2}
              />
            ))}
            <text
              x={STAGE_X[0] + STAGE_W / 2}
              y={STAGE_Y + 200}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize={14}
              fill="var(--accent-deep)"
              letterSpacing="-0.005em"
            >
              hotel.audit.pdf
            </text>
          </StageCard>

          {/* Stage 2 — Field extraction (key:value pairs) */}
          <StageCard i={1} label="EXTRACT" caption="JSON · normalized">
            {[
              ["company", "“Hotel · BLR”"],
              ["sector", "“Hospitality”"],
              ["baseline_kwh", "482000"],
              ["tariff_inr_kwh", "8.5"],
              ["ecm[0]", "“chiller”"],
              ["ecm[1]", "“IoT_setpoint”"],
              ["floor_area_m2", "11840"],
            ].map(([k, v], j) => (
              <g key={k}>
                <text
                  x={STAGE_X[1] + 14}
                  y={STAGE_Y + 60 + j * 22}
                  fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                  fontSize={10}
                  fill="var(--fg-muted)"
                >
                  {k}
                </text>
                <text
                  x={STAGE_X[1] + STAGE_W - 14}
                  y={STAGE_Y + 60 + j * 22}
                  textAnchor="end"
                  fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                  fontSize={10}
                  fill="var(--accent-deep)"
                >
                  {v}
                </text>
              </g>
            ))}
          </StageCard>

          {/* Stage 3 — ECM split */}
          <StageCard i={2} label="ECM SPLIT" caption="2 ECMs · grade B">
            {["Chiller plant", "IoT setpoint", "—", "—"].map((ecm, j) => {
              const isActive = ecm !== "—";
              return (
                <g key={j}>
                  <rect
                    x={STAGE_X[2] + 14}
                    y={STAGE_Y + 54 + j * 36}
                    width={STAGE_W - 28}
                    height={28}
                    rx={3}
                    fill={isActive ? "var(--accent-soft)" : "var(--bg-0)"}
                    stroke={isActive ? "var(--accent)" : "var(--line)"}
                    strokeDasharray={isActive ? "0" : "3 3"}
                  />
                  <text
                    x={STAGE_X[2] + 24}
                    y={STAGE_Y + 72 + j * 36}
                    fontSize={11}
                    fill={isActive ? "var(--accent-deep)" : "var(--fg-faint)"}
                  >
                    {ecm}
                  </text>
                  {isActive && (
                    <text
                      x={STAGE_X[2] + STAGE_W - 24}
                      y={STAGE_Y + 72 + j * 36}
                      textAnchor="end"
                      fontSize={9}
                      fill="var(--accent-deep)"
                      fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                    >
                      σ ≈ 0.12
                    </text>
                  )}
                </g>
              );
            })}
          </StageCard>

          {/* Stage 4 — Physics heads (labels in display, equations in mono) */}
          <StageCard i={3} label="PHYSICS HEAD" caption="PINN · per-ECM">
            {/* Cooling load */}
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 64}
              fontFamily="var(--font-display)"
              fontSize={11}
              fill="var(--fg-muted)"
            >
              Cooling load
            </text>
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 84}
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
              fontSize={13}
              fill="var(--fg)"
            >
              Q = m · cp · ΔT
            </text>
            {/* COP gain */}
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 114}
              fontFamily="var(--font-display)"
              fontSize={11}
              fill="var(--fg-muted)"
            >
              COP gain
            </text>
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 134}
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
              fontSize={13}
              fill="var(--fg)"
            >
              η = COP₂ / COP₁
            </text>
            {/* Schedule offset */}
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 164}
              fontFamily="var(--font-display)"
              fontSize={11}
              fill="var(--fg-muted)"
            >
              Schedule offset
            </text>
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 184}
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
              fontSize={13}
              fill="var(--fg)"
            >
              ∫ P(t)·θ(t) dt
            </text>
            {/* Feasibility tag */}
            <text
              x={STAGE_X[3] + 14}
              y={STAGE_Y + 222}
              fontFamily="var(--font-display)"
              fontSize={11}
              fill="var(--accent-deep)"
            >
              ✓ physically feasible
            </text>
          </StageCard>

          {/* Stage 5 — Calibrated forecast + term-sheet pill */}
          <StageCard i={4} label="FORECAST" caption="90% PI · DSCR @ P5 = 1.38×">
            {/* mini-PI curve */}
            <g>
              <path
                d={`M${STAGE_X[4] + 16},${STAGE_Y + 170}
                    Q${STAGE_X[4] + 50},${STAGE_Y + 80}
                     ${STAGE_X[4] + 84},${STAGE_Y + 80}
                    Q${STAGE_X[4] + 120},${STAGE_Y + 80}
                     ${STAGE_X[4] + 152},${STAGE_Y + 170}`}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1.5}
              />
              <path
                d={`M${STAGE_X[4] + 16},${STAGE_Y + 170}
                    Q${STAGE_X[4] + 50},${STAGE_Y + 80}
                     ${STAGE_X[4] + 84},${STAGE_Y + 80}
                    Q${STAGE_X[4] + 120},${STAGE_Y + 80}
                     ${STAGE_X[4] + 152},${STAGE_Y + 170}
                    L${STAGE_X[4] + 152},${STAGE_Y + 170}
                    L${STAGE_X[4] + 16},${STAGE_Y + 170} Z`}
                fill="var(--accent-soft)"
              />
              {/* P5/P50/P95 ticks */}
              {[
                { x: STAGE_X[4] + 32, label: "P5" },
                { x: STAGE_X[4] + 84, label: "P50" },
                { x: STAGE_X[4] + 136, label: "P95" },
              ].map((tk) => (
                <g key={tk.label}>
                  <line
                    x1={tk.x}
                    y1={STAGE_Y + 168}
                    x2={tk.x}
                    y2={STAGE_Y + 176}
                    stroke="var(--accent-deep)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={tk.x}
                    y={STAGE_Y + 190}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--accent-deep)"
                    fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                  >
                    {tk.label}
                  </text>
                </g>
              ))}
              {/* Term-sheet pill */}
              <rect
                x={STAGE_X[4] + 16}
                y={STAGE_Y + 210}
                width={STAGE_W - 32}
                height={32}
                rx={4}
                fill="var(--accent)"
              />
              <text
                x={STAGE_X[4] + STAGE_W / 2}
                y={STAGE_Y + 230}
                textAnchor="middle"
                fontSize={11}
                fill="var(--accent-ink, #fff)"
                fontFamily="var(--font-geist-mono), ui-monospace, monospace"
                letterSpacing="0.06em"
              >
                $25K · 36 MO
              </text>
            </g>
          </StageCard>

          {/* Traveling indicator dot — sweeps across stages */}
          <circle r={7} fill="var(--accent)" opacity={0.95}>
            <animate
              attributeName="cx"
              dur={`${LOOP_DUR}s`}
              keyTimes={DOT_MOTION.keyTimes}
              values={DOT_MOTION.values.split(";").map((p) => p.split(",")[0]).join(";")}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              dur={`${LOOP_DUR}s`}
              keyTimes={DOT_MOTION.keyTimes}
              values={DOT_MOTION.values.split(";").map((p) => p.split(",")[1]).join(";")}
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              dur="1.4s"
              values="6;9;6"
              repeatCount="indefinite"
            />
          </circle>

          {/* Caption strip below */}
          <text
            x={VB.w / 2}
            y={STAGE_Y + STAGE_H + 60}
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize={14}
            fontWeight={500}
            letterSpacing="-0.01em"
            fill="var(--fg-muted)"
          >
            One report. Five primitives. One calibrated forecast.
          </text>
        </svg>
      </div>

      {/* 12-company KISEM matrix */}
      <div className="kisem-matrix">
        <div className="kisem-matrix__head">
          <div>
            <div className="kisem-matrix__kicker">KISEM PORTFOLIO · 12 AUDITS</div>
            <div className="kisem-matrix__title">
              Already on the ledger.
            </div>
          </div>
          <div className="kisem-matrix__filters">
            {[
              { key: "all" as const, label: "All" },
              { key: "Mech. & Metal Casting" as const, label: "Mechanical" },
              { key: "Plastics & Molding" as const, label: "Plastics" },
              { key: "Textiles & Apparel" as const, label: "Textiles" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveSector(f.key)}
                className={cn(
                  "kisem-matrix__filter",
                  activeSector === f.key && "kisem-matrix__filter--active"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="kisem-matrix__grid">
          {visibleAudits.map((a) => (
            <div
              key={a.company}
              className={`kisem-matrix__cell kisem-matrix__cell--${a.status}`}
            >
              <div className="kisem-matrix__cell-status" aria-hidden>
                {a.status === "green" && "●"}
                {a.status === "amber" && "◐"}
                {a.status === "red" && "→"}
                {a.status === "blank" && "○"}
              </div>
              <div className="kisem-matrix__cell-company">{a.company}</div>
              <div className="kisem-matrix__cell-meta">
                <span>{a.sector}</span>
                <span className="kisem-matrix__cell-sep">·</span>
                <span>{a.activity}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="kisem-matrix__legend">
          <span className="kisem-matrix__legend-item kisem-matrix__legend-item--green">
            <span aria-hidden>●</span> Underwritten
          </span>
          <span className="kisem-matrix__legend-item kisem-matrix__legend-item--amber">
            <span aria-hidden>◐</span> In progress
          </span>
          <span className="kisem-matrix__legend-item kisem-matrix__legend-item--red">
            <span aria-hidden>→</span> Routed to partner ESCO
          </span>
          <span className="kisem-matrix__legend-item kisem-matrix__legend-item--blank">
            <span aria-hidden>○</span> Not yet reviewed
          </span>
        </div>
      </div>
    </div>
  );
}
