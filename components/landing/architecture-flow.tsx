"use client";

/**
 * Architecture flow — choreographed deal-lifecycle animation matching
 * the Canva storyboard in components/landing/flowchart-svg/.
 *
 * TOPOLOGY (idle state):
 *   • Two parallel vertical channels through the diagram:
 *       LEFT (x = 400)  — dotted, DATA path (Borrowers → Ascertainty → SPV)
 *       RIGHT (x = 600) — solid, CAPITAL path (Borrowers ↔ SPV ↔ Lenders)
 *   • Ascertainty sits on the left channel mid-height; two horizontal
 *     dotted arms branch from it to a RED node (audit fail, left) and
 *     a GREEN node (audit success, right).
 *   • Two status circles at the bottom edge of the Borrowers cluster:
 *       LEFT  — IoT M&V sensor (anchors the dotted line)
 *       RIGHT — Engineering upgrade (anchors the solid line)
 *     Both start GREY (idle); both activate to GREEN simultaneously
 *     when disbursement reaches the borrower.
 *
 * ANIMATION (25-second loop, 10 phases):
 *   01  AUDIT REQUEST              (0.5 – 2.0s)   blue circle leaves borrower
 *   02  UNDERWRITING                (2.0 – 3.0s)   arrives at Ascertainty
 *   03  REJECTED · PI TOO WIDE      (3.0 – 5.0s)   left arm lights, turns red
 *   04  AUDIT RETRIED               (5.5 – 7.0s)   new blue circle starts
 *   05  APPROVED                    (7.0 – 9.5s)   right arm, turns green
 *   06  LP DEPOSIT                  (9.5 – 11.5s)  yellow circle Lenders → SPV
 *   07  DISBURSEMENT                (11.5 – 14s)   yellow SPV → Borrower
 *                                                  M&V + upgrade circles appear (grey)
 *                                                  → both go green when capital arrives
 *   08  RETROFIT LIVE · M&V ACTIVE  (14 – 16.5s)   data lines all green
 *                                                  "Capital that meters itself." caption
 *   09  REPAYMENT FROM SAVINGS      (16.5 – 19.5s) green coin Borrower → SPV
 *   10  YIELD DISTRIBUTED           (19.5 – 22.5s) green coin SPV → Lenders
 *                                   (22.5 – 25s)   reset / hold
 *
 * Reduced motion: all animated overlays hidden; static idle state remains.
 */

// ─────────────────────────────────────────────────────────────────────
// Geometry
// ─────────────────────────────────────────────────────────────────────
const VIEW = { w: 920, h: 720 };
const LOOP_S = 25;
const LOOP = `${LOOP_S}s`;

// Tightened vertical layout — borrowers/lenders sit closer to the
// container edges; channels are centred symmetrically around the
// viewBox horizontal centre (x=460).
const BORROWERS_Y = 14;
const BORROWERS_H = 100;

const CENTER_X = 460;
const CH_DATA = 370; // dotted (data) channel — 90px left of centre
const CH_CAP = 550; // solid (capital) channel — 90px right of centre

const MV_CIRCLE = { cx: CH_DATA, cy: BORROWERS_Y + BORROWERS_H + 22, r: 22 };
const UPGRADE_CIRCLE = { cx: CH_CAP, cy: BORROWERS_Y + BORROWERS_H + 22, r: 22 };

const ASC = { cx: CH_DATA, cy: 308, r: 66 };
/* Outcome nodes — equidistant from the Ascertainty coin edge so the
   audit-pass / audit-fail arms have visual symmetry. */
const NODE_GAP = 60;
const RED_NODE = { cx: ASC.cx - (ASC.r + NODE_GAP), cy: ASC.cy, r: 22 };
const GREEN_NODE = { cx: ASC.cx + (ASC.r + NODE_GAP), cy: ASC.cy, r: 22 };

const SPV = { x: 300, y: 440, w: 320, h: 140 };
const SPV_TOP_DATA = { x: CH_DATA, y: SPV.y };
const SPV_TOP_CAP = { x: CH_CAP, y: SPV.y };
const SPV_BOTTOM_CAP = { x: CH_CAP, y: SPV.y + SPV.h };

const LENDERS_Y = 612;
const LENDERS_H = 90;

// Phase windows in seconds (within the 25-second loop)
const P = {
  audit1Request: { begin: 0.5, end: 2.0 },
  audit1Underwrite: { begin: 2.0, end: 3.0 },
  audit1Reject: { begin: 3.0, end: 5.0 },
  audit2Request: { begin: 5.5, end: 7.0 },
  audit2Approve: { begin: 7.0, end: 9.5 },
  deposit: { begin: 9.5, end: 11.5 },
  disburse: { begin: 11.5, end: 14.0 },
  retrofitLive: { begin: 14.0, end: 16.5 },
  repay: { begin: 16.5, end: 19.5 },
  distribute: { begin: 19.5, end: 22.5 },
  // M&V + upgrade circles appear once the capital starts moving inward
  circlesAppearGrey: { begin: 11.5, end: 22.5 },
  // The moment when both circles flip from grey to green
  circlesActivate: { begin: 13.8, end: 22.5 },
  // Tagline callback when M&V goes live
  tagline: { begin: 14.0, end: 16.5 },
};

