import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  accent?: "green" | "cyan" | "violet" | "magenta";
  className?: string;
  /** Ascertainty section index, e.g. "Projects", "Vault · IN-EE-SR-001" */
  kicker?: string;
  /** Optional right-side slot (filter chips, status badges, etc.) */
  right?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  className,
  kicker,
  right,
}: PageHeaderProps) {
  return (
    <header className={cn("a-page-head", className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-[10.5px] uppercase tracking-[0.18em] text-fg-muted"
            style={{ marginBottom: 6 }}
          >
            {breadcrumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {c.href ? (
                  <Link
                    href={c.href}
                    className="transition-colors hover:text-fg"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-fg">{c.label}</span>
                )}
                {i < breadcrumbs.length - 1 ? (
                  <span className="text-fg-faint">/</span>
                ) : null}
              </span>
            ))}
          </nav>
        ) : null}
        {kicker ? <span className="label">§ {kicker}</span> : null}
        <h1>{title}</h1>
        {description ? (
          <p
            style={{
              color: "var(--fg-muted)",
              maxWidth: "60ch",
              marginTop: 14,
              fontSize: 13,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {right ? <div className="filter-row" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{right}</div> : null}
    </header>
  );
}
