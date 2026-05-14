"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana";
import { useQuery } from "@tanstack/react-query";

import type { WalletBalances } from "@/lib/solana/balances";
import { fmtNumber } from "@/lib/utils/format";

async function fetchBalances(owner: string): Promise<WalletBalances> {
  const res = await fetch(
    `/api/wallet/balances?owner=${encodeURIComponent(owner)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`balances ${res.status}`);
  return (await res.json()) as WalletBalances;
}

export function WalletBalancesPill() {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useSolanaWallets();
  const owner = wallets?.[0]?.address ?? null;

  const { data } = useQuery<WalletBalances>({
    queryKey: ["wallet-balances", owner],
    queryFn: () => fetchBalances(owner!),
    enabled: !!owner && ready && authenticated,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  if (!ready || !authenticated || !owner) return null;

  const sol = data?.sol.ui ?? 0;
  const usdc = data?.usdc?.uiAmount ?? 0;

  return (
    <Link
      href="/portfolio"
      aria-label="Open portfolio"
      className="mono-num hidden h-[34px] items-center gap-2 rounded-full border border-line bg-bg-1 px-4 text-[10.5px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:border-line-strong hover:text-fg md:inline-flex"
    >
      <span>
        <span className="text-fg-muted">◎</span> {fmtNumber(sol, 3)}
      </span>
      <span className="text-fg-muted/60">·</span>
      <span>
        {fmtNumber(usdc, 2)} <span className="text-fg-muted">USDC</span>
      </span>
    </Link>
  );
}
