/**
 * Focused markdown→HTML renderer for /docs/underwriting-policy.
 *
 * Scope is narrow — only the constructs the policy document uses:
 *   - h1/h2/h3 (with stable anchor IDs derived from leading "5.1" patterns)
 *   - paragraphs
 *   - bullet lists
 *   - tables (GFM pipe syntax)
 *   - inline code, bold, italic, links
 *   - thematic break (---)
 *   - block quotes
 *
 * No external dependency. If the policy doc grows beyond this surface,
 * swap in `marked` later — the route only consumes the rendered HTML.
 */

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE[c]);
}

/**
 * Build anchor id for a heading.
 * "## 5. Quantitative Thresholds"  -> "section-5"
 * "### 5.1 Debt service coverage"  -> "section-5-1"
 * Other headings -> slug of the text.
 */
export function headingAnchor(text: string): string {
  const m = text.match(/^(\d+(?:\.\d+)*)/);
  if (m) {
    return `section-${m[1].replace(/\./g, "-")}`;
  }
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderInline(s: string): string {
  // Order matters: code first (so * in code isn't treated as bold), then links, bold, italic.
  let out = escapeHtml(s);
  // inline code `like this`
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-bg-2 px-1 text-[0.85em]">$1</code>');
  // [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-accent underline underline-offset-2">$1</a>'
  );
  // **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // *italic* / _italic_
  out = out.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1<em>$2</em>");
  out = out.replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, "$1<em>$2</em>");
  return out;
}

type BulletNode = { text: string; children: BulletNode[] };

function buildBulletTree(
  lines: string[],
  startIdx: number
): { nodes: BulletNode[]; nextIdx: number } {
  const first = lines[startIdx].match(/^(\s*)[-*]\s+(.*)$/);
  if (!first) return { nodes: [], nextIdx: startIdx };
  const baseIndent = first[1].length;
  const nodes: BulletNode[] = [];
  let i = startIdx;
  while (i < lines.length) {
    const m = lines[i].match(/^(\s*)[-*]\s+(.*)$/);
    if (!m) break;
    const indent = m[1].length;
    if (indent < baseIndent) break;
    if (indent === baseIndent) {
      nodes.push({ text: m[2], children: [] });
      i++;
    } else {
      const last = nodes[nodes.length - 1];
      if (!last) break;
      const sub = buildBulletTree(lines, i);
      last.children = sub.nodes;
      i = sub.nextIdx;
    }
  }
  return { nodes, nextIdx: i };
}

function renderBulletList(items: BulletNode[], depth: number): string {
  const margin = depth === 0 ? "my-3" : "my-1";
  return `<ul class="${margin} ml-5 list-disc space-y-1">${items
    .map((it) => {
      const inner = it.children.length > 0 ? renderBulletList(it.children, depth + 1) : "";
      return `<li>${renderInline(it.text)}${inner}</li>`;
    })
    .join("")}</ul>`;
}

function renderTable(lines: string[]): string {
  // First line: header. Second line: alignment row. Subsequent: rows.
  const split = (line: string) =>
    line
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
  const head = split(lines[0]);
  const rows = lines.slice(2).map(split);
  const headHtml = head.map((c) => `<th class="px-3 py-1 text-left">${renderInline(c)}</th>`).join("");
  const rowsHtml = rows
    .map(
      (r) =>
        `<tr class="border-t border-line/60">${r
          .map((c) => `<td class="px-3 py-1 align-top">${renderInline(c)}</td>`)
          .join("")}</tr>`
    )
    .join("");
  return `<div class="overflow-x-auto my-4"><table class="w-full text-sm"><thead class="text-xs uppercase tracking-wide text-fg-muted bg-bg-1"><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}

export type PolicyHeading = { level: 2 | 3; text: string; id: string };

export function extractHeadings(md: string): PolicyHeading[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: PolicyHeading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(##|###)\s+(.*)$/);
    if (m) {
      const level = m[1].length as 2 | 3;
      const text = m[2].trim();
      out.push({ level, text, id: headingAnchor(text) });
    }
  }
  return out;
}

export function renderPolicyMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = headingAnchor(text);
      const sizes: Record<number, string> = {
        1: "text-3xl mt-8 mb-4 font-semibold",
        2: "text-2xl mt-8 mb-3 font-semibold border-b border-line pb-2",
        3: "text-lg mt-6 mb-2 font-medium",
        4: "text-base mt-4 mb-2 font-medium",
      };
      const cls = sizes[level] ?? "text-base mt-4 mb-2 font-medium";
      html.push(
        `<h${level} id="${id}" class="${cls} scroll-mt-20"><a href="#${id}" class="hover:text-accent">${renderInline(text)}</a></h${level}>`
      );
      i++;
      continue;
    }

    // horizontal rule
    if (/^---+\s*$/.test(line)) {
      html.push('<hr class="my-6 border-line" />');
      i++;
      continue;
    }

    // table block (heuristic: line containing | followed by separator row)
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      const block: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        block.push(lines[i]);
        i++;
      }
      html.push(renderTable(block));
      continue;
    }

    // bullet list (supports nesting by indentation)
    if (/^\s*[-*]\s+/.test(line)) {
      const { nodes, nextIdx } = buildBulletTree(lines, i);
      html.push(renderBulletList(nodes, 0));
      i = nextIdx;
      continue;
    }

    // numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      html.push(
        `<ol class="my-3 ml-5 list-decimal space-y-1">${items
          .map((it) => `<li>${renderInline(it)}</li>`)
          .join("")}</ol>`
      );
      continue;
    }

    // block quote
    if (/^>\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^>\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^>\s+/, ""));
        i++;
      }
      html.push(
        `<blockquote class="my-3 border-l-2 border-line pl-3 text-fg-muted italic">${renderInline(items.join(" "))}</blockquote>`
      );
      continue;
    }

    // fenced code block
    if (/^```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      html.push(
        `<pre class="my-3 overflow-x-auto bg-bg-2 p-3 text-[11px] sm:text-xs font-mono whitespace-pre-wrap break-words">${escapeHtml(code.join("\n"))}</pre>`
      );
      continue;
    }

    // blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // paragraph — gather until blank line
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s+|---+\s*$|>\s+|```)/.test(lines[i])) {
      // Don't consume table or list openings into the paragraph
      if (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i])) break;
      if (lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[i + 1])) break;
      paragraph.push(lines[i]);
      i++;
    }
    if (paragraph.length > 0) {
      html.push(`<p class="my-3 leading-relaxed">${renderInline(paragraph.join(" "))}</p>`);
    }
  }

  return html.join("\n");
}
