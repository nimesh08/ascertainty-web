import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { getPool } from "@/lib/db/queries/pools";
import { db, schema } from "@/lib/db";
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

  const distributions = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.poolId, pool.id))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(200);

  return (
    <Container className="py-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/pools"
          className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" /> Pools
        </Link>
      </div>

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
          aboutPool: pool.aboutPool,
          highlights: pool.highlights,
          managementText: pool.managementText,
          financialsText: pool.financialsText,
          documents: pool.documents,
          trustScore: pool.trustScore,
          expectedApyBps: pool.expectedApyBps,
        }}
        underlying={pool.underlying.map((u) => ({
          projectId: u.projectId,
          msmeName: u.msmeName,
          sector: u.sector,
          location: u.location,
          status: u.status,
          targetUsdc: u.targetUsdc,
          tokensSold: u.tokensSold,
        }))}
        distributions={distributions
          .filter((t) => t.txType === "distribute_pool")
          .map((t) => ({
            signature: t.txSig,
            amountUsdc: t.amountUsdc,
            blockTime: t.blockTime ? t.blockTime.toISOString() : null,
            createdAt: t.createdAt.toISOString(),
          }))}
      />
    </Container>
  );
}
