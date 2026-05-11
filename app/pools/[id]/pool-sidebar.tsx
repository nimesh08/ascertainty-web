"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatUsd, formatTokenAmount } from "@/lib/utils/format";
import { type PositionData } from "@/lib/solana/reads";

interface Props {
  pool: { targetUsdc: string; tokensSold: string };
  apyPct: number;
  pct: number;
  connected: boolean;
  login: () => void;
  position: PositionData | null;
  claimable: bigint;
  canInvest: boolean;
  onInvest: () => void;
  onClaim: () => void;
  projectCount: number;
}

export function PoolSidebar({
  pool,
  apyPct,
  pct,
  connected,
  login,
  position,
  claimable,
  canInvest,
  onInvest,
  onClaim,
  projectCount,
}: Props) {
  const hasPosition = !!(position?.exists && position.tokensHeld > 0n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-line/60 bg-bg-1/60 p-6 backdrop-blur-sm"
    >
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
            Blended return (XIRR)
          </p>
          <p className="mono-num mt-1 text-4xl font-bold text-violet">
            {apyPct > 0 ? `${apyPct.toFixed(2)}%` : "—"}
          </p>
        </div>

        <div className="h-px w-full bg-line/60" />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
              Funding progress
            </p>
            <span className="mono-num text-sm font-medium text-fg">
              {pct.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={pct}
            className="h-1.5 [&_[data-slot=progress-indicator]]:bg-violet"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="mono-num text-fg">
              {formatUsd(pool.tokensSold)} raised
            </span>
            <span className="mono-num text-fg-muted">
              Goal: {formatUsd(pool.targetUsdc)}
            </span>
          </div>
          <p className="mono-num mt-1 text-[11px] text-fg-muted">
            Shares sold: {formatTokenAmount(pool.tokensSold)}
          </p>
        </div>

        <div className="h-px w-full bg-line/60" />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-line/60 bg-bg-2/40 p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-fg-muted">
              Min inv.
            </p>
            <p className="mono-num mt-0.5 text-sm font-medium text-fg">$1</p>
          </div>
          <div className="rounded-lg border border-line/60 bg-bg-2/40 p-3">
            <p className="text-[10px] font-medium uppercase tracking-widest text-fg-muted">
              Projects
            </p>
            <p className="mono-num mt-0.5 text-sm font-medium text-fg">
              {projectCount}
            </p>
          </div>
        </div>

        {hasPosition ? (
          <>
            <div className="h-px w-full bg-line/60" />
            <div className="space-y-2 rounded-lg border border-violet/20 bg-violet/5 p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-violet">
                Your position
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Pool tokens</span>
                <span className="mono-num text-fg">
                  {formatTokenAmount(position!.tokensHeld.toString())}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Claimable</span>
                <span className="mono-num text-green">
                  {formatUsd(claimable.toString())}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={onClaim}
                disabled={claimable === 0n}
              >
                Claim returns
              </Button>
            </div>
          </>
        ) : null}

        <div className="h-px w-full bg-line/60" />

        {!connected ? (
          <Button onClick={() => login()} className="w-full">
            Connect wallet
          </Button>
        ) : (
          <Button
            onClick={onInvest}
            disabled={!canInvest}
            className="w-full"
            size="lg"
          >
            Invest in pool
          </Button>
        )}
        <p className="text-[11px] leading-relaxed text-fg-muted">
          * Capital at risk. Read offer documents carefully before investing.
        </p>
      </div>
    </motion.div>
  );
}
