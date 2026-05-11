import Link from "next/link";
import { Container } from "./container";

const sections: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Pools", href: "/pools" },
      { label: "Portfolio", href: "/portfolio" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/60 bg-bg-1/40 backdrop-blur">
      <Container className="py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.18em] text-fg-muted">
                {section.title}
              </h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-fg/80 transition-colors hover:text-fg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-line/60 pt-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Exira Protocol. Devnet preview.</p>
          <p className="mono-num">
            Program: <span className="text-fg/80">J7z1…uotJn2</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
