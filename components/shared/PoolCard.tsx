"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./StatusPill";
import { ProgressBar } from "./ProgressBar";
import { fmtUsdc, fmtPct } from "@/lib/utils/format";

export interface PoolCardModel {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  projectCount: number;
  blendedApyPct?: number;
  expectedApyBps?: number | null;
}

export function PoolCard({ pool }: { pool: PoolCardModel }) {
  const target = Number(pool.targetUsdc);
  const sold = Number(pool.tokensSold);
  const pct = target > 0 ? Math.min(100, (sold / target) * 100) : 0;
  const apy =
    pool.blendedApyPct ??
    (pool.expectedApyBps != null ? pool.expectedApyBps / 100 : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
    >
      <Card className="group relative gap-0 overflow-hidden p-0 transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_0_1px_rgba(167,139,250,0.12),0_20px_40px_-22px_rgba(167,139,250,0.3)]">
        <div className="flex items-start justify-between gap-3 p-6 pb-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-base font-semibold tracking-tight text-fg">
              {pool.name}
            </h3>
            <p className="line-clamp-2 text-xs text-fg-muted">
              {pool.description ?? "Diversified basket of MSME projects."}
            </p>
          </div>
          <StatusPill status={pool.status} />
        </div>

        <div className="space-y-2 px-6">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>Raised</span>
            <span className="mono-num text-fg">
              {fmtUsdc(pool.tokensSold)} / {fmtUsdc(pool.targetUsdc)}
            </span>
          </div>
          <ProgressBar value={pct} color="violet" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line/60 px-6 py-4 text-xs">
          <div>
            <p className="text-fg-muted">Projects</p>
            <p className="mono-num mt-0.5 inline-flex items-center gap-1 text-fg">
              <Layers className="size-3" />
              {pool.projectCount}
            </p>
          </div>
          <div>
            <p className="text-fg-muted">Blend APY</p>
            <p className="mono-num mt-0.5 text-accent">
              {apy != null ? fmtPct(apy, 1) : "—"}
            </p>
          </div>
          <div>
            <p className="text-fg-muted">Raised</p>
            <p className="mono-num mt-0.5 text-fg">{pct.toFixed(0)}%</p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Button asChild size="sm" variant="secondary" className="w-full">
            <Link href={`/pools/${pool.id}`}>
              View pool <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
