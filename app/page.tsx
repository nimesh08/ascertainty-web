import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { LandingClient } from "./landing-client";

export const revalidate = 30;

async function loadStats() {
  try {
    const [projStats] = await db
      .select({
        bestApyBps: sql<number | null>`max(${schema.projects.expectedApyBps})::int`,
      })
      .from(schema.projects);

    return {
      bestApyPct:
        projStats?.bestApyBps != null ? projStats.bestApyBps / 100 : null,
    };
  } catch (err) {
    console.error("landing loadStats", err);
    return { bestApyPct: null };
  }
}

export default async function HomePage() {
  const stats = await loadStats();
  return <LandingClient stats={stats} />;
}
