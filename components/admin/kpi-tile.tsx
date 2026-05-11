import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";

interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "magenta" | "green" | "cyan" | "violet";
  className?: string;
}

const accentBg: Record<NonNullable<KpiTileProps["accent"]>, string> = {
  magenta: "bg-magenta",
  green: "bg-green",
  cyan: "bg-cyan",
  violet: "bg-violet",
};

export function KpiTile({
  label,
  value,
  sub,
  accent = "magenta",
  className,
}: KpiTileProps) {
  return (
    <Card
      className={cn(
        "border-line/70 bg-bg-1/60 transition-colors hover:border-line",
        className
      )}
    >
      <CardContent className="relative space-y-1.5 p-4 sm:p-5">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-3 left-0 w-[2px] rounded-full",
            accentBg[accent]
          )}
        />
        <p className="pl-3 text-[11px] uppercase tracking-[0.18em] text-fg-muted">
          {label}
        </p>
        <p className="mono-num pl-3 text-2xl font-semibold text-fg sm:text-3xl">
          {value}
        </p>
        {sub ? (
          <p className="pl-3 text-xs text-fg-muted">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
