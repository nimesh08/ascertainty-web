import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectsList } from "./projects-list";

export const dynamic = "force-dynamic";

async function loadProjects() {
  try {
    const rows = await db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.createdAt))
      .limit(200);
    return rows.map((r) => ({
      id: r.id,
      msmeName: r.msmeName,
      sector: r.sector,
      location: r.location,
      upgradeType: r.upgradeType,
      status: r.status,
      targetUsdc: r.targetUsdc,
      tokensSold: r.tokensSold,
      termMonths: r.termMonths,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("/projects loadProjects", err);
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await loadProjects();
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker="Projects"
        title="Underlying facilities, every meter on-chain."
        description="Back specific MSME upgrades. Each project mints a share-of-savings token that accrues USDC distributions as savings are realized on-chain."
      />
      <ProjectsList projects={projects} />
    </Container>
  );
}
