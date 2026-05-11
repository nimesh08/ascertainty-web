import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Tag } from "lucide-react";

import { Container } from "@/components/layout/container";
import { StatusPill } from "@/components/shared/StatusPill";
import { getProjectWithDetails } from "@/lib/db/queries/projects";
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

  const project = {
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
  };

  const baseline = detail.baseline
    ? {
        energyKwhPerYear: detail.baseline.energyKwhPerYear,
        costInrPerYear: "0",
        co2TonsPerYearX100: "0",
        fuelType: detail.baseline.fuelType,
        reportHash: detail.baseline.reportHash,
        submittedAt: detail.baseline.createdAt,
      }
    : null;

  const verifications = detail.verifications.map((v, idx) => ({
    index: idx + 1,
    kwhSaved: "0",
    costSavedPaise: "0",
    co2AvoidedX100: "0",
    savingsBps: 0,
    attested: v.attested,
    periodStart: v.periodStart,
    periodEnd: v.periodEnd,
    submittedAt: v.createdAt,
    reportHash: v.reportHash,
  }));

  const txs = detail.recentTransactions.map((t) => ({
    signature: t.txSig,
    txType: t.txType,
    amountUsdc: t.amountUsdc,
    tokenAmount: t.tokenAmount,
    walletPubkey: t.walletPubkey,
    blockTime: t.blockTime,
    createdAt: t.createdAt,
  }));

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="size-4" /> Projects
        </Link>
        <StatusPill status={detail.status} />
      </div>

      <header className="mt-6 space-y-3">
        <h1 className="font-serif text-4xl italic leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-br from-green via-cyan to-violet bg-clip-text text-transparent">
            {detail.msmeName}
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5" />
            {detail.sector.replace(/_/g, " ")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {detail.location}
          </span>
          <span className="mono-num">· {detail.termMonths} mo term</span>
        </div>
      </header>

      <ProjectDetailClient
        project={project}
        mrvProject={detail.mrvProject}
        baseline={baseline}
        verifications={verifications}
        txs={txs}
      />
    </Container>
  );
}
