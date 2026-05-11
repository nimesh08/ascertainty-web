"use client";

import { motion } from "framer-motion";

export interface ProgressBarProps {
  /** 0..100 */
  value: number;
  className?: string;
  color?: "green" | "cyan" | "violet" | "amber";
  height?: number;
}

const COLORS: Record<NonNullable<ProgressBarProps["color"]>, string> = {
  green: "bg-green",
  cyan: "bg-cyan",
  violet: "bg-violet",
  amber: "bg-amber-400",
};

export function ProgressBar({
  value,
  className,
  color = "green",
  height = 6,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`relative w-full overflow-hidden rounded-full bg-bg-2 ${className ?? ""}`}
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full ${COLORS[color]}`}
      />
    </div>
  );
}
