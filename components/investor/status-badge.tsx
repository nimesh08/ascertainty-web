import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

type ProjectStatus =
  | "pending"
  | "funding"
  | "active"
  | "repaying"
  | "completed"
  | "cancelled";

type PoolStatus =
  | "funding"
  | "active"
  | "distributing"
  | "completed"
  | "cancelled";

export type AnyStatus = ProjectStatus | PoolStatus;

// Single-accent palette: open/operational states use the theme accent (green),
// terminal/inactive states fade to neutral, cancelled stays destructive.
const STYLES: Record<
  AnyStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "border-line bg-bg-2 text-fg-faint",
    dot: "bg-fg-faint",
  },
  funding: {
    label: "Funding",
    className: "border-accent/40 bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  active: {
    label: "Active",
    className: "border-accent/40 bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  repaying: {
    label: "Repaying",
    className: "border-line-strong bg-bg-2 text-fg",
    dot: "bg-fg",
  },
  distributing: {
    label: "Distributing",
    className: "border-line-strong bg-bg-2 text-fg",
    dot: "bg-fg",
  },
  completed: {
    label: "Completed",
    className: "border-line bg-bg-2 text-fg-muted",
    dot: "bg-fg-muted",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnyStatus | string;
  className?: string;
}) {
  const s = (STYLES as Record<string, (typeof STYLES)[AnyStatus]>)[status] ??
    STYLES.pending;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 px-2 py-0.5", s.className, className)}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", s.dot)}
      />
      {s.label}
    </Badge>
  );
}
