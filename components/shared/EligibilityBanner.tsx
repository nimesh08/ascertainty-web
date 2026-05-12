import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  type EligibilityStatus,
  type PolicyEvaluation,
  statusLabel,
} from "@/lib/underwriting/policy";

interface EligibilityBannerProps {
  evaluation: PolicyEvaluation;
  className?: string;
}

const TONE_STYLES: Record<EligibilityStatus, string> = {
  eligible: "border-accent bg-accent-soft text-accent-deep",
  eligible_enhanced_mv: "border-amber/60 bg-amber/10 text-amber",
  ineligible_grade_c: "border-signal-down/60 bg-signal-down/10 text-signal-down",
  ineligible_dscr: "border-signal-down/60 bg-signal-down/10 text-signal-down",
  ineligible_ebitda: "border-signal-down/60 bg-signal-down/10 text-signal-down",
  ineligible_other: "border-signal-down/60 bg-signal-down/10 text-signal-down",
  pending: "border-line bg-bg-2 text-fg-muted",
};

/**
 * EligibilityBanner — top-of-page status surfaced from evaluatePolicy().
 * Eligible cases get the green rail; ineligibles get the red rail with the
 * primary failing reason inline.
 */
export function EligibilityBanner({ evaluation, className }: EligibilityBannerProps) {
  const { status, reasons } = evaluation;
  const primary = reasons[0];
  return (
    <div
      className={cn(
        "border-l-2 px-4 py-3 flex items-start justify-between gap-4",
        TONE_STYLES[status],
        className
      )}
    >
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider opacity-80">
          Underwriting eligibility
        </div>
        <div className="text-sm font-medium">{statusLabel(status)}</div>
        {primary ? (
          <div className="text-xs opacity-80">
            {primary.message}{" "}
            <Link
              href={`/docs/underwriting-policy#section-${primary.policySection.replace(".", "-")}`}
              className="underline underline-offset-2 hover:opacity-100"
            >
              §{primary.policySection} ↗
            </Link>
          </div>
        ) : null}
      </div>
      <Link
        href="/docs/underwriting-policy"
        className="shrink-0 text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
      >
        Underwriting Policy ↗
      </Link>
    </div>
  );
}
