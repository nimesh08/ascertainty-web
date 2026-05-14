"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Bankable Collateral — USD.AI-style four-state explainer with a build-up
 * narrative. Each panel highlights one of the four properties (valuable /
 * verifiable / enforceable / predictable) a lender requires of collateral.
 * The progress strip at the bottom of the stage lights up cumulatively, so
 * by the time the fourth panel is on, all four chips are sage-filled and
 * the "BANKABLE" badge fires — the eureka moment: a hope has become an
 * asset class.
 *
 * The illustrations show Ascertainty as the catalyst: each panel after the
 * first depicts the specific act (calibrated model + meter, legal
 * assignment, conformal bounds) that unlocks the property.
 */

interface Panel {
  key: "valuable" | "verifiable" | "enforceable" | "predictable";
  label: string;
  caption: string;
  inlineCaption: string;
}

const PANELS: Panel[] = [
  {
    key: "valuable",
    label: "Valuable",
    caption: "kWh saved is dollars not spent",
    inlineCaption: "kWh × $/kWh = real savings",
  },
  {
    key: "verifiable",
    label: "Verifiable",
    caption: "Physics model + IoT meters",
    inlineCaption: "Calibrated model + metered Day-30 reconciliation",
  },
  {
    key: "enforceable",
    label: "Enforceable",
    caption: "Legal claim on the utility delta",
    inlineCaption: "Measured kWh delta legally assigned to SPV",
  },
  {
    key: "predictable",
    label: "Predictable",
    caption: "90% conformal prediction bounds",
    inlineCaption: "Loan sized to the P5 floor under DSCR @ P5 ≥ 1.30×",
  },
];