// Phase labels for the caption strip
const CAPTIONS = [
  { label: "01", text: "AUDIT REQUEST", phase: { begin: 0.5, end: 2.0 } },
  { label: "02", text: "UNDERWRITING", phase: { begin: 2.0, end: 3.0 } },
  { label: "03", text: "REJECTED · PI TOO WIDE", phase: { begin: 3.0, end: 5.0 } },
  { label: "04", text: "AUDIT RETRIED", phase: { begin: 5.5, end: 7.0 } },
  { label: "05", text: "APPROVED", phase: { begin: 7.0, end: 9.5 } },
  { label: "06", text: "LP DEPOSIT", phase: { begin: 9.5, end: 11.5 } },
  { label: "07", text: "DISBURSEMENT", phase: { begin: 11.5, end: 14.0 } },
  { label: "08", text: "RETROFIT LIVE · M&V ACTIVE", phase: { begin: 14.0, end: 16.5 } },
  { label: "09", text: "REPAYMENT FROM SAVINGS", phase: { begin: 16.5, end: 19.5 } },
  { label: "10", text: "YIELD DISTRIBUTED", phase: { begin: 19.5, end: 22.5 } },
];

// ─────────────────────────────────────────────────────────────────────
// Helpers — SMIL timing
// ─────────────────────────────────────────────────────────────────────
type Phase = { begin: number; end: number };

function fade(p: Phase, hold = 0.6) {
  const b = +(p.begin / LOOP_S).toFixed(4);
  const e = +(p.end / LOOP_S).toFixed(4);
  const ramp = (e - b) * (1 - hold) * 0.5;
  const inEnd = +(b + ramp).toFixed(4);
  const outStart = +(e - ramp).toFixed(4);
  const keys: number[] = [];
  const vals: number[] = [];
  if (b > 0) {
    keys.push(0);
    vals.push(0);
  }
  keys.push(b);
  vals.push(0);
  keys.push(inEnd);
  vals.push(1);
  keys.push(outStart);
  vals.push(1);
  keys.push(e);
  vals.push(0);
  if (e < 1) {
    keys.push(1);
    vals.push(0);
  }
  return { values: vals.join(";"), keyTimes: keys.join(";") };
}

