import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";

const CLUSTER =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet").toLowerCase();
const PROGRAM_ID = process.env.NEXT_PUBLIC_EXIRA_PROGRAM_ID;
const PROGRAM_SHORT = PROGRAM_ID
  ? `${PROGRAM_ID.slice(0, 4)}…${PROGRAM_ID.slice(-4)}`
  : "—";
const TODAY = new Date().toISOString().slice(0, 10);

export function Footer() {
  return (
    <footer className="a-footer">
      <div className="shell">
        <div className="a-footer__grid">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Ascertainty — back to top"
            >
              <BrandMark size={40} />
              <span
                style={{
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontSize: 13,
                  color: "var(--fg)",
                }}
              >
                Ascertainty
              </span>
            </Link>
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: 12.5,
                maxWidth: "44ch",
                margin: "16px 0 0",
              }}
            >
              On-chain MSME climate finance. Community capital → measurable energy upgrades,
              settled on Solana.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <span className="a-chip">Solana · {CLUSTER}</span>
              <span className="a-chip">Devnet preview</span>
            </div>
          </div>
          <div>
            <h5>Protocol</h5>
            <ul>
              <li><Link href="/projects">Projects</Link></li>
              <li><Link href="/pools">Pools</Link></li>
              <li><Link href="/portfolio">Portfolio</Link></li>
              <li><a href="#">MRV registry</a></li>
            </ul>
          </div>
          <div>
            <h5>Developers</h5>
            <ul>
              <li><a href="#">Program</a></li>
              <li><a href="#">SDK</a></li>
              <li><a href="#">Indexer API</a></li>
              <li><a href="#">RWA.xyz</a></li>
            </ul>
          </div>
          <div>
            <h5>Resources</h5>
            <ul>
              <li><a href="#">Litepaper</a></li>
              <li><a href="#">Underwriting policy</a></li>
              <li><a href="#">Risk dashboard</a></li>
              <li><a href="#">Press kit</a></li>
            </ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Disclosures</a></li>
              <li><a href="#">Brand</a></li>
            </ul>
          </div>
        </div>
        <div className="a-footer__mono">
          <span>© {new Date().getFullYear()} Ascertainty Protocol</span>
          <span className="mono-num">Program · {PROGRAM_SHORT} · {TODAY}</span>
          <span>Status · All systems nominal</span>
        </div>
      </div>
    </footer>
  );
}
