"use client";

import { useState } from "react";

interface CodeTerminalProps {
  language: string;
  code: string;
}

/**
 * Light Mac-terminal-style code block: cream bg, sage-tinted chrome, single
 * language pill tab, copy-to-clipboard button. Used in §03 BENCHMARKS to
 * present the curl reproduction example. Honest tab count — only the
 * languages we actually have an example for ship as tabs.
 */
export function CodeTerminal({ language, code }: CodeTerminalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard may be blocked in iframes / older browsers; silently no-op
    }
  }

  return (
    <div className="a-term">
      <div className="a-term__bar">
        <div className="a-term__dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <span className="a-term__tab a-term__tab--active">
          <span className="a-term__tab-dot" aria-hidden />
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="a-term__copy"
          aria-label="Copy code to clipboard"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="a-term__code">
        <code>{code}</code>
      </pre>
    </div>
  );
}