export function BankableCollateral() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startCycle = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setActive((a) => (a + 1) % PANELS.length);
    }, 5500);
  }, []);

  useEffect(() => {
    startCycle();
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [startCycle]);

  // Manual click: jump to the tab and restart the 5.5s cycle so the
  // progress-bar animation stays in lockstep with the auto-advance timer.
  const select = useCallback(
    (i: number) => {
      setActive(i);
      startCycle();
    },
    [startCycle]
  );
  const allUnlocked = active === PANELS.length - 1;

  return (
    <section id="02-bankable-collateral" className="a-section">
      <div className="shell">
        <div className="a-section__head">
          <h2 className="a-section__title">
            We make{" "}
            <span style={{ color: "var(--accent)" }}>energy savings</span> a{" "}
            <span style={{ color: "var(--accent)" }}>bankable</span> asset
            class.
          </h2>
        </div>

        <div className="bc-stage" aria-live="polite">
          {PANELS.map((p, i) => (
            <div
              key={p.key}
              className={cn("bc-panel", active === i && "bc-panel--active")}
              aria-hidden={active !== i}
            >
              <div className="bc-panel__art">
                {p.key === "valuable" && <ValuableArt />}
                {p.key === "verifiable" && <VerifiableArt />}
                {p.key === "enforceable" && <EnforceableArt />}
                {p.key === "predictable" && <PredictableArt />}
              </div>
              <div className="bc-panel__inline">{p.inlineCaption}</div>
            </div>
          ))}

          {/* Progress strip: chips light cumulatively, "+" between each so
              the math reads "all four = Bankable" rather than "the last one
              alone leads to Bankable." */}
          <div className="bc-progress" aria-hidden>
            {PANELS.map((p, i) => (
              <Fragment key={p.key}>
                <span className={cn("bc-chip", i <= active && "bc-chip--lit")}>
                  <span className="bc-chip__dot" />
                  {p.label}
                </span>
                {i < PANELS.length - 1 && (
                  <span className="bc-progress__op" aria-hidden>+</span>
                )}
              </Fragment>
            ))}
            <span className="bc-progress__op bc-progress__op--equals" aria-hidden>=</span>
            <span
              className={cn(
                "bc-chip bc-chip--final",
                allUnlocked && "bc-chip--lit"
              )}
            >
              <span className="bc-chip__dot" />
              Bankable
            </span>
          </div>
        </div>

        <div className="bc-tabs" role="tablist">
          {PANELS.map((p, i) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => select(i)}
              className={cn("bc-tab", active === i && "bc-tab--active")}
            >
              <div className="bc-tab__label">{p.label}</div>
              <div className="bc-tab__caption">{p.caption}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- ART -------------------------------- */

/** Step bars rising — abstract "kWh saved" become concrete $ accumulating.
 *  Caps with a USD glyph (not ₹) since settlement is USDC and the audience
 *  is global. */
function ValuableArt() {
  return (
    <svg viewBox="0 0 480 240" className="bc-art" aria-hidden>
      <line x1="40" y1="200" x2="440" y2="200" stroke="#5fa67f" strokeWidth="1" opacity="0.35" />
      {[
        [60, 175], [108, 155], [156, 130], [204, 108],
        [252, 88], [300, 70], [348, 52], [396, 34],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="32"
          height={200 - y}
          fill="#5fa67f"
          fillOpacity={0.18 + i * 0.10}
          rx="4"
        />
      ))}
      <text
        x="438"
        y="26"
        textAnchor="end"
        fill="#5fa67f"
        fontSize="22"
        fontFamily="var(--font-display, ui-sans-serif)"
        fontWeight="500"
      >
        $
      </text>
    </svg>
  );
}

function VerifiableArt() {
  return (
    <svg viewBox="0 0 480 240" className="bc-art" aria-hidden>
      <circle cx="240" cy="120" r="80" stroke="#5fa67f" strokeWidth="1.5" fill="none" />
      <circle cx="240" cy="120" r="62" stroke="#5fa67f" strokeWidth="0.75" opacity="0.4" fill="none" />
      {Array.from({ length: 12 }).map((_, i) => {
        const deg = i * 30;
        return (
          <line
            key={i}
            x1="240"
            y1="48"
            x2="240"
            y2="56"
            stroke="#5fa67f"
            strokeWidth="1"
            opacity={i % 3 === 0 ? 0.9 : 0.4}
            transform={`rotate(${deg} 240 120)`}
          />
        );
      })}
      <line
        x1="240"
        y1="120"
        x2="240"
        y2="60"
        stroke="#5fa67f"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform="rotate(-28 240 120)"
        className="bc-needle"
      />
      <circle cx="240" cy="120" r="5" fill="#5fa67f" />
      {[1, 2, 3].map((n) => (
        <g key={n} className="bc-wave" style={{ animationDelay: `${n * 0.4}s` }}>
          <circle cx="240" cy="120" r={92 + n * 16} stroke="#5fa67f" strokeWidth="1" opacity={0.32 - n * 0.08} fill="none" />
        </g>
      ))}
    </svg>
  );
}

function EnforceableArt() {
  return (
    <svg viewBox="0 0 480 240" className="bc-art" aria-hidden>
      <rect x="160" y="30" width="200" height="180" rx="6" stroke="#5fa67f" strokeWidth="1.5" fill="none" />
      {[
        [180, 60, 130],
        [180, 78, 160],
        [180, 96, 110],
        [180, 118, 150],
        [180, 136, 120],
        [180, 158, 140],
      ].map(([x, y, w], i) => (
        <line key={i} x1={x} y1={y} x2={x + (w as number)} y2={y} stroke="#5fa67f" strokeWidth="1" opacity="0.5" />
      ))}
      <line x1="180" y1="186" x2="280" y2="186" stroke="#5fa67f" strokeWidth="1" opacity="0.7" />
      <path
        d="M 188 182 C 196 176, 204 192, 214 182 S 234 178, 244 184"
        stroke="#5fa67f"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <g transform="translate(330, 168)" className="bc-seal">
        <circle r="22" stroke="#5fa67f" strokeWidth="1.5" fill="#5fa67f" fillOpacity="0.12" />
        <circle r="14" stroke="#5fa67f" strokeWidth="0.75" fill="none" opacity="0.6" />
        <text
          y="3"
          textAnchor="middle"
          fill="#5fa67f"
          fontSize="9"
          fontFamily="var(--font-geist-mono, monospace)"
          fontWeight="600"
          letterSpacing="0.08em"
        >
          SPV
        </text>
      </g>
    </svg>
  );
}

function PredictableArt() {
  return (
    <svg viewBox="0 0 480 240" className="bc-art" aria-hidden>
      <line x1="40" y1="200" x2="440" y2="200" stroke="#5fa67f" strokeWidth="1" opacity="0.35" />
      <line x1="160" y1="40" x2="160" y2="200" stroke="#5fa67f" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.4" />
      <line x1="240" y1="40" x2="240" y2="200" stroke="#5fa67f" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.6" />
      <line x1="320" y1="40" x2="320" y2="200" stroke="#5fa67f" strokeWidth="0.75" strokeDasharray="4 4" opacity="0.4" />
      <path
        d="M 160 200 C 180 200, 200 60, 240 60 S 300 200, 320 200 Z"
        fill="#5fa67f"
        fillOpacity="0.16"
      />
      <path
        d="M 80 200 C 140 200, 180 60, 240 60 S 340 200, 400 200"
        stroke="#5fa67f"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        className="bc-curve"
      />
      <circle cx="240" cy="60" r="4" fill="#5fa67f" />
      {[
        ["P5", 160],
        ["P50", 240],
        ["P95", 320],
      ].map(([label, x]) => (
        <text
          key={label}
          x={x as number}
          y="222"
          textAnchor="middle"
          fill="#5fa67f"
          fontSize="10"
          fontFamily="var(--font-geist-mono, monospace)"
          letterSpacing="0.12em"
          opacity="0.7"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}
