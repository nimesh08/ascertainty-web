import Link from "next/link";
import { desc } from "drizzle-orm";
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

async function loadPools() {
  try {
    return await db
      .select()
      .from(schema.pools)
      .orderBy(desc(schema.pools.createdAt));
  } catch (err) {
    console.error("loadPools", err);
    return [];
  }
}

export default async function AdminPoolsPage() {
  const pools = await loadPools();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          accent="magenta"
          title="Pools"
          description="Bundle projects to diversify investor exposure."
          className="mb-0"
        />
        <Button asChild size="sm" className="gap-1">
          <Link href="/admin/pools/new">
            <Plus className="size-4" /> New pool
          </Link>
        </Button>
      </div>

      {pools.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-fg-muted">
            No pools yet.{" "}
            <Link href="/admin/pools/new" className="text-magenta hover:underline">
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
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">—</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pools.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="mono-num text-xs text-fg-muted">
                      {p.onchainPoolId?.toString() ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
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
                        <Link href={`/admin/pools/${p.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {pools.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{p.name}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mono-num flex items-baseline justify-between text-sm">
                    <span className="text-fg">{fmtUsdc(p.tokensSold)}</span>
                    <span className="text-fg-muted">
                      / {fmtUsdc(p.targetUsdc)}
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/admin/pools/${p.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
