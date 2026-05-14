import Link from "next/link";
import { CoinMark } from "@/components/layout/coin-mark";

function TwitterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/**
 * Footer — Forest brand kit, dark ground, five-column information architecture.
 *
 * Routing convention while the site is being filled out: any link whose
 * target page doesn't exist yet defaults to "/" (the landing) — replace the
 * href in-place when the destination ships. Existing routes:
 *   /lenders · /borrowers · /approach · /projects · /portfolio ·
 *   /docs/underwriting-policy · /docs/faq · /brand
 *
 * GitHub link is intentionally pointed at "/" (not the public repo URL)
 * during the Colosseum window — flip the href when ready to expose.
 */
export function Footer() {
  return (
    <footer className="a-footer a-footer--dark">
      <div className="shell">
        {/* Brand row */}
        <div className="a-footer__brand">
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
        </div>

        {/* Five-column link grid */}
        <div className="a-footer__grid">
          <div>
            <h5>Platform</h5>
            <ul>
              <li><Link href="/lenders">For Lenders</Link></li>
              <li><Link href="/borrowers">For Borrowers</Link></li>
              <li><Link href="/approach">Approach</Link></li>
              <li><Link href="/projects">Projects</Link></li>
              <li><Link href="/portfolio">Portfolio</Link></li>
            </ul>
          </div>
          <div>
            <h5>Approach</h5>
            <ul>
              <li><Link href="/docs/underwriting-policy">Underwriting policy</Link></li>
              <li><Link href="/docs/faq">FAQ</Link></li>
              <li><Link href="/#05-benchmarks">Benchmarks</Link></li>
              <li><Link href="/#06-moat">Moat</Link></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><Link href="/">About</Link></li>
              <li><Link href="/">Team</Link></li>
              <li><Link href="/">Press</Link></li>
              <li><Link href="/">Careers</Link></li>
              <li><a href="mailto:info@ascertainty.com">Contact</a></li>
            </ul>
          </div>
          <div>
            <h5>Developers</h5>
            <ul>
              <li><Link href="/">Build with us</Link></li>
              <li><Link href="/">API docs</Link></li>
              <li><Link href="/">GitHub</Link></li>
              <li><Link href="/brand">Brand kit</Link></li>
            </ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul>
              <li><Link href="/">Privacy</Link></li>
              <li><Link href="/">Terms</Link></li>
              <li><Link href="/">Risk disclosures</Link></li>
              <li><Link href="/">Compliance</Link></li>
            </ul>
          </div>
        </div>

        {/* Social row — hrefs default to "/" until the handles ship. */}
        <div className="a-footer__social" aria-label="Social links">
          <Link href="/" aria-label="Twitter / X" className="a-footer__social-link">
            <TwitterIcon />
          </Link>
          <Link href="/" aria-label="LinkedIn" className="a-footer__social-link">
            <LinkedinIcon />
          </Link>
        </div>

        <div className="a-footer__mono">
          <span>© {new Date().getFullYear()} ascertainty.com. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
