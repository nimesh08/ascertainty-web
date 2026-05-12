import Link from "next/link";
import { desc, and, eq, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";
import { fmtUsdc } from "@/lib/utils/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  sector?: string;
}

async function loadProjects(filters: SearchParams) {
  try {
    const conds = [];
    if (filters.status) {
      conds.push(
        eq(
          schema.projects.status,
          filters.status as
            | "pending"
            | "funding"
            | "active"
            | "repaying"
            | "completed"
            | "cancelled"
        )
      );
    }
    if (filters.sector) {
      conds.push(eq(schema.projects.sector, filters.sector));
    }
    const query = db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.createdAt));
    const rows =
      conds.length > 0 ? await query.where(and(...conds)) : await query;
    return rows;
  } catch (err) {
    console.error("loadProjects", err);
    return [];
  }
}

async function loadSectors() {
  try {
    const rows = await db
      .selectDistinct({ sector: schema.projects.sector })
      .from(schema.projects);
    return rows.map((r) => r.sector).filter(Boolean);
  } catch {
    return [];
  }
}

const STATUSES = [
  "all",
  "pending",
  "funding",
  "active",
  "repaying",
  "completed",
  "cancelled",
] as const;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const [projects, sectors] = await Promise.all([
    loadProjects(filters),
    loadSectors(),
  ]);

  const activeStatus = filters.status ?? "all";
  const activeSector = filters.sector ?? "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          accent="magenta"
          title="Projects"
          description="Register MRV projects and open them for funding."
          className="mb-0"
        />
        <Button asChild size="sm" className="gap-1">
          <Link href="/admin/projects/new">
            <Plus className="size-4" /> New project
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-fg-muted">Status:</span>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={{
                pathname: "/admin/projects",
                query: {
                  ...(s !== "all" ? { status: s } : {}),
                  ...(activeSector !== "all" ? { sector: activeSector } : {}),
                },
              }}
              className={
                (s === activeStatus
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-line/70 text-fg-muted hover:text-fg") +
                " rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors"
              }
            >
              {s}
            </Link>
          ))}
        </div>
        {sectors.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-fg-muted">Sector:</span>
            <Link
              href={{
                pathname: "/admin/projects",
                query: {
                  ...(activeStatus !== "all" ? { status: activeStatus } : {}),
                },
              }}
              className={
                (activeSector === "all"
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-line/70 text-fg-muted hover:text-fg") +
                " rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors"
              }
            >
              all
            </Link>
            {sectors.map((sec) => (
              <Link
                key={sec}
                href={{
                  pathname: "/admin/projects",
                  query: {
                    ...(activeStatus !== "all" ? { status: activeStatus } : {}),
                    sector: sec,
                  },
                }}
                className={
                  (activeSector === sec
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-line/70 text-fg-muted hover:text-fg") +
                  " rounded-full border px-2.5 py-1 text-[11px] capitalize transition-colors"
                }
              >
                {sec}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-fg-muted">
            No projects match these filters yet.{" "}
            <Link
              href="/admin/projects/new"
              className="text-accent hover:underline"
            >
              Create one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-line/70 bg-bg-1/40 md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-line/70 hover:bg-transparent">
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>MSME</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">—</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} className="border-line/50">
                    <TableCell className="mono-num text-xs text-fg-muted">
                      {p.onchainProjectId?.toString() ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{p.msmeName}</TableCell>
                    <TableCell className="capitalize text-fg-muted">
                      {p.sector}
                    </TableCell>
                    <TableCell className="mono-num text-right">
                      {fmtUsdc(p.tokensSold)}
                    </TableCell>
                    <TableCell className="mono-num text-right text-fg-muted">
                      {fmtUsdc(p.targetUsdc)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/projects/${p.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {projects.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{p.msmeName}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-fg-muted">
                    <span className="mono-num">
                      #{p.onchainProjectId?.toString() ?? "—"}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{p.sector}</span>
                  </div>
                  <div className="mono-num flex items-baseline justify-between text-sm">
                    <span className="text-fg">{fmtUsdc(p.tokensSold)}</span>
                    <span className="text-fg-muted">
                      / {fmtUsdc(p.targetUsdc)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Link href={`/admin/projects/${p.id}`}>Open</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Silence unused import lint.
void or;
