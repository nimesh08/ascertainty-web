import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_SECTIONS } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "FAQ | Ascertainty",
  description:
    "Frequently asked questions about Ascertainty — for lenders, borrowers, and credit / risk reviewers.",
};

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/" className="text-fg-muted hover:text-accent">
          ← Back to Ascertainty
        </Link>
        <Link
          href="/docs/underwriting-policy"
          className="text-fg-muted hover:text-accent"
        >
          Underwriting policy ↗
        </Link>
      </div>

      <header style={{ marginBottom: 40 }}>
        <span className="a-kicker-pill">FAQ</span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5vw, 56px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: "12px 0 0",
            fontWeight: 500,
            color: "var(--fg)",
          }}
        >
          Answers.
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            maxWidth: "62ch",
            marginTop: 16,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Three audiences, three concern profiles. Skip to the section that
          matches yours.
        </p>
      </header>

      {FAQ_SECTIONS.map((s) => (
        <section
          key={s.persona}
          style={{ borderTop: "1px solid var(--line)", padding: "32px 0" }}
        >
          <span className="label" style={{ color: "var(--fg-muted)" }}>
            // {s.kicker}
          </span>
          <h2
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              letterSpacing: "-0.02em",
              fontWeight: 400,
              color: "var(--fg)",
              margin: "8px 0 8px",
            }}
          >
            {s.heading}
          </h2>
          <p
            style={{
              color: "var(--fg-muted)",
              maxWidth: "62ch",
              fontSize: 13.5,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {s.intro}
          </p>
          <Accordion type="single" collapsible>
            {s.entries.map((e) => (
              <AccordionItem
                key={e.id}
                value={`${s.persona}-${e.id}`}
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
        </section>
      ))}

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "32px 0 12px",
          color: "var(--fg-muted)",
          fontSize: 13,
          lineHeight: 1.6,
          maxWidth: "62ch",
        }}
      >
        Question not answered here? Reach us at{" "}
        <a
          href="mailto:hello@ascertainty.com"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          hello@ascertainty.com
        </a>{" "}
        — LPs:{" "}
        <a
          href="mailto:lp@ascertainty.com"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          lp@ascertainty.com
        </a>
        ; borrowers:{" "}
        <a
          href="mailto:borrowers@ascertainty.com"
          style={{
            color: "var(--accent)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          borrowers@ascertainty.com
        </a>
        .
      </footer>
    </Container>
  );
}
