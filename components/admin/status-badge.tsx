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

const STYLES: Record<ProjectStatus | PoolStatus, string> = {
  pending: "border-line bg-bg-2 text-fg-faint",
  funding: "border-accent/40 bg-accent/10 text-accent",
  active: "border-accent/40 bg-accent/10 text-accent",
  repaying: "border-line-strong bg-bg-2 text-fg",
  distributing: "border-line-strong bg-bg-2 text-fg",
  completed: "border-line bg-bg-2 text-fg-muted",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus | PoolStatus | string;
  className?: string;
}) {
  const key = (status as ProjectStatus | PoolStatus) ?? "pending";
  const style = STYLES[key] ?? STYLES.pending;
  return (
    <Badge
      variant="outline"
      className={cn("capitalize font-medium text-[10px]", style, className)}
    >
      {status}
    </Badge>
  );
}
