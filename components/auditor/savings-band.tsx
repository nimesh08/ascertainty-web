"use client";

import { cn } from "@/lib/utils/cn";

interface SavingsBandProps {
  predictedKwh: number;
  p5Kwh: number;
  p95Kwh: number;
  grade?: "A" | "B" | "C";
  electricityRateInrKwh?: number;
  variant?: "compact" | "full";
  label?: string;
}

/**
 * P5 -- predicted -- P95 horizontal band.
 *
 * The fill spans [P5, P95] within the [0, P95 * 1.1] axis range; the predicted
 * estimate is a vertical tick line. The "lender-grade P5 floor" is annotated
 * because that's what the soft-commitment letter uses for debt sizing.
 */
export function SavingsBand({
  predictedKwh,
  p5Kwh,
  p95Kwh,
  grade,
  electricityRateInrKwh = 8.0,
  variant = "full",
  label,
}: SavingsBandProps) {
  const axisMax = Math.max(p95Kwh * 1.1, predictedKwh * 1.5, 1);
  const pct = (v: number) => Math.max(0, Math.min(100, (v / axisMax) * 100));
  const p5Pct = pct(p5Kwh);
  const p95Pct = pct(p95Kwh);
  const pointPct = pct(predictedKwh);

  const gradeColor =
    grade === "A" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
      : grade === "B" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
        : grade === "C" ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40"
          : "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30";

  return (
    <div className={cn("w-full", variant === "full" && "space-y-3")}>
      {variant === "full" && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-zinc-500">{label ?? "Predicted annual savings"}</div>
          {grade && (
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", gradeColor)}>
              Grade {grade}
            </span>
          )}
        </div>
      )}

      {/* Band rail */}
      <div className="relative h-6 w-full rounded-md bg-zinc-100 dark:bg-zinc-900 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800">
        {/* P5-P95 fill */}
        <div
          className="absolute inset-y-0 bg-emerald-500/30 dark:bg-emerald-400/30"
          style={{ left: `${p5Pct}%`, width: `${Math.max(p95Pct - p5Pct, 0.5)}%` }}
        />
        {/* Predicted tick */}
        <div
          className="absolute inset-y-0 w-[2px] bg-zinc-900 dark:bg-zinc-50"
          style={{ left: `${pointPct}%` }}
        />
        {/* P5 tick */}
        <div
          className="absolute inset-y-0 w-[2px] bg-emerald-700 dark:bg-emerald-300"
          style={{ left: `${p5Pct}%` }}
          aria-label="P5 lower bound"
        />
      </div>

      {/* Numeric callouts — absolutely anchored to their tick positions so
          P5 sits below the P5 tick, etc. On narrow viewports we fall back to
          a stacked layout (sm:hidden vs sm:block) so callouts don't collide. */}
      <BandCallouts
        p5Kwh={p5Kwh}
        predictedKwh={predictedKwh}
        p95Kwh={p95Kwh}
        p5Pct={p5Pct}
        pointPct={pointPct}
        p95Pct={p95Pct}
        electricityRateInrKwh={electricityRateInrKwh}
      />
    </div>
  );
}

/** Anchored callouts — uses `translateX(-50%)` to center each label under its
 *  tick. Clamps each label's transform so the leftmost/rightmost stay inside
 *  the container instead of overflowing. */
function BandCallouts({
  p5Kwh,
  predictedKwh,
  p95Kwh,
  p5Pct,
  pointPct,
  p95Pct,
  electricityRateInrKwh,
}: {
  p5Kwh: number;
  predictedKwh: number;
  p95Kwh: number;
  p5Pct: number;
  pointPct: number;
  p95Pct: number;
  electricityRateInrKwh: number;
}) {
  // Clamp translate so labels near 0% or 100% don't overflow the container.
  // Below ~10% we left-align; above ~90% we right-align; otherwise center.
  const transformFor = (pct: number) => {
    if (pct < 10) return "translateX(0)";
    if (pct > 90) return "translateX(-100%)";
    return "translateX(-50%)";
  };

  const fmtKwh = (n: number) =>
    `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr`;
  const fmtInr = (n: number) =>
    `≈ ₹${(n * electricityRateInrKwh).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}/yr`;

  return (
    <>
      {/* Stacked fallback for narrow viewports — keeps labels readable when
          two ticks would crash into each other under 480px. */}
      <div className="grid grid-cols-3 gap-2 text-xs sm:hidden">
        <div>
          <div className="uppercase tracking-wide text-zinc-500">P5 (floor)</div>
          <div className="font-medium text-emerald-700 dark:text-emerald-300">{fmtKwh(p5Kwh)}</div>
        </div>
        <div>
          <div className="uppercase tracking-wide text-zinc-500">Point</div>
          <div className="font-medium">{fmtKwh(predictedKwh)}</div>
        </div>
        <div className="text-right">
          <div className="uppercase tracking-wide text-zinc-500">P95</div>
          <div className="font-medium">{fmtKwh(p95Kwh)}</div>
        </div>
      </div>

      {/* Tick-anchored layout for tablet+ */}
      <div className="relative hidden h-16 w-full text-sm sm:block">
        <div
          className="absolute top-0"
          style={{ left: `${p5Pct}%`, transform: transformFor(p5Pct) }}
        >
          <div className="text-xs uppercase tracking-wide text-zinc-500">P5 (lender floor)</div>
          <div className="font-medium text-emerald-700 dark:text-emerald-300">{fmtKwh(p5Kwh)}</div>
          <div className="text-xs text-zinc-500">{fmtInr(p5Kwh)}</div>
        </div>
        <div
          className="absolute top-0"
          style={{ left: `${pointPct}%`, transform: transformFor(pointPct) }}
        >
          <div className="text-xs uppercase tracking-wide text-zinc-500">Point estimate</div>
          <div className="font-medium">{fmtKwh(predictedKwh)}</div>
          <div className="text-xs text-zinc-500">{fmtInr(predictedKwh)}</div>
        </div>
        <div
          className="absolute top-0"
          style={{ left: `${p95Pct}%`, transform: transformFor(p95Pct) }}
        >
          <div className="text-xs uppercase tracking-wide text-zinc-500">P95 (upper)</div>
          <div className="font-medium">{fmtKwh(p95Kwh)}</div>
          <div className="text-xs text-zinc-500">{fmtInr(p95Kwh)}</div>
        </div>
      </div>
    </>
  );
}
