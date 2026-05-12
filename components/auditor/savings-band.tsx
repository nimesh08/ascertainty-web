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
            <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", gradeColor)}>
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

      {/* Numeric callouts */}
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">P5 (lender floor)</div>
          <div className="font-medium text-emerald-700 dark:text-emerald-300">
            {p5Kwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr
          </div>
          <div className="text-xs text-zinc-500">
            ≈ ₹{(p5Kwh * electricityRateInrKwh).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">Point estimate</div>
          <div className="font-medium">
            {predictedKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr
          </div>
          <div className="text-xs text-zinc-500">
            ≈ ₹{(predictedKwh * electricityRateInrKwh).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">P95 (upper)</div>
          <div className="font-medium">
            {p95Kwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr
          </div>
        </div>
      </div>
    </div>
  );
}
