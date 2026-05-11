import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { LandingClient } from "./landing-client";

export const revalidate = 30;

async function loadStats() {
  try {
    const [projStats] = await db
      .select({
        totalFunded: sql<string>`coalesce(sum(${schema.projects.tokensSold}), 0)::text`,
        totalDistributed: sql<string>`coalesce(sum(${schema.projects.totalDistributed}), 0)::text`,
        active: sql<number>`count(*) filter (where ${schema.projects.status} in ('funding','active','repaying'))::int`,
        projectCount: sql<number>`count(*)::int`,
      })
      .from(schema.projects);

    const [poolStats] = await db
      .select({
        poolCount: sql<number>`count(*)::int`,
      })
      .from(schema.pools);

    return {
      totalFundedRaw: projStats?.totalFunded ?? "0",
      totalDistributedRaw: projStats?.totalDistributed ?? "0",
      activeProjects: projStats?.active ?? 0,
      projectCount: projStats?.projectCount ?? 0,
      poolCount: poolStats?.poolCount ?? 0,
    };
  } catch (err) {
    console.error("landing loadStats", err);
    return {
      totalFundedRaw: "0",
      totalDistributedRaw: "0",
      activeProjects: 0,
      projectCount: 0,
      poolCount: 0,
    };
  }
}

export default async function HomePage() {
  const stats = await loadStats();
  return <LandingClient stats={stats} />;
}
