"use client";

import { type ReactNode } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface TermProps {
  children: ReactNode;
  /** Short display heading shown in bold at the top of the popover. */
  title?: string;
  /** The plain-English explanation. */
  def: string;
  /** Optional external URL — opens in a new tab. */
  href?: string;
}

/**
 * Inline term with hover-explainer. Wrap any acronym or jargon term in
 * the section body and a small popover will explain it on hover, with an
 * optional "Learn more" link to an external source. Used in §03 BENCHMARKS
 * for LOO / KISEM / IAC / R² / MAPE / σ-scaling / etc.
 */
export function Term({ children, title, def, href }: TermProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="a-term-trigger">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent className="a-term-popover">
        {title ? <div className="a-term-popover__title">{title}</div> : null}
        <p className="a-term-popover__def">{def}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="a-term-popover__link"
          >
            Learn more <span aria-hidden>↗</span>
          </a>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
