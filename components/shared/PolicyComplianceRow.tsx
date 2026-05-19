import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { PolicyCheck } from "@/lib/underwriting/policy";

interface PolicyComplianceRowProps {
  checks: PolicyCheck[];
  className?: string;
}

/**
 * PolicyComplianceRow — striped list rendering every §5 threshold check.
 * The single visual element that proves to a lender or LP "we follow our
 * own published rules." Each row links to its policy section.
 */
export function PolicyComplianceRow({ checks, className }: PolicyComplianceRowProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-line bg-bg-1", className)}>
      <div className="border-b border-line px-4 py-2">
        <div className="text-[10px] uppercase tracking-wider text-fg-muted">
          Policy compliance · UNDERWRITING_POLICY.md §5
        </div>
      </div>
      <div className="divide-y divide-line/60">
        {checks.map((c) => (
          <div
            key={c.name}
            className="grid grid-cols-12 items-center gap-2 px-4 py-2 text-sm tabular-nums"
          >
            <div className="col-span-1">
              {c.passes ? (
                <span aria-label="passes" className="text-accent">
                  ✓
                </span>
              ) : (
                <span aria-label="fails" className="text-signal-down">
                  ✗
                </span>
              )}
            </div>
            <div className="col-span-5 text-fg">{c.name}</div>
            <div
              className={cn(
                "col-span-3 text-right",
                c.passes ? "text-fg" : "text-signal-down font-medium"
              )}
            >
              {c.actual}
            </div>
            <div className="col-span-2 text-right text-fg-muted text-xs">
              {c.threshold}
            </div>
            <div className="col-span-1 text-right">
              <Link
                href={`/docs/underwriting-policy#section-${c.policySection.replace(".", "-")}`}
                className="text-xs text-fg-faint hover:text-accent underline-offset-2 hover:underline"
              >
                §{c.policySection}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
