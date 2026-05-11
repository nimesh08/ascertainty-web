"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { ProjectHero } from "./project-hero";
import { formatUsd } from "@/lib/utils/format";
import { ArrowRight, Layers } from "lucide-react";

export interface PoolCardPool {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  projectCount?: number;
  expectedApyBps?: number | null;
}

export function PoolCard({ pool }: { pool: PoolCardPool }) {
  const target = Number(pool.targetUsdc);
  const sold = Number(pool.tokensSold);
  const pctRaw = target > 0 ? (sold / target) * 100 : 0;
  const pct = Math.min(100, pctRaw);
  const barWidth = Math.max(1, pct);
  const blendedApyPct =
    pool.expectedApyBps != null ? pool.expectedApyBps / 100 : null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group relative h-full gap-0 overflow-hidden rounded-2xl border-line/60 bg-bg-1/50 p-0 transition-colors hover:border-violet/40">
        <div className="relative">
          <ProjectHero kind="pool" className="aspect-[16/9]" />
          <div className="absolute right-3 bottom-3">
            <StatusBadge status={pool.status} />
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="space-y-1">
            <h3 className="truncate text-lg font-semibold tracking-tight text-fg">
              {pool.name}
            </h3>
            <p className="line-clamp-2 text-xs text-fg-muted">
              {pool.description ?? "Diversified basket of MSME projects."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">Raised</span>
              <span className="mono-num text-fg">
                {formatUsd(pool.tokensSold)} / {formatUsd(pool.targetUsdc)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-0">
              <div
                className="h-full rounded-full bg-violet transition-[width] duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label="Projects"
              value={
                pool.projectCount != null ? String(pool.projectCount) : "N/A"
              }
              icon={<Layers className="size-3" />}
            />
            <StatTile
              label="Blend APY"
              value={
                blendedApyPct != null ? `${blendedApyPct.toFixed(1)}%` : "—"
              }
              valueClassName="text-violet"
            />
            <StatTile label="Raised" value={`${pct.toFixed(0)}%`} />
          </div>

          <Button asChild size="sm" variant="secondary" className="w-full">
            <Link href={`/pools/${pool.id}`}>
              View pool
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
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-bg-0/40 px-2.5 py-2">
      <p className="text-[10px] font-medium tracking-wider text-fg-muted uppercase">
        {label}
      </p>
      <p
        className={
          "mono-num mt-0.5 inline-flex items-center gap-1 text-sm text-fg " +
          (valueClassName ?? "")
        }
      >
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

export default PoolCard;
