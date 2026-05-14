"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FAQ_SECTIONS,
  type FaqPersona,
  getFeaturedEntries,
} from "@/lib/faq-content";

/**
 * Landing-page §05 FAQ toggle. Three persona chips at the top swap the
 * accordion between 3 featured Q&As per persona. Full Q&A set lives at
 * /docs/faq; content is sourced from lib/faq-content.tsx so this stays
 * in lockstep without drift.
 */

const PERSONAS: FaqPersona[] = ["lenders", "borrowers", "reviewers"];

export function FaqPersonas() {
  const [active, setActive] = useState<FaqPersona>("lenders");
  const entries = getFeaturedEntries(active);
  const activeSection = FAQ_SECTIONS.find((s) => s.persona === active);

  return (
    <div className="faq-personas">
      <div className="faq-personas__tabs" role="tablist" aria-label="Audience">
        {PERSONAS.map((p) => {
          const section = FAQ_SECTIONS.find((s) => s.persona === p);
          if (!section) return null;
          return (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={active === p}
              onClick={() => setActive(p)}
              className={cn(
                "faq-personas__chip",
                active === p && "faq-personas__chip--active"
              )}
            >
              {section.shortLabel}
            </button>
          );
        })}
      </div>

      {activeSection ? (
        <p className="faq-personas__intro">{activeSection.landingIntro}</p>
      ) : null}

      <Accordion
        key={active}
        type="single"
        collapsible
        className="faq-personas__accordion"
      >
        {entries.map((e) => (
          <AccordionItem
            key={e.id}
            value={e.id}
            style={{ borderBottom: "1px solid var(--line)" }}
          >
            <AccordionTrigger
              className="text-base"
              style={{ textTransform: "none", letterSpacing: 0 }}
            >
              {e.q}
            </AccordionTrigger>
            <AccordionContent style={{ color: "var(--fg-muted)" }}>
              {e.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
