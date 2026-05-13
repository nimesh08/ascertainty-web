"use client";

import { useEffect, useRef } from "react";

/**
 * Replays a CSS-keyframe animation by toggling the class off and back on every
 * time the user scrolls a cumulative `thresholdPx` distance.
 *
 * Usage:
 *   const ref = useScrollReplay({ thresholdPx: 480, className: "mk-anim" });
 *   <g ref={ref} className="mk-anim">...</g>
 *
 * Forest brand kit v0.3 (2026-05-13).
 */
export function useScrollReplay<T extends SVGElement | HTMLElement = SVGGElement>(
  { thresholdPx = 480, className = "mk-anim" }: { thresholdPx?: number; className?: string } = {}
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let distance = 0;

    const replay = () => {
      const node = ref.current;
      if (!node) return;
      node.classList.remove(className);
      // Force reflow so the browser re-runs keyframes from frame 0
      void (node as HTMLElement).offsetWidth;
      node.classList.add(className);
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
  }, [thresholdPx, className]);

  return ref;
}
