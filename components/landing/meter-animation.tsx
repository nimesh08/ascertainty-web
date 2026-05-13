"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Meter Animation — landing-page hero visual.
 *
 * Inline-SVG illustration of an analog electricity meter with the Ascertainty
 * coin rotating inside, an odometer counter ticking once per second, and sage
 * particles drifting upward from the dial face. Pure SVG + minimal JS, no
 * external dependencies.
 *
 * Implementation choices vs the design-handoff HTML prototype:
 *   - Coin rotation stays as SMIL `<animateTransform>` — stateless, works
 *     reliably inside React without RAF wiring.
 *   - Counter uses useState + a single setInterval, cleaned up on unmount.
 *   - Particles spawn via the Web Animations API and remove themselves on
 *     animation finish; a single spawn interval drives the steady stream.
 *   - The 60 dial tick lines are precomputed at module load (geometry is
 *     deterministic).
 *
 * Replaces the prior `<Cube meaning={...}/>` component in the landing hero —
 * the cube was visually impressive but its 18 faces of (mostly aspirational)
 * info were redundant with §02 SYSTEM / §05 MECHANICS / /projects.
 */

const CENTER = 400;
const TICK_R_OUTER = 252;
const TICK_R_MAJOR_INNER = 238;
const TICK_R_MINOR_INNER = 246;

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const deg = i * 6;
  const rad = ((deg - 90) * Math.PI) / 180;
  const isMajor = i % 5 === 0;
  const ri = isMajor ? TICK_R_MAJOR_INNER : TICK_R_MINOR_INNER;
  return {
    x1: CENTER + Math.cos(rad) * TICK_R_OUTER,
    y1: CENTER + Math.sin(rad) * TICK_R_OUTER,
    x2: CENTER + Math.cos(rad) * ri,
    y2: CENTER + Math.sin(rad) * ri,
    sw: isMajor ? 1.4 : 0.55,
    op: isMajor ? 1 : 0.7,
  };
});

const DIGIT_POSITIONS = [-75.2, -37.6, 0, 37.6, 75.2];

const SVG_NS = "http://www.w3.org/2000/svg";

