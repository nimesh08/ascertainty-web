import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import {
  MrvForms,
  type MrvProjectOption,
  type PendingVerification,
} from "@/components/admin/mrv-forms";

export const dynamic = "force-dynamic";

async function loadMrvProjects(): Promise<MrvProjectOption[]> {
  try {
    const rows = await db
      .select()
      .from(schema.mrvProjects)
      .orderBy(desc(schema.mrvProjects.createdAt));
    return rows.map((r) => ({
      id: r.id,
      onchainProjectId: r.onchainProjectId?.toString() ?? null,
      msmeName: r.msmeName,
      baselineSubmitted: r.baselineSubmitted,
      verificationCount: r.verificationCount,
    }));
  } catch {
    return [];
  }
}

async function loadPendingVerifications(): Promise<PendingVerification[]> {
  try {
    const mrvRows = await db.select().from(schema.mrvProjects);
    const out: PendingVerification[] = [];
    for (const m of mrvRows) {
      if (!m.onchainProjectId) continue;
      const vs = await db
        .select()
        .from(schema.mrvVerifications)
        .where(eq(schema.mrvVerifications.mrvProjectId, m.id))
        .orderBy(asc(schema.mrvVerifications.createdAt));
      vs.forEach((v, idx) => {
        if (!v.attested) {
          out.push({
            verificationId: v.id,
            mrvId: m.id,
            mrvLabel: m.msmeName,
            index: idx,
            onchainProjectId: m.onchainProjectId!.toString(),
          });
        }
      });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function AdminMrvPage() {
  const [mrvProjects, pending] = await Promise.all([
    loadMrvProjects(),
    loadPendingVerifications(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title="MRV"
        description="Measurement, reporting, and verification. Submit baselines, periodic verifications, and attest them as an auditor."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "MRV" }]}
      />
      <MrvForms mrvProjects={mrvProjects} pendingVerifications={pending} />
    </div>
  );
}
