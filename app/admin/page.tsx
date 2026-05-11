import Link from "next/link";
import { desc, sql, eq, ne, count } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { KpiTile } from "@/components/admin/kpi-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtUsdc, shortSig, explorerTx } from "@/lib/utils/format";
import { ExternalLink, Plus, Users, Layers, Send } from "lucide-react";

export const dynamic = "force-dynamic";

interface OverviewStats {
  projectCount: number;
  totalTarget: string;
  totalDistributed: string;
  livePools: number;
  pendingMrv: number;
  activeAuditors: number;
  recent: (typeof schema.transactions.$inferSelect)[];
}

async function loadStats(): Promise<OverviewStats> {
  try {
    const [
      projectCountRow,
      targetSumRow,
      distributedSumRow,
      poolDistributedSumRow,
      livePoolsRow,
      pendingMrvRow,
      activeAuditorsRow,
      recentTxs,
    ] = await Promise.all([
      db.select({ c: count() }).from(schema.projects),
      db
        .select({
          total: sql<string>`COALESCE(SUM(${schema.projects.targetUsdc}), 0)::text`,
        })
        .from(schema.projects),
      db
        .select({
          total: sql<string>`COALESCE(SUM(${schema.projects.totalDistributed}), 0)::text`,
        })
        .from(schema.projects),
      db
        .select({
          total: sql<string>`COALESCE(SUM(${schema.pools.totalDistributed}), 0)::text`,
        })
        .from(schema.pools),
      db
        .select({ c: count() })
        .from(schema.pools)
        .where(
          sql`${schema.pools.status} IN ('funding','active','distributing')`
        ),
      db
        .select({ c: count() })
        .from(schema.mrvProjects)
        .where(ne(schema.mrvProjects.status, "verified")),
      db
        .select({ c: count() })
        .from(schema.auditors)
        .where(eq(schema.auditors.isActive, true)),
      db
        .select()
        .from(schema.transactions)
        .orderBy(desc(schema.transactions.createdAt))
        .limit(20),
    ]);

    const projectDistributed = BigInt(distributedSumRow[0]?.total ?? "0");
    const poolDistributed = BigInt(poolDistributedSumRow[0]?.total ?? "0");

    return {
      projectCount: Number(projectCountRow[0]?.c ?? 0),
      totalTarget: targetSumRow[0]?.total ?? "0",
      totalDistributed: (projectDistributed + poolDistributed).toString(),
      livePools: Number(livePoolsRow[0]?.c ?? 0),
      pendingMrv: Number(pendingMrvRow[0]?.c ?? 0),
      activeAuditors: Number(activeAuditorsRow[0]?.c ?? 0),
      recent: recentTxs,
    };
  } catch (err) {
    console.error("loadStats", err);
    return {
      projectCount: 0,
      totalTarget: "0",
      totalDistributed: "0",
      livePools: 0,
      pendingMrv: 0,
      activeAuditors: 0,
      recent: [],
    };
  }
}

export default async function AdminOverviewPage() {
  const stats = await loadStats();

  return (
    <div className="space-y-8">
      <PageHeader
        accent="magenta"
        title="Admin overview"
        description="Platform health at a glance. Create projects, pool them, and keep investors paid."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile
          label="Projects"
          value={stats.projectCount.toString()}
          sub="Across all statuses"
          accent="magenta"
        />
        <KpiTile
          label="Target raise"
          value={fmtUsdc(stats.totalTarget)}
          sub="Sum on-chain target USDC"
          accent="green"
        />
        <KpiTile
          label="Distributed"
          value={fmtUsdc(stats.totalDistributed)}
          sub="Lifetime repayments"
          accent="cyan"
        />
        <KpiTile
          label="Live pools"
          value={stats.livePools.toString()}
          sub="Funding / active / distributing"
          accent="violet"
        />
        <KpiTile
          label="Pending MRV"
          value={stats.pendingMrv.toString()}
          sub="Not yet verified"
          accent="magenta"
        />
        <KpiTile
          label="Auditors"
          value={stats.activeAuditors.toString()}
          sub="Active on registry"
          accent="green"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Badge
              variant="outline"
              className="border-magenta/40 bg-magenta/10 text-magenta text-[10px]"
            >
              on-chain
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-fg-muted">
                No transactions indexed yet.
              </p>
            ) : (
              <ul className="divide-y divide-line/60">
                {stats.recent.map((tx) => (
                  <li
                    key={tx.txSig}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm text-fg">
                        <span className="capitalize">
                          {tx.txType.replace(/_/g, " ")}
                        </span>
                        {tx.amountUsdc ? (
                          <span className="text-fg-muted">
                            {" "}
                            · {fmtUsdc(tx.amountUsdc)}
                          </span>
                        ) : null}
                      </p>
                      <p className="mono-num text-xs text-fg-muted">
                        {shortSig(tx.txSig)}
                      </p>
                    </div>
                    <a
                      href={explorerTx(tx.txSig)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-magenta hover:underline"
                    >
                      Explorer <ExternalLink className="size-3" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start gap-2">
              <Link href="/admin/projects/new">
                <Plus className="size-4" /> Add project
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Link href="/admin/pools/new">
                <Layers className="size-4" /> Create pool
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Link href="/admin/projects">
                <Send className="size-4" /> Disperse repayments
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Link href="/admin/auditors">
                <Users className="size-4" /> Add auditor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
