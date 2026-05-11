import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { SweepForm } from "@/components/admin/sweep-form";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

async function loadPool(id: string) {
  try {
    const rows = await db
      .select()
      .from(schema.pools)
      .where(eq(schema.pools.id, id))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export default async function SweepPoolPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const pool = await loadPool(id);
  if (!pool) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title={`Sweep · ${pool.name}`}
        description="Admin deposits USDC into the pool vault, which pool token holders can then claim pro-rata."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Pools", href: "/admin/pools" },
          { label: pool.name, href: `/admin/pools/${pool.id}` },
          { label: "Sweep" },
        ]}
      />
      <SweepForm
        poolId={pool.id}
        poolName={pool.name}
        poolOnchainPda={pool.onchainPda}
        usdcVault={pool.usdcVault}
        tokensSoldRaw={pool.tokensSold}
        cumulativePerTokenRaw={pool.cumulativePerToken}
      />
    </div>
  );
}
