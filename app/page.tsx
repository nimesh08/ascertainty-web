import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
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
        bestApyBps: sql<number | null>`max(${schema.projects.expectedApyBps})::int`,
      })
      .from(schema.projects);

    const [poolStats] = await db
      .select({
        poolCount: sql<number>`count(*)::int`,
      })
      .from(schema.pools);

    // Pick the deal that backs the landing-page worked-example section. HVAC
    // Hotel is the v0.3 seed used in the §02.5 narrative — UUID is dynamic per
    // environment so we look it up by stable msme_name.
    const [featured] = await db
      .select({ id: schema.projects.id })
      .from(schema.projects)
      .where(eq(schema.projects.msmeName, "HVAC Optimization for Hotel"))
      .limit(1);

    return {
      totalFundedRaw: projStats?.totalFunded ?? "0",
      totalDistributedRaw: projStats?.totalDistributed ?? "0",
      activeProjects: projStats?.active ?? 0,
      projectCount: projStats?.projectCount ?? 0,
      poolCount: poolStats?.poolCount ?? 0,
      bestApyPct:
        projStats?.bestApyBps != null ? projStats.bestApyBps / 100 : null,
      featuredProjectId: featured?.id ?? null,
    };
  } catch (err) {
    console.error("landing loadStats", err);
    return {
      totalFundedRaw: "0",
      totalDistributedRaw: "0",
      activeProjects: 0,
      projectCount: 0,
      poolCount: 0,
      bestApyPct: null,
      featuredProjectId: null,
    };
  }
}

export default async function HomePage() {
  const stats = await loadStats();
  return <LandingClient stats={stats} />;
}
