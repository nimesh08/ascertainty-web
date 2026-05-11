"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Tag, ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./StatusPill";
import { ProgressBar } from "./ProgressBar";
import { fmtUsdc, fmtPct } from "@/lib/utils/format";

export interface ProjectCardModel {
  id: string;
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  termMonths: number;
  /** Optional estimated APY (%). Falls back to `expectedApyBps` on the DB row. */
  estimatedApyPct?: number;
  expectedApyBps?: number | null;
}

export function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectCardModel;
  priority?: boolean;
}) {
  const target = Number(project.targetUsdc);
  const sold = Number(project.tokensSold);
  const pct = target > 0 ? Math.min(100, (sold / target) * 100) : 0;
  const apy =
    project.estimatedApyPct ??
    (project.expectedApyBps != null ? project.expectedApyBps / 100 : null);

  return (
    <motion.div
      initial={priority ? false : { opacity: 0, y: 12 }}
      whileInView={priority ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
    >
      <Card className="group relative gap-0 overflow-hidden p-0 transition-all duration-300 hover:border-green/30 hover:shadow-[0_0_0_1px_rgba(74,222,128,0.12),0_20px_40px_-22px_rgba(74,222,128,0.3)]">
        <div className="flex items-start justify-between gap-3 p-6 pb-3">
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
          <StatusPill status={project.status} />
        </div>

        <div className="space-y-2 px-6">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>Funded</span>
            <span className="mono-num text-fg">
              {fmtUsdc(project.tokensSold)} / {fmtUsdc(project.targetUsdc)}
            </span>
          </div>
          <ProgressBar value={pct} color="green" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line/60 px-6 py-4 text-xs">
          <div>
            <p className="text-fg-muted">Term</p>
            <p className="mono-num mt-0.5 text-fg">{project.termMonths} mo</p>
          </div>
          <div>
            <p className="text-fg-muted">Est. APY</p>
            <p className="mono-num mt-0.5 text-green">
              {apy != null ? fmtPct(apy, 1) : "—"}
            </p>
          </div>
          <div>
            <p className="text-fg-muted">Upgrade</p>
            <p className="mt-0.5 truncate text-fg">
              {project.upgradeType.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Button asChild size="sm" className="w-full">
            <Link href={`/projects/${project.id}`}>
              View project <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
