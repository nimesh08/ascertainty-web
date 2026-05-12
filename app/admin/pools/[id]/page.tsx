import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, notInArray, inArray } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  AddProjectToPoolPicker,
  type ProjectOption,
} from "@/components/admin/add-project-to-pool";
import { AdminEditContentPanel } from "@/components/admin/admin-edit-content-panel";
import {
  fmtUsdc,
  shortSig,
  explorerAccount,
} from "@/lib/utils/format";
import { Send } from "lucide-react";

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

async function loadLinkedProjects(poolId: string) {
  try {
    const links = await db
      .select()
      .from(schema.poolProjects)
      .where(eq(schema.poolProjects.poolId, poolId));
    if (links.length === 0) return [];
    const ids = links.map((l) => l.projectId);
    const projects = await db
      .select()
      .from(schema.projects)
      .where(inArray(schema.projects.id, ids));
    return projects;
  } catch {
    return [];
  }
}

async function loadCandidateProjects(poolId: string): Promise<ProjectOption[]> {
  try {
    const links = await db
      .select()
      .from(schema.poolProjects)
      .where(eq(schema.poolProjects.poolId, poolId));
    const linkedIds = links.map((l) => l.projectId);
    const rows = await db
      .select({
        id: schema.projects.id,
        msmeName: schema.projects.msmeName,
        sector: schema.projects.sector,
        onchainPda: schema.projects.onchainPda,
        status: schema.projects.status,
        targetUsdc: schema.projects.targetUsdc,
      })
      .from(schema.projects)
      .where(
        linkedIds.length > 0
          ? notInArray(schema.projects.id, linkedIds)
          : undefined
      );
    return rows;
  } catch {
    return [];
  }
}

export default async function AdminPoolDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const pool = await loadPool(id);
  if (!pool) notFound();

  const [underlying, candidates] = await Promise.all([
    loadLinkedProjects(pool.id),
    loadCandidateProjects(pool.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title={pool.name}
        description={pool.description ?? undefined}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Pools", href: "/admin/pools" },
          { label: `#${pool.onchainPoolId ?? ""}` },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={pool.status} />
          <span className="mono-num text-xs text-fg-muted">
            {fmtUsdc(pool.tokensSold)} / {fmtUsdc(pool.targetUsdc)}
          </span>
        </div>
        <div className="flex gap-2">
          <AddProjectToPoolPicker
            poolId={pool.id}
            poolOnchainPda={pool.onchainPda}
            projects={candidates}
          />
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/admin/pools/${pool.id}/sweep`}>
              <Send className="size-4" /> Sweep
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-fg-muted">Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mono-num text-2xl font-semibold">
              {fmtUsdc(pool.tokensSold)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-fg-muted">Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mono-num text-2xl font-semibold">
              {fmtUsdc(pool.totalDistributed)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-fg-muted">On-chain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {pool.onchainPda ? (
              <Link
                href={explorerAccount(pool.onchainPda)}
                target="_blank"
                className="mono-num block text-fg hover:text-accent"
              >
                PDA {shortSig(pool.onchainPda, 6)} ↗
              </Link>
            ) : null}
            {pool.poolTokenMint ? (
              <Link
                href={explorerAccount(pool.poolTokenMint)}
                target="_blank"
                className="mono-num block text-fg-muted hover:text-accent"
              >
                Mint {shortSig(pool.poolTokenMint, 6)} ↗
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Underlying projects</CardTitle>
        </CardHeader>
        <CardContent>
          {underlying.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No projects linked yet. Add one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-line/50">
              {underlying.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.msmeName}</p>
                    <p className="text-xs text-fg-muted capitalize">
                      {p.sector} · {p.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="mono-num text-fg-muted">
                      {fmtUsdc(p.tokensSold)} / {fmtUsdc(p.targetUsdc)}
                    </span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/projects/${p.id}`}>Open</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AdminEditContentPanel
        scope="pool"
        id={pool.id}
        initial={{
          description: pool.description,
          aboutPool: pool.aboutPool,
          managementText: pool.managementText,
          financialsText: pool.financialsText,
          expectedApyBps: pool.expectedApyBps,
          trustScore: pool.trustScore,
          highlights: pool.highlights,
          documents: pool.documents,
        }}
      />
    </div>
  );
}
