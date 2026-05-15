"use client";

/**
 * Calibrated PI chart — a small SVG that visualises the central
 * thesis: loans are sized to the P5 floor of a calibrated 90%
 * prediction interval, not the median. The shaded area under the
 * curve from P5 rightward is "debt-service safe"; everything left of
 * P5 is the 5% tail that the sculpted amortisation + junior tranche
 * are built to absorb.
 *
 * Subtle "breath" animation on the curve so the chart has visual
 * pulse without distracting.
 */

const W = 460;
const H = 300;

// x-coords (along the kWh-savings axis) where key markers sit
const X = {
  axisLeft: 40,
  axisRight: 420,
  p5: 140, // P5 marker
  p50: 230, // P50 (median)
  p95: 380, // P95
};

const Y = {
  axisBaseline: 230,
  curvePeak: 80,
  p5Marker: 196, // height of the curve at P5 (visual proxy)
  p95Marker: 196, // height of the curve at P95
  topPad: 24,
};

// A smoothed bell-curve path approximating a Gaussian distribution
const BELL_PATH = `M ${X.axisLeft + 10} ${Y.axisBaseline}
  C ${X.axisLeft + 70} ${Y.axisBaseline},
    ${X.p5 - 10} ${Y.p5Marker + 10},
    ${X.p5} ${Y.p5Marker}
  C ${X.p5 + 40} ${Y.axisBaseline - 110},
    ${X.p50 - 30} ${Y.curvePeak},
    ${X.p50} ${Y.curvePeak}
  C ${X.p50 + 50} ${Y.curvePeak},
    ${X.p95 - 60} ${Y.p95Marker - 20},
    ${X.p95} ${Y.p95Marker}
  C ${X.p95 + 30} ${Y.p95Marker + 16},
    ${X.axisRight - 10} ${Y.axisBaseline},
    ${X.axisRight - 10} ${Y.axisBaseline}`;

// The area-under-curve fill: same path closed back along the baseline
const AREA_RIGHT_OF_P5 = `${BELL_PATH} L ${X.axisRight - 10} ${Y.axisBaseline} L ${X.p5} ${Y.axisBaseline} Z`;
const AREA_LEFT_OF_P5 = `M ${X.axisLeft + 10} ${Y.axisBaseline}
  C ${X.axisLeft + 70} ${Y.axisBaseline},
    ${X.p5 - 10} ${Y.p5Marker + 10},
    ${X.p5} ${Y.p5Marker}
  L ${X.p5} ${Y.axisBaseline} Z`;

type CalibratedPIChartProps = {
  /** Override the P5 / P50 / P95 axis labels (e.g. "76.8k", "124.5k", "172k") */
  p5Label?: string;
  p50Label?: string;
  p95Label?: string;
  /** Override the floating callout text on the P5 marker */
  calloutText?: string;
  /** Override the top-right legend strings */
  legendTitle?: string;
  legendSub?: string;
  /** Override the x-axis caption */
  axisTitle?: string;
  /** Render in compact mode for use inside a sidebar / smaller container */
  compact?: boolean;
};

export function CalibratedPIChart({
  p5Label = "P5",
  p50Label = "P50",
  p95Label = "P95",
  calloutText = "DSCR @ P5 ≥ 1.30×",
  legendTitle = "Calibrated 90% PI",
  legendSub = "R² = +0.56 LOO · split-conformal",
  axisTitle = "realised kWh savings",
  compact = false,
}: CalibratedPIChartProps = {}) {
  return (
    <div
      className={`pi-chart${compact ? " pi-chart--compact" : ""}`}
      aria-label="Calibrated 90% prediction interval visualization"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="pi-chart__svg"
      >
        <defs>
          <linearGradient id="pi-fill-safe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="pi-fill-tail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Tail-risk shaded area (left of P5) */}
        <path d={AREA_LEFT_OF_P5} fill="url(#pi-fill-tail)" />

        {/* Safe shaded area (right of P5, where debt service is covered) */}
        <path d={AREA_RIGHT_OF_P5} fill="url(#pi-fill-safe)" />

        {/* The bell curve itself */}
        <path
          d={BELL_PATH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          className="pi-chart__curve"
        />

        {/* X-axis baseline */}
        <line
          x1={X.axisLeft}
          y1={Y.axisBaseline}
          x2={X.axisRight}
          y2={Y.axisBaseline}
          stroke="color-mix(in oklab, var(--line) 90%, transparent)"
          strokeWidth="1"
        />

        {/* P5 vertical guide */}
        <line
          x1={X.p5}
          y1={Y.p5Marker - 4}
          x2={X.p5}
          y2={Y.axisBaseline}
          stroke="var(--accent)"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
        {/* P50 vertical guide */}
        <line
          x1={X.p50}
          y1={Y.curvePeak - 4}
          x2={X.p50}
          y2={Y.axisBaseline}
          stroke="color-mix(in oklab, var(--accent) 50%, transparent)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        {/* P95 vertical guide */}
        <line
          x1={X.p95}
          y1={Y.p95Marker - 4}
          x2={X.p95}
          y2={Y.axisBaseline}
          stroke="color-mix(in oklab, var(--accent) 50%, transparent)"
          strokeWidth="1"
          strokeDasharray="2 4"
        />

        {/* P5 marker dot */}
        <circle cx={X.p5} cy={Y.p5Marker} r="4.5" fill="var(--accent)" />
        {/* P50 marker dot */}
        <circle cx={X.p50} cy={Y.curvePeak} r="3.5" fill="var(--accent)" opacity="0.6" />
        {/* P95 marker dot */}
        <circle cx={X.p95} cy={Y.p95Marker} r="3.5" fill="var(--accent)" opacity="0.6" />

        {/* X-axis labels */}
        <text x={X.p5} y={Y.axisBaseline + 18} textAnchor="middle" className="pi-chart__axis-label">
          {p5Label}
        </text>
        <text x={X.p50} y={Y.axisBaseline + 18} textAnchor="middle" className="pi-chart__axis-label pi-chart__axis-label--muted">
          {p50Label}
        </text>
        <text x={X.p95} y={Y.axisBaseline + 18} textAnchor="middle" className="pi-chart__axis-label pi-chart__axis-label--muted">
          {p95Label}
        </text>

        {/* P5 callout — "DSCR @ P5 ≥ 1.30× covenant" */}
        <g className="pi-chart__callout" transform={`translate(${X.p5}, ${Y.p5Marker - 14})`}>
          <rect
            x="-82"
            y="-30"
            width="164"
            height="24"
            rx="12"
            className="pi-chart__callout-bg"
          />
          <text x="0" y="-13" textAnchor="middle" className="pi-chart__callout-text">
            {calloutText}
          </text>
        </g>

        {/* Top-right legend */}
        <g transform={`translate(${X.axisRight - 12}, ${Y.topPad + 4})`} textAnchor="end">
          <text className="pi-chart__legend-title">{legendTitle}</text>
          <text y="16" className="pi-chart__legend-sub">
            {legendSub}
          </text>
        </g>

        {/* "Tail-risk absorbed" annotation on the red area */}
        <text
          x={X.axisLeft + 50}
          y={Y.axisBaseline - 10}
          className="pi-chart__tail-label"
        >
          5% tail
        </text>

        {/* X-axis title */}
        <text
          x={(X.axisLeft + X.axisRight) / 2}
          y={H - 12}
          textAnchor="middle"
          className="pi-chart__axis-title"
        >
          {axisTitle}
        </text>
      </svg>
    </div>
  );
}
