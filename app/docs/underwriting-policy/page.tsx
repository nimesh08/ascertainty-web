import * as fs from "node:fs";
import * as path from "node:path";

import { Container } from "@/components/layout/container";
import { renderPolicyMarkdown } from "@/lib/utils/policy-md";

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

  return (
    <Container className="py-10 sm:py-14">
      <article
        className="prose-policy max-w-3xl text-fg"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Container>
  );
}
