import Link from "next/link";
import { CoinMark } from "@/components/layout/coin-mark";

const CLUSTER =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet").toLowerCase();
const PROGRAM_ID = process.env.NEXT_PUBLIC_EXIRA_PROGRAM_ID;
const PROGRAM_SHORT = PROGRAM_ID
  ? `${PROGRAM_ID.slice(0, 4)}…${PROGRAM_ID.slice(-4)}`
  : "—";
const SOLANA_EXPLORER_PROGRAM = PROGRAM_ID
  ? `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=${CLUSTER}`
  : "#";

/**
 * Footer — Forest brand kit v0.3 (dark ground, inverse coin).
 *
 * Only links that resolve to real routes are exposed. Aspirational links
 * (SDK, Indexer API, Risk dashboard, Press kit, Disclosures) have been
 * removed rather than dead-anchored — better to ship fewer working links
 * than a long list of #-hrefs that erode reviewer trust.
 */
export function Footer() {
  return (
    <footer className="a-footer a-footer--dark">
      <div className="shell">
        <div className="a-footer__grid">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Ascertainty — back to top"
            >
              <CoinMark size={44} variant="ink" ariaLabel="Ascertainty" />
              <span
                style={{
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Ascertainty
              </span>
            </Link>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 12.5,
                maxWidth: "44ch",
                margin: "16px 0 0",
              }}
            >
              On-chain MSME climate finance. Community capital → measurable energy upgrades,
              settled on Solana.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <span className="a-chip a-chip--dark">Solana · {CLUSTER}</span>
              <span className="a-chip a-chip--dark">Devnet preview</span>
            </div>
          </div>
          <div>
            <h5>Protocol</h5>
            <ul>
              <li><Link href="/projects">Projects</Link></li>
              <li><Link href="/pools">Pools</Link></li>
              <li><Link href="/portfolio">Portfolio</Link></li>
              <li><Link href="/roles">Roles</Link></li>
            </ul>
          </div>
          <div>
            <h5>Resources</h5>
            <ul>
              <li><Link href="/docs/underwriting-policy">Underwriting policy</Link></li>
              <li><Link href="/#03-benchmarks">Benchmarks</Link></li>
              <li><Link href="/#08-moat">Moat</Link></li>
              <li><Link href="/brand">Brand kit</Link></li>
            </ul>
          </div>
          <div>
            <h5>Developers</h5>
            <ul>
              <li>
                <a href={SOLANA_EXPLORER_PROGRAM} target="_blank" rel="noopener">
                  Program ↗
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/nimesh08/exira-web"
                  target="_blank"
                  rel="noopener"
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="a-footer__mono">
          <span>© {new Date().getFullYear()} ascertainty.com. All rights reserved.</span>
          <a
            href={SOLANA_EXPLORER_PROGRAM}
            target="_blank"
            rel="noopener"
            className="mono-num"
            style={{ textDecoration: "none" }}
          >
            Program · {PROGRAM_SHORT} ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
