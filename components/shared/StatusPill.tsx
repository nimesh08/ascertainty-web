import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

type AnyStatus =
  | "pending"
  | "funding"
  | "active"
  | "repaying"
  | "distributing"
  | "completed"
  | "cancelled";

const STYLES: Record<
  AnyStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className: "border-fg-faint/40 bg-bg-2 text-fg-muted",
    dot: "bg-fg-muted",
  },
  funding: {
    label: "Funding",
    className: "border-cyan/40 bg-cyan/10 text-cyan",
    dot: "bg-cyan",
  },
  active: {
    label: "Active",
    className: "border-green/40 bg-green/10 text-green",
    dot: "bg-green",
  },
  repaying: {
    label: "Repaying",
    className: "border-violet/40 bg-violet/10 text-violet",
    dot: "bg-violet",
  },
  distributing: {
    label: "Distributing",
    className: "border-violet/40 bg-violet/10 text-violet",
    dot: "bg-violet",
  },
  completed: {
    label: "Completed",
    className: "border-fg-muted/40 bg-bg-2 text-fg-muted",
    dot: "bg-fg-muted",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: AnyStatus | string;
  className?: string;
}) {
  const s = (STYLES as Record<string, (typeof STYLES)[AnyStatus]>)[status] ?? STYLES.pending;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 px-2 py-0.5 text-xs", s.className, className)}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
      {s.label}
    </Badge>
  );
}
