"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";

import { BuyModal } from "@/components/investor/buy-modal";
import { ClaimModal } from "@/components/investor/claim-modal";
import { useInvestor } from "@/lib/hooks/use-investor";
import {
  claimableFromPosition,
  fetchPosition,
  type PositionData,
} from "@/lib/solana/reads";

import {
  AboutSection,
  HighlightsSection,
  ManagementSection,
} from "@/app/projects/[id]/sections-part-1";
import {
  FinancialsSection,
  ReturnsCalculatorSection,
  TrustScoreSection,
  DocumentsSection,
  RepaymentHistorySection,
} from "@/app/projects/[id]/sections-part-2";
import { PoolHeroCard, UnderlyingProjectsSection } from "./pool-sections";
import { PoolSidebar } from "./pool-sidebar";

interface PoolData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  totalDistributed: string;
  cumulativePerToken: string;
  onchainPda: string | null;
  poolTokenMint: string | null;
  usdcVault: string | null;
  aboutPool: string | null;
  highlights:
    | Array<{ title: string; detail: string; icon?: string }>
    | null;
  managementText: string | null;
  financialsText: string | null;
  documents: Array<{ name: string; url: string }> | null;
  trustScore: number | null;
  expectedApyBps: number | null;
}

interface Underlying {
  projectId: string;
  msmeName: string;
  sector: string;
  location: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
}

interface DistributionData {
  signature: string;
  amountUsdc: string | null;
  blockTime: string | null;
  createdAt: string;
}

export function PoolDetailClient({
  pool,
  underlying,
  distributions,
}: {
  pool: PoolData;
  underlying: Underlying[];
  distributions: DistributionData[];
}) {
  const { connected, connection, publicKey, login } = useInvestor();
  const [position, setPosition] = useState<PositionData | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const target = useMemo(
    () => BigInt(pool.targetUsdc || "0"),
    [pool.targetUsdc]
  );
  const sold = useMemo(
    () => BigInt(pool.tokensSold || "0"),
    [pool.tokensSold]
  );
  const remaining = target > sold ? target - sold : 0n;

  const pct = useMemo(() => {
    if (target === 0n) return 0;
    return Math.min(100, Number((sold * 10_000n) / target) / 100);
  }, [target, sold]);

  const apyPct = useMemo(() => {
    if (pool.expectedApyBps == null) return 0;
    return pool.expectedApyBps / 100;
  }, [pool.expectedApyBps]);

  const claimable = useMemo(() => {
    if (!position) return 0n;
    return claimableFromPosition({
      tokensHeld: position.tokensHeld,
      lastClaimedPerToken: position.lastClaimedPerToken,
      cumulativePerToken: BigInt(pool.cumulativePerToken),
    });
  }, [position, pool.cumulativePerToken]);

  useEffect(() => {
    if (!connected || !publicKey || !pool.onchainPda) {
      setPosition(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchPosition(
          connection,
          new PublicKey(pool.onchainPda!),
          publicKey
        );
        if (!cancelled) setPosition(p);
      } catch (err) {
        console.warn("pool position fetch", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, pool.onchainPda, connection, reloadKey]);

  const canInvest = !!(pool.onchainPda && pool.poolTokenMint && pool.usdcVault);

  // For the pool term we don't currently have a field — fall back to the
  // longest underlying project term, or 24 months if unknown.
  const termMonths = 24;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <PoolHeroCard pool={pool} />

        <AboutSection text={pool.aboutPool} />

        <HighlightsSection highlights={pool.highlights ?? []} />

        <UnderlyingProjectsSection underlying={underlying} />

        <ManagementSection text={pool.managementText} />

        <FinancialsSection
          project={{
            targetUsdc: pool.targetUsdc,
            termMonths,
            status: pool.status,
            financialsText: pool.financialsText,
          }}
          apyPct={apyPct}
        />

        <ReturnsCalculatorSection
          remainingRaw={remaining}
          targetRaw={target}
          apyPct={apyPct}
          termMonths={termMonths}
        />

        <TrustScoreSection score={pool.trustScore} />

        <DocumentsSection documents={pool.documents ?? []} />

        <RepaymentHistorySection distributions={distributions} />
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PoolSidebar
          pool={pool}
          apyPct={apyPct}
          pct={pct}
          connected={connected}
          login={login}
          position={position}
          claimable={claimable}
          canInvest={canInvest}
          onInvest={() => setBuyOpen(true)}
          onClaim={() => setClaimOpen(true)}
          projectCount={underlying.length}
        />
      </aside>

      {canInvest ? (
        <BuyModal
          open={buyOpen}
          onOpenChange={setBuyOpen}
          target={{
            kind: "pool",
            id: pool.id,
            name: pool.name,
            pda: pool.onchainPda!,
            poolTokenMint: pool.poolTokenMint!,
            usdcVault: pool.usdcVault!,
          }}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {canInvest ? (
        <ClaimModal
          open={claimOpen}
          onOpenChange={setClaimOpen}
          target={{
            kind: "pool",
            id: pool.id,
            name: pool.name,
            pda: pool.onchainPda!,
            usdcVault: pool.usdcVault!,
          }}
          claimableRaw={claimable.toString()}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      ) : null}
    </div>
  );
}
