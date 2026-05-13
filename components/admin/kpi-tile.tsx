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
  magenta: "bg-accent",
  green: "bg-accent",
  cyan: "bg-accent",
  violet: "bg-accent",
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
        "h-full border-line/70 bg-bg-1/60 transition-colors hover:border-line",
        className
      )}
    >
      <CardContent className="relative flex h-full min-w-0 flex-col gap-1.5 p-4 sm:p-5">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-[2px] rounded-full",
            accentBg[accent]
          )}
        />
        <p className="pl-3 text-[11px] uppercase tracking-[0.18em] text-fg-muted">
          {label}
        </p>
        <p className="mono-num min-w-0 truncate pl-3 text-2xl font-semibold tracking-tight text-fg tabular-nums">
          {value}
        </p>
        {sub ? (
          <p className="pl-3 text-xs leading-snug text-fg-muted">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
