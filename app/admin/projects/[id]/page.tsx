import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminProjectActions } from "@/components/admin/project-actions";
import { AdminEditContentPanel } from "@/components/admin/admin-edit-content-panel";
import {
  fmtUsdc,
  shortSig,
  explorerAccount,
  explorerTx,
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

async function loadProject(id: string) {
  try {
    const rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function loadBaseline(mrvProjectId: string | null) {
  if (!mrvProjectId) return null;
  try {
    const rows = await db
      .select()
      .from(schema.mrvBaselines)
      .where(eq(schema.mrvBaselines.mrvProjectId, mrvProjectId))
      .orderBy(desc(schema.mrvBaselines.createdAt))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function loadVerifications(mrvProjectId: string | null) {
  if (!mrvProjectId) return [];
  try {
    return await db
      .select()
      .from(schema.mrvVerifications)
      .where(eq(schema.mrvVerifications.mrvProjectId, mrvProjectId))
      .orderBy(desc(schema.mrvVerifications.createdAt));
  } catch {
    return [];
  }
}

async function loadTransactions(projectId: string) {
  try {
    return await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.projectId, projectId))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(20);
  } catch {
    return [];
  }
}

async function loadPositions(projectId: string) {
  try {
    return await db
      .select()
      .from(schema.investorPositions)
      .where(eq(schema.investorPositions.projectId, projectId))
      .orderBy(desc(schema.investorPositions.tokenAmount))
      .limit(25);
  } catch {
    return [];
  }
}

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) notFound();

  const [baseline, verifications, txs, positions] = await Promise.all([
    loadBaseline(project.mrvProjectId),
    loadVerifications(project.mrvProjectId),
    loadTransactions(project.id),
    loadPositions(project.id),
  ]);

  const target = BigInt(project.targetUsdc);
  const sold = BigInt(project.tokensSold);
  const raisedPct =
    target > 0n ? Number((sold * 10_000n) / target) / 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title={project.msmeName}
        description={`${project.upgradeType} · ${project.location}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          { label: `#${project.onchainProjectId?.toString() ?? ""}` },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="text-xs text-fg-muted">
            Term {project.termMonths}m · Sector{" "}
            <span className="capitalize">{project.sector}</span>
          </span>
        </div>
        <AdminProjectActions
          projectId={project.id}
          status={project.status}
          onchainProjectPda={project.onchainPda}
          tokenMint={project.tokenMint}
          usdcVault={project.usdcVault}
          tokensSoldRaw={project.tokensSold}
          targetUsdcRaw={project.targetUsdc}
          totalDistributedRaw={project.totalDistributed}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-fg-muted">Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mono-num text-2xl font-semibold">
              {fmtUsdc(project.tokensSold)}
            </p>
            <p className="text-xs text-fg-muted">
              of {fmtUsdc(project.targetUsdc)} · {raisedPct.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-fg-muted">
              Distributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mono-num text-2xl font-semibold">
              {fmtUsdc(project.totalDistributed)}
            </p>
            <p className="text-xs text-fg-muted">Lifetime repayments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-fg-muted">On-chain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {project.onchainPda ? (
              <Link
                href={explorerAccount(project.onchainPda)}
                target="_blank"
                className="mono-num block text-fg hover:text-accent"
              >
                PDA {shortSig(project.onchainPda, 6)} ↗
              </Link>
            ) : null}
            {project.tokenMint ? (
              <Link
                href={explorerAccount(project.tokenMint)}
                target="_blank"
                className="mono-num block text-fg-muted hover:text-accent"
              >
                Token {shortSig(project.tokenMint, 6)} ↗
              </Link>
            ) : null}
            {project.usdcVault ? (
              <Link
                href={explorerAccount(project.usdcVault)}
                target="_blank"
                className="mono-num block text-fg-muted hover:text-accent"
              >
                Vault {shortSig(project.usdcVault, 6)} ↗
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRV baseline</CardTitle>
          </CardHeader>
          <CardContent>
            {baseline ? (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <dt className="text-fg-muted">Fuel</dt>
                <dd className="capitalize text-fg">{baseline.fuelType}</dd>
                <dt className="text-fg-muted">Energy</dt>
                <dd className="mono-num text-fg">
                  {baseline.energyKwhPerYear.toString()} kWh/yr
                </dd>
                <dt className="text-fg-muted">Auditor</dt>
                <dd className="mono-num text-xs text-fg">
                  {shortSig(baseline.auditorWallet, 6)}
                </dd>
                {baseline.reportHash ? (
                  <>
                    <dt className="text-fg-muted">Report</dt>
                    <dd className="mono-num break-all text-[10px] text-fg-muted">
                      {baseline.reportHash.slice(0, 16)}…
                    </dd>
                  </>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-fg-muted">
                No baseline submitted yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <p className="text-sm text-fg-muted">None submitted yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {verifications.map((v, i) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 border-b border-line/50 pb-2 last:border-0"
                  >
                    <span>
                      <span className="mono-num text-fg-muted">
                        #{verifications.length - 1 - i}
                      </span>{" "}
                      <span className="text-fg">
                        {v.periodStart.toISOString().slice(0, 10)} →{" "}
                        {v.periodEnd.toISOString().slice(0, 10)}
                      </span>
                    </span>
                    <StatusBadge
                      status={v.attested ? "active" : "pending"}
                      className="text-[10px]"
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <AdminEditContentPanel
        scope="project"
        id={project.id}
        initial={{
          description: project.description,
          aboutProject: project.aboutProject,
          managementText: project.managementText,
          financialsText: project.financialsText,
          expectedApyBps: project.expectedApyBps,
          trustScore: project.trustScore,
          highlights: project.highlights,
          documents: project.documents,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top investor positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <p className="text-sm text-fg-muted">
              No investor positions recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-line/50">
              {positions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="mono-num text-xs text-fg-muted">
                    {shortSig(p.walletPubkey, 6)}
                  </span>
                  <span className="mono-num">
                    {fmtUsdc(p.tokenAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-sm text-fg-muted">
              No on-chain activity recorded yet.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Signer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Signature</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txs.map((tx) => (
                      <TableRow key={tx.txSig}>
                        <TableCell className="capitalize">
                          {tx.txType.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="mono-num text-xs text-fg-muted">
                          {shortSig(tx.walletPubkey ?? "", 5)}
                        </TableCell>
                        <TableCell className="mono-num text-right">
                          {tx.amountUsdc ? fmtUsdc(tx.amountUsdc) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={explorerTx(tx.txSig)}
                            target="_blank"
                            className="mono-num text-xs text-accent hover:underline"
                          >
                            {shortSig(tx.txSig, 6)} ↗
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y divide-line/50 md:hidden">
                {txs.map((tx) => (
                  <li
                    key={tx.txSig}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="text-sm capitalize">
                        {tx.txType.replace(/_/g, " ")}
                      </p>
                      <p className="mono-num text-xs text-fg-muted">
                        {shortSig(tx.txSig, 5)}
                      </p>
                    </div>
                    <span className="mono-num text-xs">
                      {tx.amountUsdc ? fmtUsdc(tx.amountUsdc) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
