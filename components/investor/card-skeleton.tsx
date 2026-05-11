import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-2 h-1.5 w-full" />
      <div className="mt-2 grid grid-cols-3 gap-3">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
      <Skeleton className="mt-2 h-8 w-full" />
    </Card>
  );
}
