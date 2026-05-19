import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type KPITileStatus = "ok" | "warn" | "fail" | "neutral";

interface KPITileProps {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  status?: KPITileStatus;
  emphasis?: "default" | "headline";
  className?: string;
}

const STATUS_STYLES: Record<KPITileStatus, { ring: string; dot: string; text: string }> = {
  ok: {
    ring: "ring-accent/40 bg-accent-soft/40",
    dot: "bg-accent",
    text: "text-accent-deep",
  },
  warn: {
    ring: "ring-amber/40 bg-amber/10",
    dot: "bg-amber",
    text: "text-amber",
  },
  fail: {
    ring: "ring-signal-down/40 bg-signal-down/10",
    dot: "bg-signal-down",
    text: "text-signal-down",
  },
  neutral: {
    ring: "ring-line bg-bg-1",
    dot: "bg-fg-faint",
    text: "text-fg",
  },
};

/**
 * KPITile — single visual primitive for headline numerics across the app.
 * Replaces ad-hoc rounded border boxes; ensures visual consistency between
 * lender preview, borrower view, and LP portfolio.
 */
export function KPITile({
  label,
  value,
  sublabel,
  status = "neutral",
  emphasis = "default",
  className,
}: KPITileProps) {
  const s = STATUS_STYLES[status];
  return (
    <div
      className={cn(
        "relative rounded-2xl ring-1 ring-inset p-3",
        s.ring,
        emphasis === "headline" && "p-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
        <div className="text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      </div>
      <div
        className={cn(
          "mt-1 font-medium tabular-nums",
          emphasis === "headline" ? "text-2xl" : "text-lg",
          status === "fail" ? s.text : "text-fg"
        )}
      >
        {value}
      </div>
      {sublabel ? (
        <div className="mt-1 text-[11px] text-fg-faint">{sublabel}</div>
      ) : null}
    </div>
  );
}
