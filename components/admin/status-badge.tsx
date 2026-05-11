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
  pending: "border-fg-muted/30 bg-bg-2/80 text-fg-muted",
  funding: "border-cyan/40 bg-cyan/10 text-cyan",
  active: "border-green/40 bg-green/10 text-green",
  repaying: "border-violet/40 bg-violet/10 text-violet",
  distributing: "border-violet/40 bg-violet/10 text-violet",
  completed: "border-fg-muted/30 bg-bg-2/80 text-fg-muted",
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
