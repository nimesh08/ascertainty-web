"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";

import { BuyModal } from "@/components/investor/buy-modal";
import { ClaimModal } from "@/components/investor/claim-modal";
import { useInvestor } from "@/lib/hooks/use-investor";
import {
  claimableFromPosition,
  fetchPosition,
  type PositionData,
} from "@/lib/solana/reads";

import {
  HeroCard,
  AboutSection,
  HighlightsSection,
  UpgradesSection,
  ManagementSection,
} from "./sections-part-1";
import {
  BaselineImpactSection,
  ReturnsCalculatorSection,
  UnderwritingBriefSection,
  DocumentsSection,
  RepaymentHistorySection,
} from "./sections-part-2";
import { Sidebar } from "./sidebar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectData {
  id: string;
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  totalDistributed: string;
  cumulativePerToken: string;
  termMonths: number;
  onchainPda: string | null;
  tokenMint: string | null;
  usdcVault: string | null;
  activatedAt: string | null;
  description: string | null;
  aboutProject: string | null;
  highlights:
    | Array<{ title: string; detail: string; icon?: string }>
    | null;
  managementText: string | null;
  financialsText: string | null;
  documents: Array<{ name: string; url: string }> | null;
  trustScore: number | null;
  expectedApyBps: number | null;
}

interface BaselineData {
  energyKwhPerYear: string;
  fuelType: string;
  reportHash: string | null;
  submittedAt: string;
  auditorWallet: string;
}

interface VerificationData {
  index: number;
  auditorWallet: string;
  attested: boolean;
  periodStart: string;
  periodEnd: string;
  submittedAt: string;
}

interface DistributionData {
  signature: string;
  amountUsdc: string | null;
  blockTime: string | null;
  createdAt: string;
}

interface UnderwritingData {
  dealId: string;
  modelUsed: string | null;
  pinnSavingsKwh: string | null;
  pinnP5LowerKwh: string | null;
  pinnP95UpperKwh: string | null;
  confidenceGrade: string | null;
  electricityRateInrKwh: string | null;
  dscrAtP5: string | null;
  dscrAtP50: string | null;
  carbonEligible: boolean | null;
  carbonTco2PerYear: string | null;
  carbonMethodology: string | null;
}

interface AuditorInfo {
  name: string;
  certification: string;
}

export function ProjectDetailClient({
  project,
  baseline,
  verifications,
  distributions,
  auditors,
  underwriting,
}: {
  project: ProjectData;
  baseline: BaselineData | null;
  verifications: VerificationData[];
  distributions: DistributionData[];
  auditors: Record<string, AuditorInfo>;
  underwriting: UnderwritingData | null;
}) {
  const { connected, connection, publicKey, login } = useInvestor();
  const [position, setPosition] = useState<PositionData | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const target = useMemo(
    () => BigInt(project.targetUsdc || "0"),
    [project.targetUsdc]
  );
  const sold = useMemo(
    () => BigInt(project.tokensSold || "0"),
    [project.tokensSold]
  );
  const remaining = target > sold ? target - sold : 0n;

  const pct = useMemo(() => {
    if (target === 0n) return 0;
    return Math.min(100, Number((sold * 10_000n) / target) / 100);
  }, [target, sold]);

  const apyPct = useMemo(() => {
    if (project.expectedApyBps == null) return 0;
    return project.expectedApyBps / 100;
  }, [project.expectedApyBps]);

  const claimable = useMemo(() => {
    if (!position) return 0n;
    return claimableFromPosition({
      tokensHeld: position.tokensHeld,
      lastClaimedPerToken: position.lastClaimedPerToken,
      cumulativePerToken: BigInt(project.cumulativePerToken),
    });
  }, [position, project.cumulativePerToken]);

  useEffect(() => {
    if (!connected || !publicKey || !project.onchainPda) {
      setPosition(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchPosition(
          connection,
          new PublicKey(project.onchainPda!),
          publicKey
        );
        if (!cancelled) setPosition(p);
      } catch (err) {
        console.warn("position fetch", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, project.onchainPda, connection, reloadKey]);

  const canInvest = !!(
    project.onchainPda &&
    project.tokenMint &&
    project.usdcVault
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <HeroCard project={project} />

        <AboutSection
          text={project.aboutProject}
          financialsText={project.financialsText}
        />

        <HighlightsSection highlights={project.highlights ?? []} />

        <UpgradesSection
          upgradeType={project.upgradeType}
          description={project.description}
        />

        <ManagementSection text={project.managementText} />

        <UnderwritingBriefSection underwriting={underwriting} />

        <BaselineImpactSection
          baseline={baseline}
          verifications={verifications}
          auditors={auditors}
        />

        <ReturnsCalculatorSection
          remainingRaw={remaining}
          targetRaw={target}
          apyPct={apyPct}
          termMonths={project.termMonths}
        />

        <DocumentsSection documents={project.documents ?? []} />

        <RepaymentHistorySection distributions={distributions} />
      </div>

      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Sidebar
          project={project}
          apyPct={apyPct}
          pct={pct}
          connected={connected}
          login={login}
          position={position}
          claimable={claimable}
          canInvest={canInvest}
          onInvest={() => setBuyOpen(true)}
          onClaim={() => setClaimOpen(true)}
          underwriting={
            underwriting
              ? {
                  dealId: underwriting.dealId,
                  confidenceGrade: underwriting.confidenceGrade,
                  modelUsed: underwriting.modelUsed,
                }
              : null
          }
        />
      </aside>

      {canInvest ? (
        <BuyModal
          open={buyOpen}
          onOpenChange={setBuyOpen}
          target={{
            kind: "project",
            id: project.id,
            name: project.msmeName,
            pda: project.onchainPda!,
            tokenMint: project.tokenMint!,
            usdcVault: project.usdcVault!,
          }}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      ) : null}
      {canInvest ? (
        <ClaimModal
          open={claimOpen}
          onOpenChange={setClaimOpen}
          target={{
            kind: "project",
            id: project.id,
            name: project.msmeName,
            pda: project.onchainPda!,
            usdcVault: project.usdcVault!,
          }}
          claimableRaw={claimable.toString()}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      ) : null}
    </div>
  );
}
