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
}

const accentColor: Record<NonNullable<PageHeaderProps["accent"]>, string> = {
  green: "bg-green",
  cyan: "bg-cyan",
  violet: "bg-violet",
  magenta: "bg-magenta",
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  accent = "green",
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-8 space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-xs text-fg-muted"
        >
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.href ? (
                <Link
                  href={c.href}
                  className="hover:text-fg transition-colors"
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
      <div className="flex items-start gap-3">
        <span
          className={cn("mt-2 block h-6 w-[3px] rounded-full", accentColor[accent])}
          aria-hidden
        />
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-fg-muted sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