function motion(p: Phase) {
  const b = +(p.begin / LOOP_S).toFixed(4);
  const e = +(p.end / LOOP_S).toFixed(4);
  const keys: number[] = [];
  const points: number[] = [];
  if (b > 0) {
    keys.push(0);
    points.push(0);
  }
  keys.push(b);
  points.push(0);
  keys.push(e);
  points.push(1);
  if (e < 1) {
    keys.push(1);
    points.push(1);
  }
  return {
    keyTimes: keys.join(";"),
    keyPoints: points.join(";"),
    calcMode: "linear",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Industry / Lender icons (reused)
// ─────────────────────────────────────────────────────────────────────
function IndustryIcon({ x, y, size = 14, kind }: { x: number; y: number; size?: number; kind: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${size / 24})`} className="arch-flow__pill-icon">
      {kind === "textile" && (
        <>
          {/* T-shirt silhouette — universal apparel */}
          <path
            d="M5 7 L 9 4 H 15 L 19 7 L 17 10 L 16 9.5 V 20 H 8 V 9.5 L 7 10 Z"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "plastics" && (
        <>
          {/* Bottle silhouette — plastic injection-mold output */}
          <path
            d="M11 3 H 13 V 5 H 14.5 L 16 8 V 19 a 1 1 0 0 1 -1 1 H 9 a 1 1 0 0 1 -1 -1 V 8 L 9.5 5 H 11 Z"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
          />
          <line x1="9" y1="12" x2="15" y2="12" strokeWidth="1" opacity="0.5" />
        </>
      )}
      {kind === "metal" && (
        <>
          {/* Anvil silhouette — metal casting */}
          <path
            d="M3 9 H 18 V 11 H 14 L 12 13 H 8 V 16 H 16 V 18 H 6 V 16 H 8 V 13 L 6 11 H 4 Z"
            strokeWidth="1.4"
            fill="none"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "food" && (
        <>
          <rect x="4" y="11" width="16" height="10" rx="2" strokeWidth="1.6" fill="none" />
          <path
            d="M8 8 q 1 -2 0 -4 M12 7 q 1 -2 0 -4 M16 8 q 1 -2 0 -4"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "lp" && (
        <>
          <path d="M3 9 L 12 4 L 21 9 v 1 h-18 z" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
          <line x1="6" y1="10" x2="6" y2="19" strokeWidth="1.4" />
          <line x1="12" y1="10" x2="12" y2="19" strokeWidth="1.4" />
          <line x1="18" y1="10" x2="18" y2="19" strokeWidth="1.4" />
          <line x1="3" y1="19" x2="21" y2="19" strokeWidth="1.4" />
        </>
      )}
      {kind === "family" && (
        <>
          <path d="M4 12 L 12 5 L 20 12 v 8 h -16 z" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <rect x="10" y="14" width="4" height="6" strokeWidth="1.3" fill="none" />
        </>
      )}
      {kind === "dao" && (
        <>
          <path d="M12 3 L 21 12 L 12 21 L 3 12 z" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <path d="M3 12 L 21 12 M12 3 L 12 21" strokeWidth="1" opacity="0.5" />
        </>
      )}
      {kind === "depin" && (
        <>
          <circle cx="12" cy="6" r="2" strokeWidth="1.4" fill="none" />
          <circle cx="6" cy="17" r="2" strokeWidth="1.4" fill="none" />
          <circle cx="18" cy="17" r="2" strokeWidth="1.4" fill="none" />
          <line x1="12" y1="8" x2="6" y2="15" strokeWidth="1.2" />
          <line x1="12" y1="8" x2="18" y2="15" strokeWidth="1.2" />
          <line x1="8" y1="17" x2="16" y2="17" strokeWidth="1.2" />
        </>
      )}
    </g>
  );
}

function SpvIcon({ x, y, size = 16, kind }: { x: number; y: number; size?: number; kind: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${size / 24})`} className="arch-flow__spv-icon">
      {kind === "tranches" && (
        <>
          <rect x="3" y="5" width="18" height="3" rx="1" fillOpacity="0.4" stroke="none" />
          <rect x="3" y="10" width="18" height="3" rx="1" fillOpacity="0.7" stroke="none" />
          <rect x="3" y="15" width="18" height="3" rx="1" stroke="none" />
        </>
      )}
      {kind === "usdc" && (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth="1.6" fill="none" />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            fontFamily="var(--font-display)"
            stroke="none"
          >
            $
          </text>
        </>
      )}
      {kind === "legal" && (
        <>
          <path d="M6 3 h9 l4 4 v14 h-13 z" fill="none" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M15 3 v4 h4" fill="none" strokeWidth="1.5" />
          <line x1="9" y1="12" x2="16" y2="12" strokeWidth="1.3" />
          <line x1="9" y1="16" x2="16" y2="16" strokeWidth="1.3" />
        </>
      )}
    </g>
  );
}

function MeterIcon({ x, y, size = 20 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${size / 24})`}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.7" fill="none" />
      <path d="M12 12 L 18 7" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="3" x2="12" y2="5" strokeWidth="1.4" />
      <line x1="21" y1="12" x2="19" y2="12" strokeWidth="1.4" />
      <line x1="3" y1="12" x2="5" y2="12" strokeWidth="1.4" />
    </g>
  );
}

function WrenchIcon({ x, y, size = 20 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${size / 24})`}>
      <path
        d="M14 4 a 5 5 0 0 0 -4.5 7 l-7 7 v 3 h 3 l 7 -7 a 5 5 0 0 0 7 -4.5 l-3.5 3.5 l-3 -3 z"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

function CoinStack({ x, y, size = 20 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${size / 24})`}>
      <ellipse cx="12" cy="7" rx="7" ry="2.6" fill="currentColor" stroke="none" />
      <path
        d="M5 7 v4 c0 1.4 3.1 2.6 7 2.6 s7 -1.2 7 -2.6 v-4"
        fill="currentColor"
        stroke="none"
        fillOpacity="0.7"
      />
      <path
        d="M5 12 v4 c0 1.4 3.1 2.6 7 2.6 s7 -1.2 7 -2.6 v-4"
        fill="currentColor"
        stroke="none"
      />
    </g>
  );
}

function DocIcon({ x, y, size = 18 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${size / 24})`}>
      <path d="M7 3 h8 l4 4 v14 h-12 z" strokeWidth="1.6" fill="currentColor" stroke="none" fillOpacity="0.95" />
    </g>
  );
}

