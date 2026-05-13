# Ascertainty — Brand & Logo Integration Handoff

This package hands off the **finalized Ascertainty visual identity** to a developer using Claude Code (or any developer) so it can be integrated into the live `ascertainty-web` Next.js codebase at `ascertainty.com`.

---

## Overview

The brand identity centers on **a struck-coin logomark** — three nested arcs ascending to a triangular peak, inscribed in a dark forest-green disc with a sage-green ring. It carries an embedded animation (the arcs grow in sequentially) that loops continuously *and* replays each time the user scrolls a tunable distance.

Everything in this folder needs to land in the existing codebase:

| Surface | Status | Target in repo |
|---|---|---|
| Header logo (animated coin, replaces old hex mark) | replace | `components/nav-bar.tsx` |
| Site favicon stack (16 → 1024 + apple-touch) | replace | `app/icon*.png`, `app/apple-icon.png`, `app/favicon.ico` |
| Footer mark | replace | `components/footer.tsx` |
| `/brand` page (public brand kit, modeled on usd.ai/brand-kit) | new | `app/brand/page.tsx` |
| Color tokens (`--accent`, surfaces, etc.) | update | `app/globals.css` |
| Typography (Poppins → Newsreader serif + JetBrains Mono) | update | `app/globals.css` + `app/layout.tsx` |
| Scroll-triggered logo replay (sitewide) | new | hook in `components/nav-bar.tsx` |

---

## About the Design Files

The files in `reference/` are **HTML design prototypes** — they show the intended look, geometry, and behavior pixel-perfectly. **Do not copy them verbatim into the site.** Instead, **recreate the designs in the existing Next.js codebase** using the project's established patterns (plain CSS in `globals.css`, React components, Next 15 App Router, the existing component shapes in `components/`).

The SVGs in `assets/` and the PNGs in `favicon/` are **production assets** — drop them straight into `public/brand/` and `app/` respectively.

## Fidelity

**High-fidelity (hifi).** Every measurement, color, and animation timing in this handoff is final. The numbers below are the spec, not suggestions. Match them.

---

## Assets — what's in this package

### `assets/` (drop into `public/brand/`)

