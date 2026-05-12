import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface PredictionGradeGateProps {
  grade: "A" | "B" | "C" | null | undefined;
  children: React.ReactNode;
  className?: string;
}

/**
 * PredictionGradeGate — wraps content. Grade A/B render children unchanged.
 * Grade C surfaces the ineligibility state with link to §4.2 of the policy.
 */
export function PredictionGradeGate({ grade, children, className }: PredictionGradeGateProps) {
  if (grade === "C") {
    return (
      <div
        className={cn(
          "border border-signal-down/40 bg-signal-down/5 p-4 space-y-2",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full bg-signal-down" />
          <div className="text-xs uppercase tracking-wider text-signal-down">
            Grade C — Ineligible
          </div>
        </div>
        <p className="text-sm text-fg">
          This prediction has too wide a confidence band (CV ≥ 45%) to clear the
          underwriting policy. Re-audit with additional measurements is required to
          tighten σ before the deal can be soft-committed.
        </p>
        <Link
          href="/docs/underwriting-policy#section-4-2"
          className="inline-block text-xs text-signal-down underline underline-offset-2"
        >
          See §4.2 — Asset eligibility ↗
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
