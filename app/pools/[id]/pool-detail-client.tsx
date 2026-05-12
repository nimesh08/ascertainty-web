"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { StatusBadge } from "@/components/investor/status-badge";
import { BuyModal } from "@/components/investor/buy-modal";
import { ClaimModal } from "@/components/investor/claim-modal";
import { useInvestor } from "@/lib/hooks/use-investor";
import {
  claimableFromPosition,
  fetchPosition,
  type PositionData,
} from "@/lib/solana/reads";
import { fmtUsdc, fmtNumber, shortSig, explorerTx } from "@/lib/utils/format";
import { ArrowRight, ExternalLink } from "lucide-react";

interface PoolData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetUsdc: string;
  tokensSold: string;
  totalDistributed: string;
  cumulativePerToken: string;
  onchainPda: string | null;
  poolTokenMint: string | null;
  usdcVault: string | null;
}

interface UnderlyingProject {
  projectId: string;
  projectTokensHeld: string;
  msmeName: string;
  sector: string;
  location: string;
  status: string;
  targetUsdc: string;
  tokensSold: string;
}

interface TxData {
  signature: string;
  txType: string;
  amountUsdc: string | null;
  walletPubkey: string | null;
  createdAt: string;
}

export function PoolDetailClient({
  pool,
  underlying,
  txs,
}: {
  pool: PoolData;
  underlying: UnderlyingProject[];
  txs: TxData[];
}) {
  const { connected, connection, publicKey, login } = useInvestor();
  const [position, setPosition] = useState<PositionData | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const pct = useMemo(() => {
    const t = Number(pool.targetUsdc);
    const s = Number(pool.tokensSold);
    return t > 0 ? Math.min(100, (s / t) * 100) : 0;
  }, [pool.targetUsdc, pool.tokensSold]);

  const claimable = useMemo(() => {
    if (!position) return 0n;
    return claimableFromPosition({
      tokensHeld: position.tokensHeld,
      lastClaimedPerToken: position.lastClaimedPerToken,
      cumulativePerToken: BigInt(pool.cumulativePerToken),
    });
  }, [position, pool.cumulativePerToken]);

  useEffect(() => {
    if (!connected || !publicKey || !pool.onchainPda) {
      setPosition(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchPosition(
          connection,
          new PublicKey(pool.onchainPda!),
          publicKey
        );
        if (!cancelled) setPosition(p);
      } catch (err) {
        console.warn("pool position fetch", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, pool.onchainPda, connection, reloadKey]);

  const canInvest = !!(pool.onchainPda && pool.poolTokenMint && pool.usdcVault);

  const totalTokens = underlying.reduce(
    (sum, u) => sum + Number(u.projectTokensHeld || 0),
    0
  );

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Target" value={fmtUsdc(pool.targetUsdc)} accent="violet" />
        <StatTile
          label="Tokens sold"
          value={fmtUsdc(pool.tokensSold)}
          sub={`${pct.toFixed(1)}% funded`}
          accent="cyan"
        />
        <StatTile
          label="Distributed"
          value={fmtUsdc(pool.totalDistributed)}
          accent="green"
        />
        <StatTile
          label="Underlying"
          value={underlying.length}
          sub="projects"
          accent="magenta"
        />
      </div>

      <div className="mt-4">
        <Progress
          value={pct}
          className="h-1.5 [&_[data-slot=progress-indicator]]:bg-accent"
        />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="underlying">
            Underlying{" "}
            <span className="ml-1 text-xs text-fg-muted">
              ({underlying.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pool details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Status" value={pool.status} />
                <DetailRow label="Underlying projects" value={underlying.length} />
                {pool.onchainPda ? (
                  <DetailRow
                    label="Program PDA"
                    mono
                    value={`${pool.onchainPda.slice(0, 8)}…${pool.onchainPda.slice(-8)}`}
                  />
                ) : null}
                {pool.poolTokenMint ? (
                  <DetailRow
                    label="Pool token"
                    mono
                    value={`${pool.poolTokenMint.slice(0, 8)}…${pool.poolTokenMint.slice(-8)}`}
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
                    <p>You don&apos;t hold this pool yet.</p>
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
                      label="Pool tokens held"
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

        <TabsContent value="underlying" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Underlying projects</CardTitle>
            </CardHeader>
            <CardContent>
              {underlying.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-muted">
                  This pool has no underlying projects yet.
                </p>
              ) : (
                <ul className="divide-y divide-line/60">
                  {underlying.map((u) => {
                    const held = Number(u.projectTokensHeld);
                    const weight = totalTokens > 0 ? (held / totalTokens) * 100 : 0;
                    return (
                      <li key={u.projectId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-fg">{u.msmeName}</span>
                            <StatusBadge status={u.status} />
                          </div>
                          <p className="mt-1 text-xs text-fg-muted">
                            {u.sector.replace(/_/g, " ")} · {u.location} ·{" "}
                            <span className="mono-num text-fg/80">
                              {weight.toFixed(1)}% weight
                            </span>
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/projects/${u.projectId}`}>
                            View
                            <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {txs.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-muted">
                  No pool activity yet.
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
                          <span className="mono-num">
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
      </Tabs>

      {canInvest ? (
        <BuyModal
          open={buyOpen}
          onOpenChange={setBuyOpen}
          target={{
            kind: "pool",
            id: pool.id,
            name: pool.name,
            pda: pool.onchainPda!,
            poolTokenMint: pool.poolTokenMint!,
            usdcVault: pool.usdcVault!,
          }}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      ) : null}

      {canInvest ? (
        <ClaimModal
          open={claimOpen}
          onOpenChange={setClaimOpen}
          target={{
            kind: "pool",
            id: pool.id,
            name: pool.name,
            pda: pool.onchainPda!,
            usdcVault: pool.usdcVault!,
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