export function MeterAnimation() {
  const [counter, setCounter] = useState(1);
  const particlesRef = useRef<SVGGElement | null>(null);

  // 1 Hz odometer tick. Persists across React re-renders.
  useEffect(() => {
    const id = window.setInterval(() => {
      setCounter((c) => (c >= 99999 ? 1 : c + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Sage-green particles drifting upward from the dial face.
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    function spawn() {
      const node = particlesRef.current;
      if (!node) return;

      // Origin on the dial face, vertically biased so particles cluster
      // along the upper/lower bands rather than crowding the coin centre.
      const angle = Math.random() * Math.PI * 2;
      const radius = 95 + Math.random() * 130;
      const sx = CENTER + Math.cos(angle) * radius;
      const sy = CENTER + Math.sin(angle) * radius * 0.5;

      const drift = (Math.random() - 0.5) * 38;
      const rise = 120 + Math.random() * 140;
      const dur = 2800 + Math.random() * 1600;
      const size = 1.1 + Math.random() * 1.6;

      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", String(sx));
      c.setAttribute("cy", String(sy));
      c.setAttribute("r", size.toFixed(2));
      c.setAttribute("fill", "#5fa67f");
      c.setAttribute("opacity", "0");
      node.appendChild(c);

      const anim = c.animate(
        [
          { transform: "translate(0px, 0px)", opacity: 0 },
          {
            transform: `translate(${(drift * 0.3).toFixed(1)}px, ${(-rise * 0.25).toFixed(1)}px)`,
            opacity: 0.85,
            offset: 0.18,
          },
          {
            transform: `translate(${(drift * 0.7).toFixed(1)}px, ${(-rise * 0.6).toFixed(1)}px)`,
            opacity: 0.55,
            offset: 0.6,
          },
          {
            transform: `translate(${drift.toFixed(1)}px, ${(-rise).toFixed(1)}px)`,
            opacity: 0,
          },
        ],
        { duration: dur, easing: "cubic-bezier(.22,.7,.3,1)", fill: "forwards" }
      );
      anim.onfinish = () => c.remove();
    }

    // 6 particles on load (staggered).
    const loadTimers: number[] = [];
    for (let i = 0; i < 6; i++) {
      loadTimers.push(window.setTimeout(spawn, i * 220));
    }
    // Steady stream — ~1.4 spawns per second for a calm rhythm.
    const streamId = window.setInterval(spawn, 720);

    return () => {
      loadTimers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(streamId);
      // Strip any in-flight particles so we don't leak DOM nodes.
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, []);

  const digits = String(counter).padStart(5, "0").split("");

  return (
    <div className="meter-stage" aria-hidden>
      <svg
        viewBox="0 0 800 800"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Ascertainty meter — capital that meters itself"
      >
        <defs>
          <pattern
            id="meterDotGrid"
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="11" cy="11" r="0.9" fill="#162421" fillOpacity={0.09} />
          </pattern>
          <radialGradient id="meterGlass" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="70%" stopColor="#162421" stopOpacity={0} />
            <stop offset="100%" stopColor="#162421" stopOpacity={0.06} />
          </radialGradient>
        </defs>

        {/* Subtle dot-grid texture (no background fill — lets the page show through) */}
        <rect width="800" height="800" fill="url(#meterDotGrid)" />

        {/* Technical-drawing crop marks at corners */}
        <g stroke="#162421" strokeWidth={0.6} strokeOpacity={0.35} fill="none">
          <path d="M 40 70 L 40 40 L 70 40" />
          <path d="M 760 70 L 760 40 L 730 40" />
          <path d="M 40 730 L 40 760 L 70 760" />
          <path d="M 760 730 L 760 760 L 730 760" />
        </g>

        {/* Isometric centerlines */}
        <g stroke="#162421" strokeOpacity={0.1} strokeWidth={0.5} fill="none">
          <line x1="400" y1="60" x2="400" y2="740" />
          <line x1="60" y1="400" x2="740" y2="400" />
          <line x1="160" y1="160" x2="640" y2="640" strokeDasharray="2 4" />
          <line x1="640" y1="160" x2="160" y2="640" strokeDasharray="2 4" />
        </g>

        {/* Cylinder depth arc — suggests 3D body */}
        <g stroke="#162421" fill="none">
          <path
            d="M 110 408 C 110 468 240 480 400 480 C 560 480 690 468 690 408"
            strokeWidth={1.1}
          />
          <path
            d="M 124 416 C 200 452 600 452 676 416"
            strokeWidth={0.5}
            strokeDasharray="2 4"
          />
          <line x1="110" y1="400" x2="110" y2="412" strokeWidth={0.9} />
          <line x1="690" y1="400" x2="690" y2="412" strokeWidth={0.9} />
        </g>

        {/* Meter bezels — five concentric circles forming the housing */}
        <g stroke="#162421" fill="none">
          <circle cx="400" cy="400" r="290" strokeWidth={1.8} />
          <circle cx="400" cy="400" r="278" strokeWidth={0.6} />
          <circle cx="400" cy="400" r="270" strokeWidth={0.5} strokeOpacity={0.5} />
          <circle cx="400" cy="400" r="255" strokeWidth={1.2} />
          <circle cx="400" cy="400" r="250" strokeWidth={0.4} strokeOpacity={0.45} />
        </g>

        {/* Glass-face vignette */}
        <circle cx="400" cy="400" r="255" fill="url(#meterGlass)" />

        {/* 60 dial tick marks (12 major + 48 minor) */}
        <g stroke="#162421" strokeLinecap="butt">
          {TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1.toFixed(2)}
              y1={t.y1.toFixed(2)}
              x2={t.x2.toFixed(2)}
              y2={t.y2.toFixed(2)}
              strokeWidth={t.sw}
              strokeOpacity={t.op}
            />
          ))}
        </g>

        {/* Inner radial guide rings, faint */}
        <g stroke="#162421" strokeOpacity={0.18} strokeWidth={0.4} fill="none">
          <circle cx="400" cy="400" r="160" />
          <circle cx="400" cy="400" r="120" strokeDasharray="1 3" />
        </g>

        {/* Odometer counter window */}
        <g transform="translate(400 558)">
          <rect
            x="-104"
            y="-26"
            width="208"
            height="52"
            stroke="#162421"
            strokeWidth={0.6}
            strokeOpacity={0.5}
            fill="none"
            rx={3}
          />
          <rect
            x="-94"
            y="-22"
            width="188"
            height="44"
            stroke="#162421"
            strokeWidth={1.2}
            fill="#fafafa"
            rx={2}
          />
          <g stroke="#162421" strokeWidth={0.5} strokeOpacity={0.6}>
            <line x1="-56.4" y1="-22" x2="-56.4" y2="22" />
            <line x1="-18.8" y1="-22" x2="-18.8" y2="22" />
            <line x1="18.8" y1="-22" x2="18.8" y2="22" />
            <line x1="56.4" y1="-22" x2="56.4" y2="22" />
          </g>
          <line
            x1="-94"
            y1="0"
            x2="94"
            y2="0"
            stroke="#162421"
            strokeWidth={0.3}
            strokeOpacity={0.25}
          />
          <g
            fontFamily="ui-monospace, 'JetBrains Mono', 'IBM Plex Mono', Menlo, monospace"
            fontSize={28}
            fontWeight={500}
            fill="#162421"
            textAnchor="middle"
          >
            {digits.map((d, i) => (
              <text key={i} x={DIGIT_POSITIONS[i]} y={10}>
                {d}
              </text>
            ))}
          </g>
          <text
            fontFamily="ui-monospace, monospace"
            fontSize={10}
            fill="#162421"
            fillOpacity={0.5}
            letterSpacing={2.5}
            textAnchor="end"
            x={104}
            y={-32}
          >
            UNITS
          </text>
        </g>

        {/* Particle layer — populated imperatively by useEffect */}
        <g ref={particlesRef} />

        {/* Rotating coin (centered at 400,400). Stops + rotates around that pivot. */}
        <g>
          <circle cx="400" cy="400" r="86" fill="#fafafa" stroke="#162421" strokeWidth={1} />
          <circle
            cx="400"
            cy="400"
            r="80"
            fill="none"
            stroke="#5fa67f"
            strokeWidth={1.2}
            strokeOpacity={0.6}
          />
          <circle
            cx="400"
            cy="400"
            r="76"
            fill="none"
            stroke="#5fa67f"
            strokeWidth={0.5}
            strokeOpacity={0.35}
          />
          {/* Brand mark — three nested arcs + triangular peak, scaled 0.46 and
              translated so its visual center sits at (400, 400). */}
          <g transform="translate(344.8 332.84) scale(0.46)">
            <g fill="none" stroke="#5fa67f" strokeLinecap="butt">
              <path strokeWidth={22} d="M 28 218 A 92 44 0 0 1 212 218" />
              <path strokeWidth={16} d="M 60 154 A 60 32 0 0 1 180 154" />
              <path strokeWidth={12} d="M 85 104 A 35 18 0 0 1 155 104" />
            </g>
            <path d="M 120 30 L 140 66 L 100 66 Z" fill="#5fa67f" />
          </g>
          {/* 6-second clockwise rotation. SMIL is stateless and survives React
              re-renders without imperative wiring. */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 400 400"
            to="360 400 400"
            dur="6s"
            repeatCount="indefinite"
          />
        </g>

        {/* Fixed index pointer above the coin */}
        <g stroke="#162421" fill="#162421">
          <path d="M 400 310 L 395 300 L 405 300 Z" strokeWidth={0.6} />
        </g>
      </svg>
    </div>
  );
}
