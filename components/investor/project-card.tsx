import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { fmtUsdc, fmtPct } from "@/lib/utils/format";
import { MapPin, Tag, ArrowRight } from "lucide-react";

export interface ProjectCardProject {
  id: string;
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  termMonths: number;
  expectedApyBps?: number | null;
}

export function ProjectCard({ project }: { project: ProjectCardProject }) {
  const target = Number(project.targetUsdc) / 1_000_000;
  const sold = Number(project.tokensSold) / 1_000_000;
  const pct = target > 0 ? Math.min(100, (sold / target) * 100) : 0;
  const estimatedApyPct =
    project.expectedApyBps != null ? project.expectedApyBps / 100 : null;

  return (
    <Card className="group relative gap-0 overflow-hidden p-0 transition-all hover:border-green/30 hover:shadow-[0_0_0_1px_rgba(74,222,128,0.15),0_20px_40px_-20px_rgba(74,222,128,0.25)]">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-fg">
            {project.msmeName}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1">
              <Tag className="size-3" />
              {project.sector.replace(/_/g, " ")}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {project.location}
            </span>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="space-y-2 px-5">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>Funded</span>
          <span className="mono-num text-fg">
            {fmtUsdc(project.tokensSold)} / {fmtUsdc(project.targetUsdc)}
          </span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line/60 px-5 py-4 text-xs">
        <div>
          <p className="text-fg-muted">Term</p>
          <p className="mono-num mt-0.5 text-fg">{project.termMonths} mo</p>
        </div>
        <div>
          <p className="text-fg-muted">Est. APY</p>
          <p className="mono-num mt-0.5 text-green">
            {estimatedApyPct != null ? fmtPct(estimatedApyPct, 1) : "—"}
          </p>
        </div>
        <div>
          <p className="text-fg-muted">Upgrade</p>
          <p className="mt-0.5 truncate text-fg">
            {project.upgradeType.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <Button asChild size="sm" className="w-full">
          <Link href={`/projects/${project.id}`}>
            View project
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
