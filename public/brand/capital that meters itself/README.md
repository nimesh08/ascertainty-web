# Handoff: Meter Animation (Landing Hero)

## Overview
An animated SVG illustration for the Ascertainty landing page hero section. It depicts an analog electricity meter with the Ascertainty coin/mark rotating inside, a ticking odometer counter, and floating particles — all in the brand's three-color palette.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, animation timing, and behavior. The task is to **recreate this as an inline SVG + JS component** in the target codebase's existing environment (React/Next.js, etc.) using its established patterns — not to ship this HTML directly.

## Fidelity
**High-fidelity.** The SVG geometry, stroke widths, colors, and animation timings are final. Recreate the illustration pixel-perfectly.

## Composition & Layout

### Container
- **Aspect ratio:** 1:1 (square)
- **Sizing:** fills the smaller viewport dimension (`100vmin`), centered in its parent
- **Background:** `#fafafa` (warm cream) with a faint dot-grid texture overlay (22px grid, 0.9px dots at 9% opacity in `#162421`)

### Structural Layers (back → front)

1. **Dot grid background** — SVG `<pattern>` of small circles
2. **Corner crop marks** — four L-shaped marks at the canvas corners (40px inset), thin `#162421` strokes at 35% opacity
3. **Isometric centerlines** — vertical + horizontal solid lines, two diagonal dashed lines, all at 10% opacity
4. **Cylinder depth arc** — a curved path below the meter circle suggesting 3D depth, stroke `#162421` 1.1px
5. **Meter bezels** — five concentric circles forming the meter housing:
   - Outer bezel: r=290, stroke-width 1.8
   - Second ring: r=278, stroke-width 0.6
   - Third ring: r=270, stroke-width 0.5, 50% opacity
   - Glass dial rim: r=255, stroke-width 1.2
   - Inner shadow: r=250, stroke-width 0.4, 45% opacity
6. **Glass vignette** — radial gradient fill on the r=255 circle (subtle edge darkening)
7. **Tick marks** — 60 ticks around the dial (generated via JS):
   - 12 major ticks (every 30°): from r=252 to r=238, stroke-width 1.4
   - 48 minor ticks: from r=252 to r=246, stroke-width 0.55, 70% opacity
8. **Inner guide rings** — two faint concentric circles (r=160 solid, r=120 dashed) at 18% opacity
9. **Counter window** — positioned at center-x, y=558:
   - Outer bracket: 208×52px rect, 0.6px stroke, 50% opacity
   - Digit window: 188×44px rect, 1.2px stroke, filled `#fafafa`
   - 4 vertical divider lines splitting 5 digit slots
   - Faint horizontal scribe line through middle
   - "UNITS" label: 10px monospace, right-aligned above window, 50% opacity, letter-spacing 2.5
10. **Particles** — sage-green circles spawned by JS (see Animations)
11. **Rotating coin** (topmost layer, see below)
12. **Index pointer** — small fixed triangle above the coin at y=300–310

### Rotating Coin (center)
- Outer disc: r=86, filled `#fafafa`, `#162421` stroke 1px
- Sage ring: r=80, `#5fa67f` stroke 1.2px at 60% opacity
- Inner sage ring: r=76, `#5fa67f` stroke 0.5px at 35% opacity
- **Brand mark** inside (from `mark-green.svg`): three nested ascending arcs + triangular peak, all `#5fa67f`. Scaled 0.46× and translated to center at (400, 400). Uses the exact stroke widths from the source SVG (22/16/12).

## Animations

### 1. Coin Rotation
- **Duration:** 6 seconds per full rotation
- **Direction:** clockwise
- **Easing:** linear (constant speed)
- **Loop:** infinite, seamless
- **Implementation:** SMIL `<animateTransform type="rotate">` around center point (400, 400)

### 2. Odometer Counter
- **Rate:** increments by 1 every second
- **Display:** 5 digits, zero-padded (00001, 00002, ... 99999, then wraps to 00001)
- **Font:** monospace, 28px, weight 500, `#162421`
- **Implementation:** `setInterval` at 1000ms updating `<text>` elements

### 3. Sage Particles
- **Spawn rate:** one particle every 720ms, plus 6 on load (staggered 220ms)
- **Origin:** random position on the dial face at radius 95–225 from center, biased vertically (y scaled 0.5×)
- **Movement:** drift upward 120–260px with lateral drift ±19px
- **Opacity curve:** 0 → 0.85 (at 18%) → 0.55 (at 60%) → 0 (at 100%)
- **Duration:** 2800–4400ms per particle
- **Easing:** `cubic-bezier(.22, .7, .3, 1)`
- **Size:** radius 1.1–2.7px
- **Color:** `#5fa67f`
- **Cleanup:** particles are removed from DOM on animation finish

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#fafafa` | Background, coin fill, counter fill |
| Ink | `#162421` | All line work, text, dots |
| Sage | `#5fa67f` | Coin rings, brand mark, particles |

No other colors are used. Strictly three-color palette.

### Typography
- Font stack: `ui-monospace, 'JetBrains Mono', 'IBM Plex Mono', Menlo, monospace`
- Counter digits: 28px, weight 500
- "UNITS" label: 10px, weight normal, letter-spacing 2.5px

## Assets

| File | Description |
|------|-------------|
| `Meter Animation.html` | Complete working prototype — open in browser to see the animation |
| `mark-green.svg` | The Ascertainty brand mark in sage green (240×240 viewBox) — use the exact paths and stroke widths from this file for the coin interior |

## Integration Notes

- The SVG viewBox is 800×800. The container should maintain 1:1 aspect ratio and scale to fit its parent.
- The background (`#fafafa` + dot grid) may not be needed if the landing page already has its own background — adapt as appropriate.
- The corner crop marks and centerlines are decorative technical-drawing flavor. They can be omitted if they conflict with surrounding page elements.
- The animation is lightweight (SMIL + Web Animations API + one `setInterval`). No dependencies.
- For React: convert the SMIL rotation to a CSS animation or `useEffect` with requestAnimationFrame. Particle spawning fits naturally in a `useEffect` with cleanup.
- The counter should persist across page visibility changes (no reset on tab switch).
