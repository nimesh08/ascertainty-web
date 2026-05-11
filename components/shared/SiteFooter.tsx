import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";

export function SiteFooter() {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";
  return (
    <footer className="mt-16 border-t border-line/60 bg-bg-1/40 backdrop-blur">
      <Container className="py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.18em] text-fg-muted">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-fg/80 hover:text-fg" href="/projects">
                  Projects
                </Link>
              </li>
              <li>
                <Link className="text-fg/80 hover:text-fg" href="/pools">
                  Pools
                </Link>
              </li>
              <li>
                <Link className="text-fg/80 hover:text-fg" href="/portfolio">
                  Portfolio
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.18em] text-fg-muted">
              Network
            </h3>
            <ul className="space-y-2 text-sm text-fg/80">
              <li className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-cyan/40 bg-cyan/10 text-cyan capitalize"
                >
                  {cluster}
                </Badge>
                <span className="text-xs text-fg-muted">Solana</span>
              </li>
              <li className="mono-num text-xs text-fg-muted">
                Program J7z1…uotJn2
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.18em] text-fg-muted">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-fg/80 hover:text-fg" href="/#how">
                  How it works
                </Link>
              </li>
              <li>
                <Link className="text-fg/80 hover:text-fg" href="/#faq">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  className="text-fg/80 hover:text-fg"
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noopener"
                >
                  Solana Explorer
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.18em] text-fg-muted">
              Disclaimers
            </h3>
            <p className="text-xs leading-relaxed text-fg-muted">
              Exira is a devnet preview. Tokens have no monetary value. Nothing
              here is investment advice. Energy savings are measured by
              licensed auditors and settled in devnet USDC.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line/60 pt-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Exira Protocol. All rights reserved.</p>
          <p className="mono-num text-fg/70">
            Built on Solana · Tokenized climate finance
          </p>
        </div>
      </Container>
    </footer>
  );
}
