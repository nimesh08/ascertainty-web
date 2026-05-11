import { Zap, Layers } from "lucide-react";

export interface ProjectHeroProps {
  kind: "project" | "pool";
  className?: string;
}

/**
 * Palette-matched SVG hero band for ProjectCard / PoolCard.
 *
 * Uses Helix dark palette tokens directly so it automatically tracks
 * theme changes (bg-1 base + green/cyan for projects, violet/magenta
 * for pools). No external image asset required.
 */
export function ProjectHero({ kind, className }: ProjectHeroProps) {
  const gradId = `hero-grad-${kind}`;
  const noiseId = `hero-noise-${kind}`;
  const ringId = `hero-ring-${kind}`;

  const isPool = kind === "pool";
  const colorA = isPool ? "var(--color-violet)" : "var(--color-green)";
  const colorB = isPool ? "var(--color-magenta)" : "var(--color-cyan)";

  return (
    <div
      aria-hidden
      className={
        "relative aspect-[16/9] w-full overflow-hidden " +
        "bg-bg-1 " +
        (className ?? "")
      }
    >
      <svg
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-bg-1)" stopOpacity="1" />
            <stop offset="55%" stopColor={colorA} stopOpacity="0.22" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0.35" />
          </linearGradient>
          <radialGradient id={ringId} cx="0.85" cy="0.15" r="0.9">
            <stop offset="0%" stopColor={colorB} stopOpacity="0.38" />
            <stop offset="55%" stopColor={colorA} stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-bg-1)" stopOpacity="0" />
          </radialGradient>
          <pattern
            id={noiseId}
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 24 L24 0"
              stroke="var(--color-line)"
              strokeOpacity="0.18"
              strokeWidth="0.6"
            />
          </pattern>
        </defs>

        <rect width="640" height="360" fill="var(--color-bg-1)" />
        <rect width="640" height="360" fill={`url(#${gradId})`} />
        <rect width="640" height="360" fill={`url(#${ringId})`} />
        <rect width="640" height="360" fill={`url(#${noiseId})`} />

        {/* Abstract concentric arcs — subtle depth */}
        <g fill="none" strokeLinecap="round">
          <circle
            cx="520"
            cy="80"
            r="120"
            stroke={colorA}
            strokeOpacity="0.22"
            strokeWidth="1"
          />
          <circle
            cx="520"
            cy="80"
            r="180"
            stroke={colorB}
            strokeOpacity="0.14"
            strokeWidth="1"
          />
          <circle
            cx="520"
            cy="80"
            r="240"
            stroke={colorA}
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        </g>
      </svg>

      {/* Sector icon overlay (lucide), centered-left */}
      <div className="absolute inset-0 flex items-center pl-8">
        <div
          className="grid size-14 place-items-center rounded-xl border border-line/70 bg-bg-1/70 backdrop-blur-sm"
          style={{
            boxShadow: `0 0 0 1px ${colorA}22, 0 20px 40px -20px ${colorA}33`,
          }}
        >
          {isPool ? (
            <Layers
              className="size-6"
              style={{ color: colorA }}
            />
          ) : (
            <Zap
              className="size-6"
              style={{ color: colorA }}
            />
          )}
        </div>
      </div>

      {/* Bottom fade so the card content seam is soft */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--color-card))",
        }}
      />
    </div>
  );
}
