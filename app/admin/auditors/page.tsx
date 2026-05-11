import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AddAuditorDialog,
  AuditorActiveToggle,
} from "@/components/admin/auditor-controls";
import { shortSig } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

async function loadAuditors() {
  try {
    return await db
      .select()
      .from(schema.auditors)
      .orderBy(desc(schema.auditors.registeredAt));
  } catch (err) {
    console.error("loadAuditors", err);
    return [];
  }
}

export default async function AdminAuditorsPage() {
  const auditors = await loadAuditors();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          accent="magenta"
          title="Auditors"
          description="Wallets authorised to submit baselines and verifications."
          className="mb-0"
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Auditors" },
          ]}
        />
        <AddAuditorDialog />
      </div>

      {auditors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-fg-muted">
            No auditors yet. Add one above.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-line/70 bg-bg-1/40 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>On-chain</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditors.map((a) => (
                  <TableRow key={a.walletPubkey}>
                    <TableCell className="mono-num text-xs">
                      {shortSig(a.walletPubkey, 6)}
                    </TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-fg-muted">
                      {a.certification}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          a.onchainRegistered
                            ? "border-green/40 bg-green/10 text-green text-[10px]"
                            : "border-fg-muted/30 text-fg-muted text-[10px]"
                        }
                      >
                        {a.onchainRegistered ? "registered" : "off-chain"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AuditorActiveToggle
                        walletPubkey={a.walletPubkey}
                        initial={a.isActive}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {auditors.map((a) => (
              <Card key={a.walletPubkey}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{a.name}</p>
                    <Badge
                      variant="outline"
                      className={
                        a.isActive
                          ? "border-green/40 bg-green/10 text-green"
                          : "border-fg-muted/30 text-fg-muted"
                      }
                    >
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mono-num text-xs text-fg-muted">
                    {shortSig(a.walletPubkey, 6)}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-fg-muted">{a.certification}</span>
                    <AuditorActiveToggle
                      walletPubkey={a.walletPubkey}
                      initial={a.isActive}
                    />
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
