import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "green" | "cyan" | "violet" | "magenta";
  className?: string;
}

const ACCENTS = {
  green: "from-green/15",
  cyan: "from-cyan/15",
  violet: "from-violet/15",
  magenta: "from-magenta/15",
} as const;

export function StatTile({ label, value, sub, accent = "green", className }: StatTileProps) {
  return (
    <Card
      className={cn(
        "relative gap-1 overflow-hidden bg-gradient-to-br to-card px-5 py-4",
        ACCENTS[accent],
        className
      )}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">
        {label}
      </p>
      <p className="mono-num text-xl font-medium text-fg sm:text-2xl">
        {value}
      </p>
      {sub ? (
        <p className="text-xs text-fg-muted">{sub}</p>
      ) : null}
    </Card>
  );
}
