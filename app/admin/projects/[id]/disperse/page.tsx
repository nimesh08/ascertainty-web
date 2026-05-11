import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { PageHeader } from "@/components/layout/page-header";
import { DisperseForm } from "@/components/admin/disperse-form";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

async function loadProjectForDisperse(id: string) {
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

async function loadHolderCount(projectId: string): Promise<number> {
  try {
    const row = await db
      .select({
        count: sql<number>`count(DISTINCT ${schema.transactions.walletPubkey})::int`,
      })
      .from(schema.transactions)
      .where(
        sql`${schema.transactions.projectId} = ${projectId} AND ${schema.transactions.txType} = 'buy_project'`
      );
    return Number(row[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

export default async function DispersePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const project = await loadProjectForDisperse(id);
  if (!project) notFound();
  const holders = await loadHolderCount(project.id);

  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title={`Disperse · ${project.msmeName}`}
        description="Send a USDC repayment from your wallet into the project vault. Investors will then be able to claim their pro-rata share."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          {
            label: project.msmeName,
            href: `/admin/projects/${project.id}`,
          },
          { label: "Disperse" },
        ]}
      />
      <DisperseForm
        projectId={project.id}
        msmeName={project.msmeName}
        onchainPda={project.onchainPda}
        usdcVault={project.usdcVault}
        tokensSoldRaw={project.tokensSold}
        cumulativePerTokenRaw={project.cumulativePerToken}
        eligibleHolders={holders}
      />
    </div>
  );
}
