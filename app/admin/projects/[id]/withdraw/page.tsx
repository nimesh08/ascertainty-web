import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import { PageHeader } from "@/components/layout/page-header";
import { WithdrawForm } from "./withdraw-form";

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

export default async function WithdrawPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const { id } = await params;
  const project = await loadProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title={`Withdraw · ${project.msmeName}`}
        description="Move USDC out of this project's on-chain vault to any destination wallet. This is a privileged admin operation — use for off-ramp disbursements to the MSME or operational transfers. No state change beyond the vault balance; an audit row is recorded in transactions."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          {
            label: project.msmeName,
            href: `/admin/projects/${project.id}`,
          },
          { label: "Withdraw" },
        ]}
      />
      <WithdrawForm
        projectId={project.id}
        msmeName={project.msmeName}
        onchainProjectId={project.onchainProjectId ?? null}
        onchainPda={project.onchainPda}
        usdcVault={project.usdcVault}
        status={project.status}
      />
    </div>
  );
}
