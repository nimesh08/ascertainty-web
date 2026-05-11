import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { fmtUsdc, fmtPct } from "@/lib/utils/format";
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
  const target = Number(pool.targetUsdc) / 1_000_000;
  const sold = Number(pool.tokensSold) / 1_000_000;
  const pct = target > 0 ? Math.min(100, (sold / target) * 100) : 0;
  const blendedApyPct =
    pool.expectedApyBps != null ? pool.expectedApyBps / 100 : null;

  return (
    <Card className="group relative gap-0 overflow-hidden p-0 transition-all hover:border-violet/30 hover:shadow-[0_0_0_1px_rgba(167,139,250,0.15),0_20px_40px_-20px_rgba(167,139,250,0.25)]">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-fg">
            {pool.name}
          </h3>
          <p className="line-clamp-2 text-xs text-fg-muted">
            {pool.description ?? "Diversified basket of MSME projects."}
          </p>
        </div>
        <StatusBadge status={pool.status} />
      </div>

      <div className="space-y-2 px-5">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>Raised</span>
          <span className="mono-num text-fg">
            {fmtUsdc(pool.tokensSold)} / {fmtUsdc(pool.targetUsdc)}
          </span>
        </div>
        <Progress value={pct} className="h-1.5 [&_[data-slot=progress-indicator]]:bg-violet" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line/60 px-5 py-4 text-xs">
        <div>
          <p className="text-fg-muted">Projects</p>
          <p className="mono-num mt-0.5 inline-flex items-center gap-1 text-fg">
            <Layers className="size-3" />
            {pool.projectCount ?? 0}
          </p>
        </div>
        <div>
          <p className="text-fg-muted">Blend APY</p>
          <p className="mono-num mt-0.5 text-violet">
            {blendedApyPct != null ? fmtPct(blendedApyPct, 1) : "—"}
          </p>
        </div>
        <div>
          <p className="text-fg-muted">Raised</p>
          <p className="mono-num mt-0.5 text-fg">{pct.toFixed(0)}%</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <Button asChild size="sm" variant="secondary" className="w-full">
          <Link href={`/pools/${pool.id}`}>
            View pool
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
