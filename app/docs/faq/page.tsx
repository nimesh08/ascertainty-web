import type { Metadata } from "next";
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

const emailLinkStyle = {
  color: "var(--accent)",
  textDecoration: "underline" as const,
  textUnderlineOffset: 2,
};

export default function FaqPage() {
  return (
    <Container className="py-10 sm:py-14">
      <header style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 5vw, 56px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
            fontWeight: 500,
            color: "var(--fg)",
          }}
        >
          Answers.
        </h1>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {FAQ_SECTIONS.map((s) => (
          <section
            key={s.persona}
            style={{
              background: `repeating-linear-gradient(
                135deg,
                color-mix(in oklab, var(--accent) 4%, var(--bg-0)) 0px,
                color-mix(in oklab, var(--accent) 4%, var(--bg-0)) 60px,
                color-mix(in oklab, var(--accent) 8%, var(--bg-0)) 70px,
                color-mix(in oklab, var(--accent) 2%, var(--bg-0)) 130px
              )`,
              border: "1px solid var(--line)",
              borderRadius: 22,
              padding: "32px 28px",
            }}
          >
            <span className="a-kicker-pill">{s.kicker}</span>
            <h2
              style={{
                fontSize: "clamp(24px, 3vw, 32px)",
                letterSpacing: "-0.02em",
                fontWeight: 400,
                color: "var(--fg)",
                margin: "12px 0 8px",
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
                <AccordionItem key={e.id} value={`${s.persona}-${e.id}`}>
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
      </div>

      <footer
        style={{
          padding: "32px 0 12px",
          color: "var(--fg-muted)",
          fontSize: 13,
          lineHeight: 1.6,
          maxWidth: "62ch",
        }}
      >
        <p style={{ margin: 0 }}>
          Question not answered here? Reach us at{" "}
          <a href="mailto:info@ascertainty.com" style={emailLinkStyle}>
            info@ascertainty.com
          </a>
          .
        </p>
        <p style={{ margin: "4px 0 0" }}>
          Lenders:{" "}
          <a href="mailto:lenders@ascertainty.com" style={emailLinkStyle}>
            lenders@ascertainty.com
          </a>
          . Borrowers:{" "}
          <a href="mailto:borrowers@ascertainty.com" style={emailLinkStyle}>
            borrowers@ascertainty.com
          </a>
          .
        </p>
      </footer>
    </Container>
  );
}
