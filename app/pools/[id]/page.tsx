import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/investor/status-badge";
import { getPool } from "@/lib/db/queries/pools";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { PoolDetailClient } from "./pool-detail-client";

export const revalidate = 30;

export default async function PoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pool = await getPool(id);
  if (!pool) notFound();

  const txs = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.poolId, pool.id))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(200);

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <Link
          href="/pools"
          className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" /> Pools
        </Link>
        <StatusBadge status={pool.status} />
      </div>

      <header className="mt-6 space-y-3">
        <h1 className="font-serif text-4xl italic leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-br from-violet via-cyan to-green bg-clip-text text-transparent">
            {pool.name}
          </span>
        </h1>
        {pool.description ? (
          <p className="max-w-2xl text-sm text-fg-muted sm:text-base">
            {pool.description}
          </p>
        ) : null}
      </header>

      <PoolDetailClient
        pool={{
          id: pool.id,
          name: pool.name,
          description: pool.description,
          status: pool.status,
          targetUsdc: pool.targetUsdc,
          tokensSold: pool.tokensSold,
          totalDistributed: pool.totalDistributed,
          cumulativePerToken: pool.cumulativePerToken,
          onchainPda: pool.onchainPda,
          poolTokenMint: pool.poolTokenMint,
          usdcVault: pool.usdcVault,
        }}
        underlying={pool.underlying.map((u) => ({
          projectId: u.projectId,
          projectTokensHeld: "0",
          msmeName: u.msmeName,
          sector: u.sector,
          location: u.location,
          status: u.status,
          targetUsdc: u.targetUsdc,
          tokensSold: u.tokensSold,
        }))}
        txs={txs.map((t) => ({
          signature: t.txSig,
          txType: t.txType,
          amountUsdc: t.amountUsdc,
          walletPubkey: t.walletPubkey,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </Container>
  );
}
