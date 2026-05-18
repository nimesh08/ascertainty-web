"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtNumber } from "@/lib/utils/format";
import type { WalletBalances, TokenBalance } from "@/lib/solana/balances";

export interface WalletBalancesCardProps {
  owner: string;
  /** Optional compact mode for embedding. Defaults to full. */
  compact?: boolean;
}

async function fetchBalances(owner: string): Promise<WalletBalances> {
  const res = await fetch(
    `/api/wallet/balances?owner=${encodeURIComponent(owner)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`balances ${res.status}`);
  return (await res.json()) as WalletBalances;
}

export function useWalletBalances(owner: string | null | undefined) {
  return useQuery<WalletBalances>({
    queryKey: ["wallet-balances", owner],
    queryFn: () => fetchBalances(owner!),
    enabled: !!owner,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

function fmtSol(ui: number): string {
  return fmtNumber(ui, 4);
}

function fmtUsdcUi(ui: number): string {
  return fmtNumber(ui, 2);
}

function fmtTokenUi(ui: number): string {
  if (ui >= 1000) return fmtNumber(ui, 2);
  if (ui >= 1) return fmtNumber(ui, 4);
  return fmtNumber(ui, 6);
}

function TokenRow({ t }: { t: TokenBalance }) {
  const href =
    t.kind === "project" && t.projectId
      ? `/projects/${t.projectId}`
      : t.kind === "pool" && t.poolId
      ? `/pools/${t.poolId}`
      : null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">{t.label}</p>
        <p className="mono-num text-xs text-fg-muted">{t.symbol}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="mono-num text-sm text-fg">{fmtTokenUi(t.uiAmount)}</span>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-green"
          >
            View
            <ExternalLink className="size-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function WalletBalancesCard({ owner }: WalletBalancesCardProps) {
  const { data, isLoading, isError } = useWalletBalances(owner);

  if (isLoading) {
    return (
      <Card className="gap-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-sm text-fg-muted">
        Couldn&apos;t load wallet balances. Try again in a moment.
      </Card>
    );
  }

  const exiraTokens = [...data.projectTokens, ...data.poolTokens];
  const empty =
    data.sol.ui === 0 &&
    (!data.usdc || data.usdc.uiAmount === 0) &&
    exiraTokens.length === 0;

  if (empty) {
    return (
      <Card className="gap-3 p-8 text-center">
        <div className="mx-auto grid size-10 place-items-center rounded-full border border-green/30 bg-green/5">
          <Wallet className="size-4 text-green" />
        </div>
        <p className="text-sm font-medium text-fg">No balances yet</p>
        <p className="text-xs text-fg-muted">
          Fund your wallet with devnet SOL + USDC to start investing.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">
            Wallet
          </p>
          <p className="mono-num mt-0.5 text-xs text-fg-muted">
            {owner.slice(0, 4)}…{owner.slice(-4)}
          </p>
        </div>
        <div className="grid size-9 place-items-center rounded-full border border-line/80 bg-bg-2/50">
          <Wallet className="size-4 text-fg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line/70 bg-bg-2/40 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">
            SOL
          </p>
          <p className="mono-num mt-1 text-2xl font-medium text-fg">
            {fmtSol(data.sol.ui)}
            <span className="ml-1 text-sm text-fg-muted">◎</span>
          </p>
        </div>
        <div className="rounded-xl border border-line/70 bg-bg-2/40 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">
            USDC
          </p>
          <p className="mono-num mt-1 text-2xl font-medium text-fg">
            {data.usdc ? fmtUsdcUi(data.usdc.uiAmount) : "0.00"}
            <span className="ml-1 text-sm text-fg-muted">USDC</span>
          </p>
        </div>
      </div>

      {exiraTokens.length > 0 ? (
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">
            Your Ascertainty tokens
          </p>
          <div className="mt-1 divide-y divide-line/60">
            {exiraTokens.map((t) => (
              <TokenRow key={t.mint} t={t} />
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
