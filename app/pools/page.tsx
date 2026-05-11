import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { PoolsList } from "./pools-list";

export const dynamic = "force-dynamic";

async function loadPools() {
  try {
    const rows = await db
      .select({
        id: schema.pools.id,
        name: schema.pools.name,
        description: schema.pools.description,
        status: schema.pools.status,
        targetUsdc: schema.pools.targetUsdc,
        tokensSold: schema.pools.tokensSold,
        createdAt: schema.pools.createdAt,
        projectCount: sql<number>`(select count(*) from pool_projects where pool_projects.pool_id = ${schema.pools.id})::int`,
      })
      .from(schema.pools)
      .orderBy(desc(schema.pools.createdAt))
      .limit(200);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      targetUsdc: r.targetUsdc,
      tokensSold: r.tokensSold,
      projectCount: r.projectCount ?? 0,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("/pools loadPools", err);
    return [];
  }
}

export default async function PoolsPage() {
  const pools = await loadPools();
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Pools"
        description="Diversify across a curated basket of MSME projects. One deposit, one claim, blended exposure."
        accent="violet"
      />
      <PoolsList pools={pools} />
    </Container>
  );
}

// keep eq import for TS
void eq;
