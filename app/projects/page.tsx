import type { Metadata } from "next";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectsList } from "./projects-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects | Ascertainty",
  description:
    "Live and pipeline industrial-retrofit deals on Ascertainty. Each project ships with calibrated savings forecast, P5 floor, and full underwriting trail.",
};

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
      expectedApyBps: r.expectedApyBps ?? null,
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
