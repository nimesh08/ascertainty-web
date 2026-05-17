"use client";

/**
 * PINN architecture diagram — /approach hero sidecar.
 *
 * Visual layered left-to-right:
 *   1. Inputs (21 audit features, grouped into 5 tiles)
 *   2. PINN unified backbone (single big box, key spec callouts)
 *   3. Per-ECM heads → calibrated 90% PI distribution per ECM
 *
 * Dots travel along the connecting paths so the diagram has a
 * "data flowing through the model" feel without being noisy.
 * Matches CalibratedPIChart's 460x300 viewBox so the hero sidecar
 * lays out identically across persona pages.
 */

const W = 460;
const H = 300;

// Input feature groups (5 tiles representing the 21 audit features).
// Y positions centered on the PINN backbone midline (y=150) so the
// whole diagram is symmetric around the horizontal spine.
const INPUTS: Array<{ y: number; label: string }> = [
  { y: 80, label: "Building · area, age" },
  { y: 115, label: "Baseline · kWh, tariff" },
  { y: 150, label: "Equipment · class, count" },
  { y: 185, label: "Occupancy · profile" },
  { y: 220, label: "Tenor · schedule" },
];

const TILE_W = 132;
const TILE_H = 26;
const TILE_X = 16;

const BACK_X = TILE_X + TILE_W + 30; // ~178
const BACK_W = 124;
const BACK_Y = 84;
const BACK_H = 132;

const OUT_X = BACK_X + BACK_W + 28; // ~330
const OUT_W = 114;

