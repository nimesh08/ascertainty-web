"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

import { StatTile } from "@/components/investor/stat-tile";
import { BuyModal } from "@/components/investor/buy-modal";
import { ClaimModal } from "@/components/investor/claim-modal";
import { useInvestor } from "@/lib/hooks/use-investor";
import {
  claimableFromPosition,
  fetchPosition,
  type PositionData,
} from "@/lib/solana/reads";
import { fmtUsdc, fmtNumber, shortSig, explorerTx } from "@/lib/utils/format";
import { ExternalLink, Leaf, Flame, IndianRupee, Zap } from "lucide-react";

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
}

interface BaselineData {
  energyKwhPerYear: string;
  costInrPerYear: string;
  co2TonsPerYearX100: string;
  fuelType: string;
  reportHash: string | null;
  submittedAt: string;
}

interface VerificationData {
  index: number;
  kwhSaved: string;
  costSavedPaise: string;
  co2AvoidedX100: string;
  savingsBps: number;
  attested: boolean;
  periodStart: string;
  periodEnd: string;
  submittedAt: string;
  reportHash: string | null;
}

interface TxData {
  signature: string;
  txType: string;
  amountUsdc: string | null;
  tokenAmount: string | null;
  walletPubkey: string | null;
  blockTime: string | null;
  createdAt: string;
}