| File | Purpose | Notes |
|---|---|---|
| `coin-ink.svg` | **Primary logomark** — dark coffee body, green ring, green mark. Use for header, favicon, OG card, all stand-alone contexts on light grounds. | Hardcoded colors (#162421 body, #5fa67f ring + mark). Self-contained. |
| `coin-white.svg` | Inverse coin — white body, green ring, green mark. Use on dark grounds (footer, dark-theme pages, social card on dark). | Self-contained. |
| `coin-mark.svg` | Saturated coin — green body, white ring, white mark. Use for branded surfaces where the brand green must lead. | Self-contained. |
| `mark-green.svg` | The bare glyph — three arcs + peak in green, no coin/ring. Use inside lockups where the wordmark provides the framing. | Self-contained. |
| `mark.svg` | The bare glyph using `currentColor` — color is inherited from CSS `color:` on the parent. | For developers who want full color control. |
| `mark-animated.svg` | Self-contained looping mark (the arcs grow in over ~4.2s, hold, repeat). Drop into any `<img>` or inline and it animates. | CSS keyframes embedded in the SVG. No JS. |
| `mark-with-wordmark.svg` | Vertical lockup — mark on top, "ASCERTAINTY" mono wordmark beneath. | For press/PR contexts where the wordmark must be inline. |

### `favicon/` (use for browser tab + iOS + Android)

PNGs rendered from `coin-ink.svg` at: **16, 32, 48, 64, 128, 192, 256, 512, 1024**, plus **apple-touch-icon.png (180)**.

> **Important:** at 16 px the inner arcs are sub-pixel — the favicon reads as a green/forest disc with a faint triangle peak. This is intentional and correct (matches USD.ai's favicon behavior). The brand recognition at favicon size lives in the *coin silhouette + ring color*, not the inner detail.

### `reference/` (design source-of-truth, **do not deploy**)

| File | What it shows |
|---|---|
| `Brand Kit.html` | The public brand-kit page mock — this is what `app/brand/page.tsx` should ultimately look like in the live site. |
| `Logo System.html` | Full design system spec — geometry construction diagram, animation breakdown, sizing scale, lockup variants, the scroll-replay behavior demo. Use as the source-of-truth reference when implementing. |

---

## Design Tokens

### Color palette (replaces current `:root` in `app/globals.css`)

```css
:root {
  /* ─── SURFACE · pure white through forest-dark · NO CREAM ─── */
  --bg-0:        #ffffff;    /* primary surface */
  --bg-1:        #fafafa;    /* slight elevation / card grounds */
  --bg-2:        #f5f5f5;    /* muted blocks */
  --bg-3:        #e8e8e8;    /* dividers / chrome */

  /* ─── FOREGROUND ─── */
  --fg:          #162421;    /* "Ink" — primary text + dark surfaces. Warm forest, NOT pitch black. */
  --fg-muted:    rgba(22, 36, 33, 0.62);
  --fg-faint:    rgba(22, 36, 33, 0.38);
  --fg-dim:      rgba(22, 36, 33, 0.18);

  --line:        rgba(22, 36, 33, 0.10);
  --line-strong: rgba(22, 36, 33, 0.22);

  /* ─── BRAND GREENS · "Forest" ─── */
  --pale-sage:   #e8f1ec;    /* very pale wash */
  --lichen:      #b8d6c5;    /* light foliage */
  --accent:      #5fa67f;    /* Verdigris — the brand mark · headlines · interactive */
  --pine:        #3a7058;    /* hover state for --accent */
  --vault:       #1c3429;    /* deep forest · dark accents */

  --accent-soft: rgba(95, 166, 127, 0.14);

  /* ─── TYPE ─── */
  --font-serif:   "Newsreader", Georgia, "Times New Roman", serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --font-sans:    "Inter", system-ui, -apple-system, "Helvetica Neue", sans-serif;
}
```

### Typography swap

The current `globals.css` sets `--font-mono: "Poppins"` (which is actually a sans). **Replace** with **JetBrains Mono** for the wordmark / nav / labels, and add **Newsreader** for serif display. Both are open-source on Google Fonts.

In `app/layout.tsx`, swap the font imports:

```tsx
import { JetBrains_Mono, Newsreader } from "next/font/google";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-mono" });
const serif = Newsreader({ subsets: ["latin"], style: ["italic", "normal"], weight: ["300", "400", "500"], variable: "--font-serif" });

export default function Layout({ children }) {
  return (
    <html lang="en" className={`${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Then in `globals.css`, the existing token names already line up — just point them at the new vars.

---

## Components to update / create

### 1. `components/nav-bar.tsx` — replace the hex glyph

The current nav has the **old hexagon-A logo inlined as SVG** (lines 18–37 of `nav-bar.tsx`). Replace that block with an inline copy of the **animated coin** from `assets/mark-animated.svg`, wrapped in a coin (ring + body), or import `coin-ink.svg` via `next/image`.

The animated coin should be ~28–32 px in the sticky nav. The animation is embedded in the SVG and loops automatically — **no additional wiring needed** for the auto-loop. For the scroll-replay (next section), the nav coin instance is the one that re-fires.

The wordmark beside it stays "ASCERTAINTY" in **JetBrains Mono**, weight 400, tracking 0.32em uppercase, ink color `var(--fg)`. (Existing implementation already has this shape — only the font family changes.)

### 2. `components/footer.tsx` — coin + dark ground

Footer ground becomes `var(--fg)` (`#162421`). Footer text becomes white-ish (`rgba(255,255,255,0.85)` for links, `rgba(255,255,255,0.5)` for headings/captions). The brand mark in the footer is **`coin-white.svg`** (white-body coin), ~48 px.

See `reference/Brand Kit.html` for the exact layout — 4 columns (brand+socials / Ecosystem / Developers / AI Summary pill).

### 3. `app/brand/page.tsx` — new public brand-kit route

Recreate `reference/Brand Kit.html` as a React page. Structure (all sections live inside `<main>`, header & footer come from `layout.tsx`):

- **Hero**: centered serif "Brand Kit" headline + 1-line subtitle + dark "Download Full Kit" button
- **§01 Logos & Lockups**: 3 asset cards (coin alone / coin+wordmark on dark / coin+wordmark on light), each with `SVG` / `PNG` download buttons pointing at `/brand/coin-ink.svg`, etc.
- **§02 Token Assets**: 3 coin variants + 2 wide hero scenes (dark/light gradient backgrounds with coin centered)
- **§03 Forest Greens**: 5 swatches — Pale Sage / Lichen / Verdigris / Pine Heart / Vault — with names in serif italic and hex codes in mono
- **§04 Neutral Tones**: 5 swatches — Page / Frost / Fog / Slate / Ink
- **§05 Typography**: 2 type cards showing Newsreader (display) and JetBrains Mono (system) with sample glyphs

All exact spacing, colors, and copy are in `reference/Brand Kit.html`. The asset card "buttons" should link to the actual SVG files in `public/brand/` so users can download them directly.

### 4. Scroll-replay animation hook (sitewide)

This is the signature sitewide interaction: **every time the user scrolls a configurable distance (default 480 px), the coin in the nav-bar replays its animation**.

Implementation pattern (vanilla, no library):

```tsx
"use client";
import { useEffect, useRef } from "react";

export function useScrollReplay({ thresholdPx = 480 } = {}) {
  const ref = useRef<SVGGElement | null>(null);
  useEffect(() => {
    let lastY = window.scrollY;
    let distance = 0;

    const replay = () => {
      const g = ref.current;
      if (!g) return;
      // toggle the .mk-anim class off and on to restart CSS keyframes
      g.classList.remove("mk-anim");
      void g.offsetWidth; // force reflow
      g.classList.add("mk-anim");
    };

    const onScroll = () => {
      const y = window.scrollY;
      distance += Math.abs(y - lastY);
      lastY = y;
      if (distance >= thresholdPx) {
        distance = 0;
        replay();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdPx]);

  return ref;
}
```

Attach `ref` to the outer `<g>` element inside the nav-bar's inline coin SVG (the `<g class="mk-anim">` wrapping the four animated paths). See `reference/Logo System.html` — search for `restartAnimations()` and `collectLiveMarks()` for the full reference implementation.

### 5. Favicon stack

Move the contents of `favicon/` into `app/` (Next.js 15 App Router convention):

| Source | Destination | Purpose |
|---|---|---|
| `favicon/favicon-32.png` | `app/icon.png` | Default browser tab icon (Next 15 auto-detects) |
| `favicon/apple-touch-icon.png` | `app/apple-icon.png` | iOS home-screen / Safari touch icon |
| `assets/coin-ink.svg` | `app/icon.svg` | Vector favicon (modern browsers prefer this) |

Optionally also drop the full PNG stack at `public/favicon/*.png` if you want explicit `<link rel="icon" sizes="...">` overrides.

---

## Animation Timings & Spec

All baked into `mark-animated.svg` already, but for reference:

- **Loop duration**: 4.2 s (configurable — Logo System's TWEAKS has the user's current preference of **3.0 s** if you want a snappier loop)
- **Build phase**: 0 → 1.1 s (arcs grow in)
- **Hold phase**: 1.1 → 4.2 s (mark held in final state)
- **Layer stagger**: 280 ms between bottom arc → middle arc → top arc → peak triangle
- **Easing**: `cubic-bezier(.16, .84, .3, 1)` (cubic ease-out)
- **Per-layer transform**: `transform-box: fill-box; transform-origin: 50% 100%;` then `scaleY(0.05) translateY(8px) → scaleY(1) translateY(0)` + opacity 0 → 1
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` collapses everything to the final state — already in the SVG, respect it.

---

## Mark Geometry (for any pixel-perfect recreation)

The coin viewBox is **240 × 240**. Inside the coin:

- **Outer ring (filled circle)**: `cx=120 cy=120 r=119` — fill = ring color
- **Coin body (filled circle)**: `cx=120 cy=120 r=107` — fill = body color
- **Inner mark group**: `transform="translate(41 32) scale(0.66)"` — note **ty=32, NOT 38** — this is the visual-center lift (the mark is bottom-heavy so we shift it up 6 viewBox units)

The three arcs inside (in pre-scale coords):
- Bottom: `M 28 218 A 92 44 0 0 1 212 218` · stroke-width 22 · `stroke-linecap: butt` (squared ends, **not round**)
- Middle: `M 60 154 A 60 32 0 0 1 180 154` · stroke-width 16
- Top:    `M 85 104 A 35 18 0 0 1 155 104` · stroke-width 12

The peak (filled): `M 120 30 L 140 66 L 100 66 Z`

**Critical invariant**: the outer-left/right endpoints of every arc + the peak tip + the triangle base corners all sit on a single straight line converging at the peak. If you re-tune any of these numbers, redo the collinearity check.

Stroke ratio is locked at **22 : 16 : 12** (= 1 : 0.73 : 0.55). Never break this — when scaling the stroke for art-direction, scale all three proportionally.

---

## Existing Code You'll Need to Touch

From the `ascertainty-web` repo at the time of this handoff:

| File | What changes |
|---|---|
| `app/globals.css` | Replace `:root` token block with the one above. Many existing rules reference `--accent`, `--fg`, `--bg-*` — those resolve correctly with the new values, so most downstream styles inherit the new palette for free. Update the typography rules that reference Poppins. |
| `app/layout.tsx` | Swap `next/font/google` imports from Poppins → JetBrains Mono + Newsreader. |
| `components/nav-bar.tsx` | Replace lines 18–37 (the hex glyph SVG block) with the new animated coin. Wire `useScrollReplay()` hook to its inner `<g>`. |
| `components/footer.tsx` | Swap any old mark + ground colors for `coin-white.svg` on `--fg` ground. |
| `app/brand/page.tsx` | **New file** — implement the brand-kit page per `reference/Brand Kit.html`. |
| `app/icon.svg`, `app/icon.png`, `app/apple-icon.png` | Drop in the new favicon files. |

The existing routes (`/`, `/projects`, `/pools`, `/portfolio`, `/docs`) don't need structural changes — they'll inherit the new color + type via `globals.css` automatically. Spot-check each one and adjust any place that hardcoded an `oklch(...)` or specific accent.

---

## Files in this package

```
design_handoff_ascertainty_brand/
├── README.md                     ← this file
├── assets/                       ← drop into public/brand/
│   ├── coin-ink.svg              ← primary logomark
│   ├── coin-white.svg            ← inverse coin (use on dark grounds)
│   ├── coin-mark.svg             ← saturated green coin
│   ├── mark.svg                  ← bare glyph, currentColor
│   ├── mark-green.svg            ← bare glyph, green baked in
│   ├── mark-animated.svg         ← self-contained looping mark
│   └── mark-with-wordmark.svg    ← vertical lockup w/ ASCERTAINTY wordmark
├── favicon/                      ← drop into app/ (Next 15 convention)
│   ├── favicon-16.png            → optional /public/favicon/
│   ├── favicon-32.png            → app/icon.png
│   ├── favicon-48.png
│   ├── favicon-64.png
│   ├── favicon-128.png
│   ├── favicon-192.png
│   ├── favicon-256.png
│   ├── favicon-512.png
│   ├── favicon-1024.png
│   └── apple-touch-icon.png      → app/apple-icon.png
└── reference/                    ← design source-of-truth (do not deploy)
    ├── Brand Kit.html            ← public /brand page reference
    └── Logo System.html          ← full design spec
```

---

## Quick verification checklist

After integration, check the following before considering it shipped:

- [ ] Open `/` in a browser — the nav coin animates on load and replays after ~480 px of scroll
- [ ] Open `/` in a browser tab — the favicon is a green coin (visible silhouette at 16 px)
- [ ] Open `/brand` — matches `reference/Brand Kit.html`: hero + 4 sections + typography + dark footer
- [ ] iOS Safari "Add to Home Screen" — the apple-touch icon is the ink coin (not the old hex)
- [ ] Check `prefers-reduced-motion` — with it enabled in the OS, animations collapse to static end-state
- [ ] No yellow / cream color anywhere in the rendered site (the old `#ebe3cf` palette is fully retired)
- [ ] Body text color is `#162421` (warm forest dark), **not** pitch black `#0f1115` or `#15110a`

---

*This handoff package was generated alongside the design exploration. The full design dialogue and all earlier iterations are archived in the design project.*
