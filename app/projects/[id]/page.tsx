import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { getProjectWithDetails } from "@/lib/db/queries/projects";
import { resolveHeroImage } from "@/lib/projects/hero-image";
import { db, schema } from "@/lib/db";
import { ProjectDetailClient } from "./project-detail-client";

export const revalidate = 30;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProjectWithDetails(id);
  if (!detail) notFound();

  // Pull distribution-type transactions separately so we can render the
  // Repayment History section with all of them (not just the last 10).
  const distributionRows = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.projectId, detail.id))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(100);

  // Auditor meta (name + cert) — small table, safe to fetch all.
  const auditorRows = await db.select().from(schema.auditors);
  const auditorMap = new Map(
    auditorRows.map((a) => [
      a.walletPubkey,
      { name: a.name, certification: a.certification },
    ])
  );

  return (
    <Container className="py-6 sm:py-10">
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" /> Projects
        </Link>
      </div>

      <ProjectDetailClient
        project={{
          id: detail.id,
          msmeName: detail.msmeName,
          sector: detail.sector,
          location: detail.location,
          upgradeType: detail.upgradeType,
          status: detail.status,
          targetUsdc: detail.targetUsdc,
          tokensSold: detail.tokensSold,
          totalDistributed: detail.totalDistributed,
          cumulativePerToken: detail.cumulativePerToken,
          termMonths: detail.termMonths,
          onchainPda: detail.onchainPda,
          tokenMint: detail.tokenMint,
          usdcVault: detail.usdcVault,
          activatedAt: detail.activatedAt,
          description: detail.description,
          aboutProject: detail.aboutProject,
          highlights: detail.highlights,
          managementText: detail.managementText,
          financialsText: detail.financialsText,
          documents: detail.documents,
          trustScore: detail.trustScore,
          expectedApyBps: detail.expectedApyBps,
          heroImageUrl: resolveHeroImage(detail.msmeName) ?? null,
        }}
        baseline={
          detail.baseline
            ? {
                energyKwhPerYear: detail.baseline.energyKwhPerYear,
                fuelType: detail.baseline.fuelType,
                reportHash: detail.baseline.reportHash,
                submittedAt: detail.baseline.createdAt,
                auditorWallet: detail.baseline.auditorWallet,
              }
            : null
        }
        verifications={detail.verifications.map((v, idx) => ({
          index: idx + 1,
          auditorWallet: v.auditorWallet,
          attested: v.attested,
          periodStart: v.periodStart,
          periodEnd: v.periodEnd,
          submittedAt: v.createdAt,
        }))}
        distributions={distributionRows
          .filter((t) => t.txType === "distribute")
          .map((t) => ({
            signature: t.txSig,
            amountUsdc: t.amountUsdc,
            blockTime: t.blockTime ? t.blockTime.toISOString() : null,
            createdAt: t.createdAt.toISOString(),
          }))}
        auditors={Object.fromEntries(auditorMap)}
        ecms={detail.ecms.map((e) => ({
          id: e.id,
          dealId: e.dealId,
          ecmId: e.ecmId,
          equipmentType: e.equipmentType,
          description: e.description,
          modelUsed: e.modelUsed,
          pinnSavingsKwh: e.pinnSavingsKwh,
          pinnP5LowerKwh: e.pinnP5LowerKwh,
          pinnP95UpperKwh: e.pinnP95UpperKwh,
          pinnSigmaKwh: e.pinnSigmaKwh,
          confidenceGrade: e.confidenceGrade,
          investmentInr: e.investmentInr,
          electricityRateInrKwh: e.electricityRateInrKwh,
          annualSavingsInr: e.annualSavingsInr,
          paybackMonths: e.paybackMonths,
          p5PaybackMonths: e.p5PaybackMonths,
          dscrAtP5: e.dscrAtP5,
          dscrAtP50: e.dscrAtP50,
          carbonEligible: e.carbonEligible,
          carbonTco2PerYear: e.carbonTco2PerYear,
          carbonMethodology: e.carbonMethodology,
        }))}
      />
    </Container>
  );
}