export function ProjectDetailClient({
  project,
  mrvProject,
  baseline,
  verifications,
  txs,
}: {
  project: ProjectData;
  mrvProject: {
    id: string;
    msmeName: string;
    verificationCount: number;
    baselineSubmitted: boolean;
  } | null;
  baseline: BaselineData | null;
  verifications: VerificationData[];
  txs: TxData[];
}) {
  void mrvProject;
  const { connected, connection, publicKey, login } = useInvestor();
  const [position, setPosition] = useState<PositionData | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const pct = useMemo(() => {
    const t = Number(project.targetUsdc);
    const s = Number(project.tokensSold);
    return t > 0 ? Math.min(100, (s / t) * 100) : 0;
  }, [project.targetUsdc, project.tokensSold]);

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
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Target"
          value={fmtUsdc(project.targetUsdc)}
          accent="green"
        />
        <StatTile
          label="Tokens sold"
          value={fmtUsdc(project.tokensSold)}
          sub={`${pct.toFixed(1)}% funded`}
          accent="cyan"
        />
        <StatTile
          label="Distributed"
          value={fmtUsdc(project.totalDistributed)}
          accent="violet"
        />
        <StatTile
          label="Per-token"
          value={fmtUsdc(
            BigInt(project.cumulativePerToken || "0") / 1_000_000n || "0"
          )}
          sub="cumulative"
          accent="magenta"
        />
      </div>

      <div className="mt-4">
        <Progress value={pct} className="h-1.5" />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="mrv">MRV</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Sector" value={project.sector.replace(/_/g, " ")} />
                <DetailRow label="Location" value={project.location} />
                <DetailRow label="Upgrade" value={project.upgradeType.replace(/_/g, " ")} />
                <DetailRow label="Term" value={`${project.termMonths} months`} />
                <DetailRow label="Status" value={project.status} />
                <DetailRow
                  label="Activated"
                  value={
                    project.activatedAt
                      ? new Date(project.activatedAt).toLocaleString()
                      : "Not activated"
                  }
                />
                {project.onchainPda ? (
                  <DetailRow
                    label="Program PDA"
                    mono
                    value={`${project.onchainPda.slice(0, 8)}…${project.onchainPda.slice(-8)}`}
                  />
                ) : null}
                {project.tokenMint ? (
                  <DetailRow
                    label="Token mint"
                    mono
                    value={`${project.tokenMint.slice(0, 8)}…${project.tokenMint.slice(-8)}`}
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your position</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {!connected ? (
                  <div className="space-y-3 text-fg-muted">
                    <p>Connect a wallet to view your position.</p>
                    <Button onClick={() => login()} size="sm">
                      Connect wallet
                    </Button>
                  </div>
                ) : !position?.exists ? (
                  <div className="space-y-3 text-fg-muted">
                    <p>You don&apos;t have a position in this project yet.</p>
                    <Button
                      size="sm"
                      onClick={() => setBuyOpen(true)}
                      disabled={!canInvest}
                    >
                      Invest
                    </Button>
                  </div>
                ) : (
                  <>
                    <DetailRow
                      label="Tokens held"
                      mono
                      value={fmtNumber(
                        Number(position.tokensHeld) / 1_000_000,
                        2
                      )}
                    />
                    <DetailRow
                      label="Claimable"
                      mono
                      value={fmtUsdc(claimable.toString())}
                      accent="text-green"
                    />
                    <DetailRow
                      label="Claimed to date"
                      mono
                      value={fmtUsdc(position.totalClaimed.toString())}
                    />
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                      <Button
                        className="flex-1"
                        onClick={() => setBuyOpen(true)}
                        disabled={!canInvest}
                      >
                        Invest more
                      </Button>
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => setClaimOpen(true)}
                        disabled={claimable === 0n}
                      >
                        Claim
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distributions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Distributions & activity</CardTitle>
            </CardHeader>
            <CardContent>
              {txs.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-muted">
                  No activity yet.
                </p>
              ) : (
                <>
                  <div className="hidden sm:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Wallet</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Signature</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {txs.map((t) => (
                          <TableRow key={t.signature}>
                            <TableCell className="text-fg-muted">
                              {new Date(t.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>{t.txType.replace(/_/g, " ")}</TableCell>
                            <TableCell className="mono-num">
                              {t.walletPubkey
                                ? `${t.walletPubkey.slice(0, 4)}…${t.walletPubkey.slice(-4)}`
                                : "—"}
                            </TableCell>
                            <TableCell className="mono-num text-right">
                              {t.amountUsdc ? fmtUsdc(t.amountUsdc) : "—"}
                            </TableCell>
                            <TableCell>
                              <a
                                href={explorerTx(t.signature)}
                                target="_blank"
                                rel="noopener"
                                className="mono-num inline-flex items-center gap-1 text-fg-muted transition-colors hover:text-fg"
                              >
                                {shortSig(t.signature, 6)}
                                <ExternalLink className="size-3" />
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="divide-y divide-line/60 sm:hidden">
                    {txs.map((t) => (
                      <li key={t.signature} className="py-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{t.txType.replace(/_/g, " ")}</span>
                          <span className="mono-num text-right">
                            {t.amountUsdc ? fmtUsdc(t.amountUsdc) : "—"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
                          <span>{new Date(t.createdAt).toLocaleString()}</span>
                          <a
                            href={explorerTx(t.signature)}
                            target="_blank"
                            rel="noopener"
                            className="mono-num inline-flex items-center gap-1"
                          >
                            {shortSig(t.signature, 4)}
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mrv" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Baseline</CardTitle>
              </CardHeader>
              <CardContent>
                {!baseline ? (
                  <p className="py-4 text-sm text-fg-muted">
                    Baseline not yet submitted by the auditor.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <MrvMetric
                      icon={<Zap className="size-4 text-cyan" />}
                      label="Energy / yr"
                      value={`${Number(baseline.energyKwhPerYear).toLocaleString()} kWh`}
                    />
                    <MrvMetric
                      icon={<Flame className="size-4 text-magenta" />}
                      label="Fuel"
                      value={baseline.fuelType}
                    />
                    <MrvMetric
                      icon={<IndianRupee className="size-4 text-green" />}
                      label="Cost / yr"
                      value={`₹${Number(baseline.costInrPerYear).toLocaleString()}`}
                    />
                    <MrvMetric
                      icon={<Leaf className="size-4 text-green" />}
                      label="CO₂ / yr"
                      value={`${(
                        Number(baseline.co2TonsPerYearX100) / 100
                      ).toFixed(2)} t`}
                    />
                    {baseline.reportHash ? (
                      <div className="col-span-2 text-xs text-fg-muted">
                        <p>Report hash</p>
                        <p className="mono-num mt-1 break-all text-fg/80">
                          {baseline.reportHash}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Verifications{" "}
                  <span className="ml-1 text-xs text-fg-muted">
                    ({verifications.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verifications.length === 0 ? (
                  <p className="py-4 text-sm text-fg-muted">
                    No verifications submitted yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {verifications.map((v) => (
                      <li
                        key={v.index}
                        className="rounded-lg border border-line/60 bg-bg-2/40 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            #{v.index} · {new Date(v.periodStart).toLocaleDateString()} —{" "}
                            {new Date(v.periodEnd).toLocaleDateString()}
                          </span>
                          <span
                            className={
                              v.attested
                                ? "text-xs text-green"
                                : "text-xs text-fg-muted"
                            }
                          >
                            {v.attested ? "Attested" : "Pending"}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-fg-muted">
                          <div>
                            <p>kWh saved</p>
                            <p className="mono-num text-fg">
                              {Number(v.kwhSaved).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p>Cost saved</p>
                            <p className="mono-num text-fg">
                              ₹{(Number(v.costSavedPaise) / 100).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p>Savings</p>
                            <p className="mono-num text-green">
                              {(v.savingsBps / 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-fg-muted">{label}</span>
      <span className={`${mono ? "mono-num" : ""} ${accent ?? "text-fg"}`}>
        {value}
      </span>
    </div>
  );
}

function MrvMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-bg-2/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-fg-muted">
        {icon}
        {label}
      </div>
      <p className="mono-num mt-1 text-sm text-fg">{value}</p>
    </div>
  );
}
