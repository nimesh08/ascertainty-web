"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatUsd, formatTokenAmount } from "@/lib/utils/format";
import { type PositionData } from "@/lib/solana/reads";

interface SidebarProps {
  project: {
    targetUsdc: string;
    tokensSold: string;
    termMonths: number;
  };
  apyPct: number;
  pct: number;
  connected: boolean;
  login: () => void;
  position: PositionData | null;
  claimable: bigint;
  canInvest: boolean;
  onInvest: () => void;
  onClaim: () => void;
  underwriting?: {
    dealId: string;
    confidenceGrade: string | null;
    modelUsed: string | null;
  } | null;
}

export function Sidebar({
  project,
  apyPct,
  pct,
  connected,
  login,
  position,
  claimable,
  canInvest,
  onInvest,
  onClaim,
  underwriting,
}: SidebarProps) {
  const hasPosition = !!(position?.exists && position.tokensHeld > 0n);
  const grade = underwriting?.confidenceGrade as "A" | "B" | "C" | null | undefined;
  const gradePalette = grade === "A"
    ? "border-green/40 bg-green/10 text-green"
    : grade === "B"
      ? "border-[#eab308]/40 bg-[#eab308]/10 text-[#eab308]"
      : grade === "C"
        ? "border-accent/40 bg-accent/10 text-accent"
        : "";

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
            Target return (XIRR)
          </p>
          <p className="mono-num mt-1 text-4xl font-bold text-green">
            {apyPct > 0 ? `${apyPct.toFixed(2)}%` : "—"}
          </p>
          {underwriting ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {grade ? (
                <span
                  className={[
                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                    gradePalette,
                  ].join(" ")}
                >
                  Grade {grade}
                </span>
              ) : null}
              <span className="text-[10px] text-fg-muted">
                {underwriting.modelUsed ?? "PINN"}
              </span>
            </div>
          ) : null}
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
          <Progress value={pct} className="h-1.5" />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="mono-num text-fg">
              {formatUsd(project.tokensSold)} raised
            </span>
            <span className="mono-num text-fg-muted">
              Goal: {formatUsd(project.targetUsdc)}
            </span>
          </div>
          <p className="mono-num mt-1 text-[11px] text-fg-muted">
            Shares sold: {formatTokenAmount(project.tokensSold)}
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
              Duration
            </p>
            <p className="mono-num mt-0.5 text-sm font-medium text-fg">
              {project.termMonths} M
            </p>
          </div>
        </div>

        {hasPosition ? (
          <>
            <div className="h-px w-full bg-line/60" />
            <div className="space-y-2 rounded-lg border border-green/20 bg-green/5 p-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-green">
                Your position
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Tokens held</span>
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
            Invest now
          </Button>
        )}
        {underwriting ? (
          <Link
            href={`/lender/${underwriting.dealId}`}
            className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-line/60 bg-bg-2/40 px-3 py-1.5 text-[11px] text-fg-muted transition-colors hover:text-fg"
          >
            View lender brief <ArrowRight className="size-3" />
          </Link>
        ) : null}
        <p className="text-[11px] leading-relaxed text-fg-muted">
          * Capital at risk. Read offer documents carefully before investing.
        </p>
      </div>
    </motion.div>
  );
}
