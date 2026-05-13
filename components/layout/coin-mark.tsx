"use client";

import { useScrollReplay } from "@/lib/hooks/use-scroll-replay";

interface CoinMarkProps {
  size?: number;
  /** Variant: "ink" (dark body, sage ring), "white" (white body), or "saturated" (green body). */
  variant?: "ink" | "white" | "saturated";
  /** If true, replays the mark animation on cumulative scroll distance. */
  animateOnScroll?: boolean;
  /** Custom scroll-distance threshold to trigger a replay. Default 480 px. */
  scrollThresholdPx?: number;
  className?: string;
  /** Optional aria-label override. */
  ariaLabel?: string;
}

/**
 * Ascertainty animated coin mark — Forest brand kit v0.3.
 *
 * Three nested arcs ascending to a peak, inside a circle ringed in sage.
 * Animation loops automatically via CSS keyframes; if `animateOnScroll` is set,
 * the inner `<g>` re-fires its keyframes after every `scrollThresholdPx` of
 * cumulative scroll distance.
 */
export function CoinMark({
  size = 32,
  variant = "ink",
  animateOnScroll = false,
  scrollThresholdPx = 480,
  className,
  ariaLabel = "Ascertainty",
}: CoinMarkProps) {
  const ref = useScrollReplay<SVGGElement>({
    thresholdPx: scrollThresholdPx,
    className: "mk-anim",
  });

  const palette = {
    ink: { body: "#162421", ring: "#5fa67f", mark: "#5fa67f" },
    white: { body: "#ffffff", ring: "#5fa67f", mark: "#5fa67f" },
    saturated: { body: "#5fa67f", ring: "#ffffff", mark: "#ffffff" },
  }[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      className={className}
    >
      <title>{ariaLabel}</title>
      <circle cx="120" cy="120" r="119" fill={palette.ring} />
      <circle cx="120" cy="120" r="107" fill={palette.body} />
      <g
        ref={animateOnScroll ? ref : undefined}
        className={animateOnScroll ? "mk-anim" : undefined}
        transform="translate(41 32) scale(0.66)"
      >
        <g fill="none" stroke={palette.mark} strokeLinecap="butt">
          <path
            className="a-bottom"
            strokeWidth="22"
            d="M 28 218 A 92 44 0 0 1 212 218"
          />
          <path
            className="a-middle"
            strokeWidth="16"
            d="M 60 154 A 60 32 0 0 1 180 154"
          />
          <path
            className="a-top"
            strokeWidth="12"
            d="M 85 104 A 35 18 0 0 1 155 104"
          />
        </g>
        <path
          className="a-tri"
          d="M 120 30 L 140 66 L 100 66 Z"
          fill={palette.mark}
        />
      </g>
    </svg>
  );
}
