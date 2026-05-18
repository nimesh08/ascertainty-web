import * as fs from "node:fs";
import * as path from "node:path";

import { Container } from "@/components/layout/container";
import {
  type PolicyHeading,
  extractHeadings,
  renderPolicyMarkdown,
} from "@/lib/utils/policy-md";

export const dynamic = "force-static";

export const metadata = {
  title: "Underwriting Policy | Ascertainty",
  description:
    "Ascertainty's binding underwriting standard for tokenized retrofit-savings vaults. Published for LP, borrower, and partner transparency.",
};

function loadPolicyMarkdown(): string {
  const p = path.resolve(process.cwd(), "docs/UNDERWRITING_POLICY.md");
  return fs.readFileSync(p, "utf-8");
}

export default function UnderwritingPolicyPage() {
  const md = loadPolicyMarkdown();
  const html = renderPolicyMarkdown(md);
  const headings = extractHeadings(md);

  return (
    <Container className="py-10 sm:py-14">
      <details className="mb-6 rounded border border-line/60 bg-bg-1 p-3 text-sm lg:hidden">
        <summary className="cursor-pointer font-medium">Contents</summary>
        <TableOfContents headings={headings} className="mt-3" />
      </details>

      <div className="mx-auto lg:flex lg:max-w-[1080px] lg:gap-10">
        <article
          className="prose-policy mx-auto max-w-3xl text-fg lg:mx-0 lg:flex-1"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <aside className="hidden lg:block lg:w-56 lg:shrink-0">
          <div className="sticky top-20">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-fg-muted">
              Contents
            </p>
            <TableOfContents headings={headings} />
          </div>
        </aside>
      </div>
    </Container>
  );
}

function TableOfContents({
  headings,
  className,
}: {
  headings: PolicyHeading[];
  className?: string;
}) {
  return (
    <nav className={className} aria-label="Table of contents">
      <ol className="space-y-1">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "ml-3" : ""}>
            <a
              href={`#${h.id}`}
              className={
                h.level === 2
                  ? "text-sm text-fg hover:text-accent"
                  : "text-[0.8rem] text-fg-muted hover:text-accent"
              }
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