function XIcon({ x, y, size = 16 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${size / 24})`}>
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function CheckIcon({ x, y, size = 16 }: { x: number; y: number; size?: number }) {
  return (
    <g transform={`translate(${x - size / 2},${y - size / 2}) scale(${size / 24})`}>
      <path
        d="M5 12 L 10 17 L 19 7"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

function AscentMark({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const scale = size / 240;
  const x = cx - size / 2;
  const y = cy - size / 2;
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} className="arch-flow__brand">
      <g fill="none" stroke="currentColor" strokeLinecap="butt">
        <path strokeWidth="22" d="M 28 218 A 92 44 0 0 1 212 218" />
        <path strokeWidth="16" d="M 60 154 A 60 32 0 0 1 180 154" />
        <path strokeWidth="12" d="M 85 104 A 35 18 0 0 1 155 104" />
      </g>
      <path d="M 120 30 L 140 66 L 100 66 Z" fill="currentColor" />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pill helper for cluster contents
// ─────────────────────────────────────────────────────────────────────
function Pill({
  x,
  y,
  w,
  h,
  iconKind,
  label,
  isEllipsis = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  iconKind?: string;
  label: string;
  isEllipsis?: boolean;
}) {
  return (
    <g className={`arch-flow__pill${isEllipsis ? " arch-flow__pill--ellipsis" : ""}`}>
      <rect x={x} y={y} width={w} height={h} rx={8} className="arch-flow__pill-bg" />
      {iconKind && <IndustryIcon x={x + 10} y={y + (h - 14) / 2} size={14} kind={iconKind} />}
      <text
        x={iconKind ? x + 30 : x + w / 2}
        y={y + h / 2 + 4}
        textAnchor={iconKind ? "start" : "middle"}
        className="arch-flow__pill-label"
      >
        {label}
      </text>
    </g>
  );
}

function ClusterLabel({
  x,
  y,
  text,
  kind,
}: {
  x: number;
  y: number;
  text: string;
  kind: "borrowers" | "lenders" | "vault";
}) {
  const w = text.length * 7 + 18;
  return (
    <g className={`arch-flow__cluster-label arch-flow__cluster-label--${kind}`}>
      <rect x={x} y={y} width={w} height="22" rx="11" />
      <text x={x + w / 2} y={y + 15} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

const INDUSTRIES = [
  { kind: "textile", label: "Textile & apparel" },
  { kind: "plastics", label: "Plastics & molding" },
  { kind: "metal", label: "Metal casting" },
  { kind: "food", label: "Food processing" },
];

const LENDER_TYPES = [
  { kind: "lp", label: "Institutional LPs" },
  { kind: "family", label: "Family offices" },
  { kind: "dao", label: "Crypto-native DAOs" },
  { kind: "depin", label: "DePIN credit funds" },
];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────
export function ArchitectureFlow() {
  const pillW = 162;
  const pillH = 32;
  const pillGap = 12;
  const pillStartX = 60;

  // Anchor points for animateMotion paths
  const BORROWER_DATA_OUT = { x: CH_DATA, y: BORROWERS_Y + BORROWERS_H + 44 }; // just below M&V circle
  const BORROWER_CAP_OUT = { x: CH_CAP, y: BORROWERS_Y + BORROWERS_H + 44 }; // just below Upgrade circle
  const ASC_TOP = { x: ASC.cx, y: ASC.cy - ASC.r };
  const ASC_BOTTOM = { x: ASC.cx, y: ASC.cy + ASC.r };
  const ASC_LEFT = { x: ASC.cx - ASC.r, y: ASC.cy };
  const ASC_RIGHT = { x: ASC.cx + ASC.r, y: ASC.cy };

  return (
    <div className="arch-flow">
      <svg
        className="arch-flow__svg"
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Animated lifecycle of an Ascertainty deal: audit request, underwriting, approval (or rejection), LP deposit, disbursement, retrofit going live with IoT M&V, repayment, and yield distribution."
      >
        <defs>
          {/* Clip paths for the rounded cluster + SPV image backgrounds */}
          <clipPath id="af-clip-borrowers">
            <rect x="40" y={BORROWERS_Y} width="840" height={BORROWERS_H} rx="14" />
          </clipPath>
          <clipPath id="af-clip-lenders">
            <rect x="40" y={LENDERS_Y} width="840" height={LENDERS_H} rx="14" />
          </clipPath>
          <clipPath id="af-clip-spv">
            <rect x={SPV.x} y={SPV.y} width={SPV.w} height={SPV.h} rx="18" />
          </clipPath>
          {/* Motion paths — referenced by animateMotion below */}
          <path
            id="ap-borrower-to-asc"
            d={`M ${BORROWER_DATA_OUT.x} ${BORROWER_DATA_OUT.y} L ${ASC_TOP.x} ${ASC_TOP.y}`}
          />
          <path
            id="ap-asc-to-red"
            d={`M ${ASC.cx} ${ASC.cy} L ${RED_NODE.cx} ${RED_NODE.cy}`}
          />
          <path
            id="ap-asc-to-green"
            d={`M ${ASC.cx} ${ASC.cy} L ${GREEN_NODE.cx} ${GREEN_NODE.cy}`}
          />
          <path
            id="ap-lender-to-spv"
            d={`M ${CH_CAP} ${LENDERS_Y} L ${CH_CAP} ${SPV_BOTTOM_CAP.y}`}
          />
          <path
            id="ap-spv-to-borrower"
            d={`M ${SPV_TOP_CAP.x} ${SPV_TOP_CAP.y} L ${BORROWER_CAP_OUT.x} ${BORROWER_CAP_OUT.y}`}
          />
          <path
            id="ap-borrower-to-spv"
            d={`M ${BORROWER_CAP_OUT.x} ${BORROWER_CAP_OUT.y} L ${SPV_TOP_CAP.x} ${SPV_TOP_CAP.y}`}
          />
          <path
            id="ap-spv-to-lender"
            d={`M ${SPV_BOTTOM_CAP.x} ${SPV_BOTTOM_CAP.y} L ${CH_CAP} ${LENDERS_Y}`}
          />
        </defs>

        {/* ─── Base lines (always visible) ───────────────────────── */}
        {/* Left dotted: Borrowers (below M&V circle) → Ascertainty top → Ascertainty bottom → SPV top */}
        <line
          x1={CH_DATA}
          y1={BORROWER_DATA_OUT.y}
          x2={CH_DATA}
          y2={ASC_TOP.y}
          className="arch-flow__base-line arch-flow__base-line--dotted"
        />
        <line
          x1={CH_DATA}
          y1={ASC_BOTTOM.y}
          x2={CH_DATA}
          y2={SPV_TOP_DATA.y}
          className="arch-flow__base-line arch-flow__base-line--dotted"
        />
        {/* Ascertainty horizontal arms */}
        <line
          x1={ASC_LEFT.x}
          y1={ASC_LEFT.y}
          x2={RED_NODE.cx + RED_NODE.r}
          y2={ASC.cy}
          className="arch-flow__base-line arch-flow__base-line--dotted"
        />
        <line
          x1={ASC_RIGHT.x}
          y1={ASC_RIGHT.y}
          x2={GREEN_NODE.cx - GREEN_NODE.r}
          y2={ASC.cy}
          className="arch-flow__base-line arch-flow__base-line--dotted"
        />
        {/* Right solid: Borrowers (below Upgrade circle) → SPV top → SPV bottom → Lenders */}
        <line
          x1={CH_CAP}
          y1={BORROWER_CAP_OUT.y}
          x2={CH_CAP}
          y2={SPV_TOP_CAP.y}
          className="arch-flow__base-line arch-flow__base-line--solid"
        />
        <line
          x1={CH_CAP}
          y1={SPV_BOTTOM_CAP.y}
          x2={CH_CAP}
          y2={LENDERS_Y}
          className="arch-flow__base-line arch-flow__base-line--solid"
        />

        {/* ─── Borrowers cluster ─────────────────────────────────── */}
        <g className="arch-flow__cluster" data-kind="borrowers">
          <rect
            x="40"
            y={BORROWERS_Y}
            width="840"
            height={BORROWERS_H}
            rx="14"
            className="arch-flow__cluster-frame"
          />
          {/* Background image — industrial factory atmosphere, faded */}
          <image
            href="/images/flow-borrowers.webp"
            x="40"
            y={BORROWERS_Y}
            width="840"
            height={BORROWERS_H}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#af-clip-borrowers)"
            className="arch-flow__cluster-bg-img"
          />
          <ClusterLabel x={60} y={BORROWERS_Y - 11} text="Borrowers" kind="borrowers" />
          {INDUSTRIES.map((ind, i) => (
            <Pill
              key={ind.kind}
              x={pillStartX + i * (pillW + pillGap)}
              y={BORROWERS_Y + 38}
              w={pillW}
              h={pillH}
              iconKind={ind.kind}
              label={ind.label}
            />
          ))}
          <Pill
            x={pillStartX + INDUSTRIES.length * (pillW + pillGap)}
            y={BORROWERS_Y + 38}
            w={70}
            h={pillH}
            label="+ more"
            isEllipsis
          />
        </g>

        {/* ─── M&V + Engineering Upgrade status circles ─────────── */}
        {/* Both start at opacity 0; appear (grey) during disburse phase
            and stay visible till the end of the loop. They flip from
            grey to green when capital reaches the borrower. */}
        <g className="arch-flow__status-grey" opacity="0">
          <circle cx={MV_CIRCLE.cx} cy={MV_CIRCLE.cy} r={MV_CIRCLE.r} className="arch-flow__status-bg-grey" />
          <g className="arch-flow__status-icon-grey">
            <MeterIcon x={MV_CIRCLE.cx} y={MV_CIRCLE.cy} size={22} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.circlesAppearGrey, 0.96)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </g>
        <g className="arch-flow__status-grey" opacity="0">
          <circle cx={UPGRADE_CIRCLE.cx} cy={UPGRADE_CIRCLE.cy} r={UPGRADE_CIRCLE.r} className="arch-flow__status-bg-grey" />
          <g className="arch-flow__status-icon-grey">
            <WrenchIcon x={UPGRADE_CIRCLE.cx} y={UPGRADE_CIRCLE.cy} size={22} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.circlesAppearGrey, 0.96)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </g>
        {/* Green-active overlays for both circles */}
        <g className="arch-flow__status-green" opacity="0">
          <circle cx={MV_CIRCLE.cx} cy={MV_CIRCLE.cy} r={MV_CIRCLE.r} className="arch-flow__status-bg-green" />
          <g className="arch-flow__status-icon-green">
            <MeterIcon x={MV_CIRCLE.cx} y={MV_CIRCLE.cy} size={22} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.circlesActivate, 0.96)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </g>
        <g className="arch-flow__status-green" opacity="0">
          <circle cx={UPGRADE_CIRCLE.cx} cy={UPGRADE_CIRCLE.cy} r={UPGRADE_CIRCLE.r} className="arch-flow__status-bg-green" />
          <g className="arch-flow__status-icon-green">
            <WrenchIcon x={UPGRADE_CIRCLE.cx} y={UPGRADE_CIRCLE.cy} size={22} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.circlesActivate, 0.96)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </g>

        {/* ─── Ascertainty coin (always visible) ─────────────────── */}
        <g className="arch-flow__coin">
          <circle cx={ASC.cx} cy={ASC.cy} r={ASC.r + 4} className="arch-flow__coin-ring" />
          <circle cx={ASC.cx} cy={ASC.cy} r={ASC.r} className="arch-flow__coin-body" />
          <g className="arch-flow__coin-brand">
            <AscentMark cx={ASC.cx} cy={ASC.cy} size={62} />
          </g>
        </g>

        {/* ─── Red + Green outcome nodes (always visible idle) ──── */}
        <g className="arch-flow__outcome arch-flow__outcome--red">
          <circle cx={RED_NODE.cx} cy={RED_NODE.cy} r={RED_NODE.r} className="arch-flow__outcome-bg" />
          <g className="arch-flow__outcome-icon">
            <XIcon x={RED_NODE.cx} y={RED_NODE.cy} size={14} />
          </g>
        </g>
        <g className="arch-flow__outcome arch-flow__outcome--green">
          <circle cx={GREEN_NODE.cx} cy={GREEN_NODE.cy} r={GREEN_NODE.r} className="arch-flow__outcome-bg" />
          <g className="arch-flow__outcome-icon">
            <CheckIcon x={GREEN_NODE.cx} y={GREEN_NODE.cy} size={14} />
          </g>
        </g>

        {/* ─── Vault SPV card (always visible) ───────────────────── */}
        <g className="arch-flow__node arch-flow__node--vault">
          <rect
            x={SPV.x}
            y={SPV.y}
            width={SPV.w}
            height={SPV.h}
            rx="18"
            className="arch-flow__node-bg"
          />
          {/* Background image — hexagonal lattice / RWA atmosphere */}
          <image
            href="/images/flow-vaults.webp"
            x={SPV.x}
            y={SPV.y}
            width={SPV.w}
            height={SPV.h}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#af-clip-spv)"
            className="arch-flow__cluster-bg-img"
          />
          {/* Vault label pill — centred on the SPV card so it clears
              both the data channel (x=370) and the capital rail
              (x=550) which pass through the card's top edge. */}
          <ClusterLabel
            x={SPV.x + (SPV.w - (`Vault`.length * 7 + 18)) / 2}
            y={SPV.y - 11}
            text="Vault"
            kind="vault"
          />
          {/* Three feature pills with icons — replaces the bullet list
              for visual consistency with the other clusters */}
          {/* Pill 1 — Tranches */}
          <g className="arch-flow__spv-row">
            <rect
              x={SPV.x + 16}
              y={SPV.y + 20}
              width={SPV.w - 32}
              height="30"
              rx="8"
              className="arch-flow__pill-bg"
            />
            <SpvIcon x={SPV.x + 26} y={SPV.y + 27} size={16} kind="tranches" />
            <text
              x={SPV.x + 50}
              y={SPV.y + 39}
              className="arch-flow__pill-label"
            >
              Senior + junior tranches
            </text>
          </g>
          {/* Pill 2 — USDC custody */}
          <g className="arch-flow__spv-row">
            <rect
              x={SPV.x + 16}
              y={SPV.y + 56}
              width={SPV.w - 32}
              height="30"
              rx="8"
              className="arch-flow__pill-bg"
            />
            <SpvIcon x={SPV.x + 26} y={SPV.y + 63} size={16} kind="usdc" />
            <text
              x={SPV.x + 50}
              y={SPV.y + 75}
              className="arch-flow__pill-label"
            >
              USDC custody · on-chain
            </text>
          </g>
          {/* Pill 3 — Legal claim */}
          <g className="arch-flow__spv-row">
            <rect
              x={SPV.x + 16}
              y={SPV.y + 92}
              width={SPV.w - 32}
              height="30"
              rx="8"
              className="arch-flow__pill-bg"
            />
            <SpvIcon x={SPV.x + 26} y={SPV.y + 99} size={16} kind="legal" />
            <text
              x={SPV.x + 50}
              y={SPV.y + 111}
              className="arch-flow__pill-label"
            >
              Legal claim on kWh delta
            </text>
          </g>
        </g>

        {/* ─── Lenders cluster ───────────────────────────────────── */}
        <g className="arch-flow__cluster" data-kind="lenders">
          <rect
            x="40"
            y={LENDERS_Y}
            width="840"
            height={LENDERS_H}
            rx="14"
            className="arch-flow__cluster-frame"
          />
          {/* Background image — golden coin / yield atmosphere */}
          <image
            href="/images/flow-lenders.webp"
            x="40"
            y={LENDERS_Y}
            width="840"
            height={LENDERS_H}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#af-clip-lenders)"
            className="arch-flow__cluster-bg-img"
          />
          <ClusterLabel x={60} y={LENDERS_Y - 11} text="Lenders" kind="lenders" />
          {LENDER_TYPES.map((lt, i) => (
            <Pill
              key={lt.kind}
              x={pillStartX + i * (pillW + pillGap)}
              y={LENDERS_Y + 32}
              w={pillW}
              h={pillH}
              iconKind={lt.kind}
              label={lt.label}
            />
          ))}
          <Pill
            x={pillStartX + LENDER_TYPES.length * (pillW + pillGap)}
            y={LENDERS_Y + 32}
            w={70}
            h={pillH}
            label="+ more"
            isEllipsis
          />
        </g>

        {/* ─── Animated coloured line overlays (per phase) ────────── */}
        {/* Phase 1+2: blue line Borrower → Ascertainty (active) */}
        <line
          x1={CH_DATA}
          y1={BORROWER_DATA_OUT.y}
          x2={CH_DATA}
          y2={ASC_TOP.y}
          className="arch-flow__active-line arch-flow__active-line--blue"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade({ begin: P.audit1Request.begin, end: P.audit1Underwrite.end }, 0.7)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>
        <line
          x1={CH_DATA}
          y1={BORROWER_DATA_OUT.y}
          x2={CH_DATA}
          y2={ASC_TOP.y}
          className="arch-flow__active-line arch-flow__active-line--blue"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.audit2Request, 0.7)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 3: red line Ascertainty → red node */}
        <line
          x1={ASC.cx}
          y1={ASC.cy}
          x2={RED_NODE.cx}
          y2={RED_NODE.cy}
          className="arch-flow__active-line arch-flow__active-line--red"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.audit1Reject, 0.6)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 5: green line Ascertainty → green node */}
        <line
          x1={ASC.cx}
          y1={ASC.cy}
          x2={GREEN_NODE.cx}
          y2={GREEN_NODE.cy}
          className="arch-flow__active-line arch-flow__active-line--green"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.audit2Approve, 0.6)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 6: yellow line Lenders → SPV (right channel, bottom half) */}
        <line
          x1={CH_CAP}
          y1={LENDERS_Y}
          x2={CH_CAP}
          y2={SPV_BOTTOM_CAP.y}
          className="arch-flow__active-line arch-flow__active-line--yellow"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.deposit, 0.6)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 7: yellow line SPV → Borrower (right channel, top half) */}
        <line
          x1={CH_CAP}
          y1={BORROWER_CAP_OUT.y}
          x2={CH_CAP}
          y2={SPV_TOP_CAP.y}
          className="arch-flow__active-line arch-flow__active-line--yellow"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.disburse, 0.5)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 8: ALL data + capital-back lines GREEN (retrofit live, M&V running) */}
        <line
          x1={CH_DATA}
          y1={BORROWER_DATA_OUT.y}
          x2={CH_DATA}
          y2={ASC_TOP.y}
          className="arch-flow__active-line arch-flow__active-line--green-blink"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.retrofitLive, 0.5)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>
        <line
          x1={CH_DATA}
          y1={ASC_BOTTOM.y}
          x2={CH_DATA}
          y2={SPV_TOP_DATA.y}
          className="arch-flow__active-line arch-flow__active-line--green-blink"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.retrofitLive, 0.5)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 9: green line Borrower → SPV (capital channel, repayment) */}
        <line
          x1={CH_CAP}
          y1={BORROWER_CAP_OUT.y}
          x2={CH_CAP}
          y2={SPV_TOP_CAP.y}
          className="arch-flow__active-line arch-flow__active-line--green"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.repay, 0.6)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* Phase 10: green line SPV → Lenders (distribution) */}
        <line
          x1={CH_CAP}
          y1={SPV_BOTTOM_CAP.y}
          x2={CH_CAP}
          y2={LENDERS_Y}
          className="arch-flow__active-line arch-flow__active-line--green"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            {...fade(P.distribute, 0.6)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </line>

        {/* ─── Travelling particles ──────────────────────────────── */}
        {/* Phase 1: blue audit-request circle Borrower → Ascertainty */}
        <g opacity="0">
          <circle r="13" className="arch-flow__bubble arch-flow__bubble--blue" />
          <g className="arch-flow__bubble-icon">
            <DocIcon x={0} y={0} size={14} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.audit1Request, 0.2)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.audit1Request)}>
            <mpath href="#ap-borrower-to-asc" />
          </animateMotion>
        </g>

        {/* Phase 3: blue → red transition. Particle moves Ascertainty → red node */}
        <g opacity="0">
          <circle r="13" className="arch-flow__bubble arch-flow__bubble--red" />
          <g className="arch-flow__bubble-icon">
            <XIcon x={0} y={0} size={12} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.audit1Reject, 0.4)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.audit1Reject)}>
            <mpath href="#ap-asc-to-red" />
          </animateMotion>
        </g>

        {/* Phase 4: blue audit-request again Borrower → Ascertainty (retry) */}
        <g opacity="0">
          <circle r="13" className="arch-flow__bubble arch-flow__bubble--blue" />
          <g className="arch-flow__bubble-icon">
            <DocIcon x={0} y={0} size={14} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.audit2Request, 0.2)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.audit2Request)}>
            <mpath href="#ap-borrower-to-asc" />
          </animateMotion>
        </g>

        {/* Phase 5: blue → green transition. Particle moves Ascertainty → green node */}
        <g opacity="0">
          <circle r="13" className="arch-flow__bubble arch-flow__bubble--green" />
          <g className="arch-flow__bubble-icon">
            <CheckIcon x={0} y={0} size={12} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.audit2Approve, 0.4)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.audit2Approve)}>
            <mpath href="#ap-asc-to-green" />
          </animateMotion>
        </g>

        {/* Phase 6: yellow coin Lenders → SPV (deposit) */}
        <g opacity="0">
          <circle r="14" className="arch-flow__bubble arch-flow__bubble--yellow" />
          <g className="arch-flow__bubble-icon">
            <CoinStack x={0} y={0} size={18} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.deposit, 0.2)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.deposit)}>
            <mpath href="#ap-lender-to-spv" />
          </animateMotion>
        </g>

        {/* Phase 7: yellow coin SPV → Borrower (disbursement) */}
        <g opacity="0">
          <circle r="14" className="arch-flow__bubble arch-flow__bubble--yellow" />
          <g className="arch-flow__bubble-icon">
            <CoinStack x={0} y={0} size={18} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.disburse, 0.25)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.disburse)}>
            <mpath href="#ap-spv-to-borrower" />
          </animateMotion>
        </g>

        {/* Phase 9: green coin Borrower → SPV (repayment from savings) */}
        <g opacity="0">
          <circle r="14" className="arch-flow__bubble arch-flow__bubble--green" />
          <g className="arch-flow__bubble-icon">
            <CoinStack x={0} y={0} size={18} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.repay, 0.25)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.repay)}>
            <mpath href="#ap-borrower-to-spv" />
          </animateMotion>
        </g>

        {/* Phase 10: green coin SPV → Lenders (distribution) */}
        <g opacity="0">
          <circle r="14" className="arch-flow__bubble arch-flow__bubble--green" />
          <g className="arch-flow__bubble-icon">
            <CoinStack x={0} y={0} size={18} />
          </g>
          <animate
            attributeName="opacity"
            {...fade(P.distribute, 0.25)}
            dur={LOOP}
            repeatCount="indefinite"
          />
          <animateMotion dur={LOOP} repeatCount="indefinite" {...motion(P.distribute)}>
            <mpath href="#ap-spv-to-lender" />
          </animateMotion>
        </g>

        {/* ─── "Capital that meters itself." tagline callback ──────
             Centred on the data channel so it visually anchors to the
             dotted line it overlays. */}
        <g opacity="0" className="arch-flow__tagline">
          <text
            x={MV_CIRCLE.cx}
            y={MV_CIRCLE.cy + 52}
            textAnchor="middle"
            className="arch-flow__tagline-text"
          >
            Capital that{" "}
            <tspan className="arch-flow__tagline-em">meters</tspan>
            {" "}itself.
          </text>
          <animate
            attributeName="opacity"
            {...fade(P.tagline, 0.5)}
            dur={LOOP}
            repeatCount="indefinite"
          />
        </g>

        {/* ─── Caption strip — sits to the RIGHT of the Ascertainty
             coin, on the same horizontal line as the coin's centre.
             Anchored well clear of every flow line so the captions
             never block the visual narrative. */}
        <g className="arch-flow__captions" transform={`translate(740, ${ASC.cy})`}>
          {/* Pill background so the caption reads as a distinct UI element */}
          <rect
            x="-140"
            y="-15"
            width="280"
            height="30"
            rx="15"
            className="arch-flow__caption-bg"
          />
          {CAPTIONS.map((c) => (
            <g key={c.label} opacity="0">
              <text x="0" y="4" textAnchor="middle" className="arch-flow__caption">
                <tspan className="arch-flow__caption-num">{c.label}</tspan>
                <tspan dx="14" className="arch-flow__caption-text">
                  {c.text}
                </tspan>
              </text>
              <animate
                attributeName="opacity"
                {...fade(c.phase, 0.65)}
                dur={LOOP}
                repeatCount="indefinite"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
