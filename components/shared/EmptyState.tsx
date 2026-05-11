import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  cta?:
    | { label: string; href: string }
    | { label: string; onClick: () => void };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  cta,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line/60 bg-bg-1/40 p-10 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mx-auto mb-4 grid size-10 place-items-center rounded-full border border-line/60 bg-bg-2/60 text-fg-muted">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
      {cta ? (
        <div className="mt-5">
          {"href" in cta ? (
            <Button asChild size="sm" variant="outline">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={cta.onClick}>
              {cta.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
