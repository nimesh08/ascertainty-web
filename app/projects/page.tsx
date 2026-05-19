import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { desc, sql } from "drizzle-orm";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { resolveHeroImage } from "@/lib/projects/hero-image";
import { ProjectsList } from "./projects-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects | Ascertainty",
  description:
    "Live and pipeline industrial-retrofit deals on Ascertainty. Each project ships with calibrated savings forecast, P5 floor, and full underwriting trail.",
};

async function loadProjects() {
  try {
    // One round-trip: project rows + count of underwriting_results per project.
    // ecm_count powers the "N ECMs" badge on the list card.
    const rows = await db
      .select({
        p: schema.projects,
        ecmCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${schema.underwritingResults} u
          WHERE u.project_id = ${schema.projects.id}
        )`,
      })
      .from(schema.projects)
      .orderBy(desc(schema.projects.createdAt))
      .limit(200);
    return rows.map(({ p: r, ecmCount }) => ({
      id: r.id,
      msmeName: r.msmeName,
      sector: r.sector,
      location: r.location,
      upgradeType: r.upgradeType,
      status: r.status,
      targetUsdc: r.targetUsdc,
      tokensSold: r.tokensSold,
      termMonths: r.termMonths,
      expectedApyBps: r.expectedApyBps ?? null,
      ecmCount: ecmCount ?? 0,
      heroImageUrl: resolveHeroImage(r.msmeName) ?? null,
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
        noBorder
      />
      <ProjectsList projects={projects} />
    </Container>
  );
}