export function PinnArchitecture() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="pinn-arch"
      role="img"
      aria-label="PINN architecture: 21 audit features → unified 72-ECM backbone → calibrated 90% prediction interval per ECM"
    >
      {/* Column headers — centered above each column's content */}
      <text
        x={TILE_X + TILE_W / 2}
        y={20}
        textAnchor="middle"
        className="pinn-arch__col-label"
      >
        21 features
      </text>
      <text
        x={BACK_X + BACK_W / 2}
        y={20}
        textAnchor="middle"
        className="pinn-arch__col-label"
      >
        Backbone
      </text>
      <text
        x={OUT_X + OUT_W / 2}
        y={20}
        textAnchor="middle"
        className="pinn-arch__col-label"
      >
        72 ECM heads
      </text>

      {/* INPUTS — 5 feature tiles */}
      {INPUTS.map((it, i) => (
        <g key={i}>
          <rect
            x={TILE_X}
            y={it.y - TILE_H / 2}
            width={TILE_W}
            height={TILE_H}
            rx={4}
            fill="var(--bg-1)"
            stroke="var(--line)"
            strokeWidth={1}
          />
          <text
            x={TILE_X + 10}
            y={it.y + 4}
            className="pinn-arch__tile-label"
          >
            {it.label}
          </text>
        </g>
      ))}

      {/* Connector lines: inputs → backbone */}
      {INPUTS.map((it, i) => (
        <path
          key={`in-${i}`}
          d={`M${TILE_X + TILE_W},${it.y} C${TILE_X + TILE_W + 18},${it.y} ${BACK_X - 18},${BACK_Y + BACK_H / 2} ${BACK_X},${BACK_Y + BACK_H / 2}`}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={0.8}
          opacity={0.55}
        />
      ))}

      {/* BACKBONE — PINN unified box */}
      <rect
        x={BACK_X}
        y={BACK_Y}
        width={BACK_W}
        height={BACK_H}
        rx={10}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth={1.5}
      />
      <text
        x={BACK_X + BACK_W / 2}
        y={BACK_Y + 30}
        textAnchor="middle"
        className="pinn-arch__backbone-title"
      >
        PINN
      </text>
      <text
        x={BACK_X + BACK_W / 2}
        y={BACK_Y + 50}
        textAnchor="middle"
        className="pinn-arch__backbone-sub"
      >
        unified
      </text>
      {/* Spine line at exact backbone midheight (y=150) so the
          animated particle visibly travels along it. */}
      <line
        x1={BACK_X + 16}
        y1={150}
        x2={BACK_X + BACK_W - 16}
        y2={150}
        stroke="var(--accent)"
        strokeWidth={1}
        opacity={0.55}
      />
      <text
        x={BACK_X + BACK_W / 2}
        y={BACK_Y + 88}
        textAnchor="middle"
        className="pinn-arch__backbone-spec"
      >
        72-ECM corpus
      </text>
      <text
        x={BACK_X + BACK_W / 2}
        y={BACK_Y + 104}
        textAnchor="middle"
        className="pinn-arch__backbone-spec"
      >
        21 features
      </text>
      <text
        x={BACK_X + BACK_W / 2}
        y={BACK_Y + 120}
        textAnchor="middle"
        className="pinn-arch__backbone-spec"
      >
        per-ECM σ
      </text>

      {/* Connector lines: backbone → output */}
      {[60, 100, 150, 200, 240].map((y, i) => (
        <path
          key={`out-${i}`}
          d={`M${BACK_X + BACK_W},${BACK_Y + BACK_H / 2} C${BACK_X + BACK_W + 14},${BACK_Y + BACK_H / 2} ${OUT_X - 14},${y} ${OUT_X},${y}`}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={0.8}
          opacity={0.45}
        />
      ))}

      {/* OUTPUTS — calibrated distribution preview */}
      {/* Curve: a small gaussian-ish shape */}
      <g>
        {/* Filled area under curve */}
        <path
          d={`M${OUT_X},220
              C${OUT_X + 20},220 ${OUT_X + 28},108 ${OUT_X + 56},108
              C${OUT_X + 84},108 ${OUT_X + 94},220 ${OUT_X + OUT_W},220 Z`}
          fill="var(--accent-soft)"
          opacity={0.6}
        />
        {/* Curve outline */}
        <path
          d={`M${OUT_X},220
              C${OUT_X + 20},220 ${OUT_X + 28},108 ${OUT_X + 56},108
              C${OUT_X + 84},108 ${OUT_X + 94},220 ${OUT_X + OUT_W},220`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
        {/* Baseline */}
        <line
          x1={OUT_X}
          y1={220}
          x2={OUT_X + OUT_W}
          y2={220}
          stroke="var(--line-strong)"
          strokeWidth={1}
        />
        {/* P5 / P50 / P95 ticks */}
        {[
          { x: OUT_X + 22, label: "P5" },
          { x: OUT_X + 56, label: "P50" },
          { x: OUT_X + 92, label: "P95" },
        ].map((tk) => (
          <g key={tk.label}>
            <line
              x1={tk.x}
              y1={216}
              x2={tk.x}
              y2={224}
              stroke="var(--accent-deep)"
              strokeWidth={1.2}
            />
            <text
              x={tk.x}
              y={236}
              textAnchor="middle"
              className="pinn-arch__output-tick"
            >
              {tk.label}
            </text>
          </g>
        ))}
        {/* Floor callout */}
        <rect
          x={OUT_X}
          y={252}
          width={OUT_W}
          height={28}
          rx={4}
          fill="var(--accent)"
        />
        <text
          x={OUT_X + OUT_W / 2}
          y={269}
          textAnchor="middle"
          className="pinn-arch__output-callout"
        >
          Calibrated 90% PI
        </text>
      </g>

      {/* Data dot — travels strictly along the spine: middle input
          connector (grey, horizontal) → PINN divider line (green,
          horizontal) → middle output connector (grey, horizontal).
          animateMotion + path keeps it on the visible lines. */}
      <circle r={4} fill="var(--accent)">
        <animateMotion
          dur="3.6s"
          repeatCount="indefinite"
          path={`M${TILE_X + TILE_W},150 L${OUT_X},150`}
        />
        <animate
          attributeName="opacity"
          dur="3.6s"
          values="0;1;1;0"
          keyTimes="0;0.08;0.88;1"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
