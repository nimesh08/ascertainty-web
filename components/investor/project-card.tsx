"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ProjectHero } from "./project-hero";
import { formatUsd } from "@/lib/utils/format";
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
  const target = Number(project.targetUsdc);
  const sold = Number(project.tokensSold);
  const pctRaw = target > 0 ? (sold / target) * 100 : 0;
  const pct = Math.min(100, pctRaw);
  // Clamp progress-bar width so it's still visually perceptible when empty.
  const barWidth = Math.max(1, pct);
  const estimatedApyPct =
    project.expectedApyBps != null ? project.expectedApyBps / 100 : 12.0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group relative h-full gap-0 overflow-hidden rounded-2xl border-line/60 bg-bg-1/50 p-0 transition-colors hover:border-green/40">
        <div className="relative">
          <ProjectHero kind="project" className="aspect-[16/9]" />
          <div className="absolute right-3 bottom-3">
            <StatusBadge status={project.status} />
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="space-y-1">
            <h3 className="truncate text-lg font-semibold tracking-tight text-fg">
              {project.msmeName}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
              <span className="inline-flex items-center gap-1">
                <Tag className="size-3" />
                {capitalize(project.sector.replace(/_/g, " "))}
              </span>
              <span aria-hidden className="text-fg-faint">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {project.location}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">Funded</span>
              <span className="mono-num text-fg">
                {formatUsd(project.tokensSold)} /{" "}
                {formatUsd(project.targetUsdc)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-0">
              <div
                className="h-full rounded-full bg-green transition-[width] duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Term" value={`${project.termMonths} mo`} />
            <StatTile
              label="Est. APY"
              value={`${estimatedApyPct.toFixed(1)}%`}
              valueClassName="text-green"
            />
            <StatTile
              label="Upgrade"
              value={capitalize(project.upgradeType.replace(/_/g, " "))}
              truncate
            />
          </div>

          <Button asChild size="sm" className="w-full">
            <Link href={`/projects/${project.id}`}>
              View project
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function StatTile({
  label,
  value,
  valueClassName,
  truncate,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  truncate?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-bg-0/40 px-2.5 py-2">
      <p className="text-[10px] font-medium tracking-wider text-fg-muted uppercase">
        {label}
      </p>
      <p
        className={
          "mono-num mt-0.5 text-sm text-fg " +
          (truncate ? "truncate " : "") +
          (valueClassName ?? "")
        }
      >
        {value}
      </p>
    </div>
  );
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

export default ProjectCard;
