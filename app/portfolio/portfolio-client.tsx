"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, RefreshCw, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { StatTile } from "@/components/investor/stat-tile";
import { StatusBadge } from "@/components/investor/status-badge";
import { ClaimModal } from "@/components/investor/claim-modal";
import { WalletBalancesCard } from "@/components/investor/wallet-balances-card";
import { PositionDrillDown } from "@/components/shared/PositionDrillDown";
import { SecondaryMarketCard } from "@/components/shared/SecondaryMarketCard";
import { useInvestor } from "@/lib/hooks/use-investor";
import { claimableFromPosition } from "@/lib/solana/reads";
import { fmtNumber, fmtUsdc, shortSig, explorerTx } from "@/lib/utils/format";
import { DEMO_VAULTS } from "@/lib/demo/lp-positions";

interface ApiPositionRow {
  id: string;
  kind: "project" | "pool";
  targetId: string;
  targetName: string;
  targetStatus: string;
  onchainPda: string | null;
  usdcVault: string | null;
  tokenMint: string | null;
  tokenAmount: string;
  lastCumulativePerToken: string;
  claimedTotal: string;
  cumulativePerToken: string;
  createdAt: string;
}

interface PositionRow {
  kind: "project" | "pool";
  id: string;
  name: string;
  status: string;
  pda: string;
  usdcVault: string;
  tokensHeld: bigint;
  claimable: bigint;
  totalClaimed: bigint;
}

interface ApiTx {
  signature?: string;
  txSig?: string;
  txType: string;
  amountUsdc: string | null;
  tokenAmount: string | null;
  projectId: string | null;
  poolId: string | null;
  createdAt: string;
}

function rowFromApi(row: ApiPositionRow): PositionRow | null {
  if (!row.onchainPda || !row.usdcVault) return null;
  const tokensHeld = BigInt(row.tokenAmount ?? "0");
  if (tokensHeld === 0n) return null;
  const claimable = claimableFromPosition({
    tokensHeld,
    lastClaimedPerToken: BigInt(row.lastCumulativePerToken ?? "0"),
    cumulativePerToken: BigInt(row.cumulativePerToken ?? "0"),
  });
  return {
    kind: row.kind,
    id: row.targetId,
    name: row.targetName,
    status: row.targetStatus,
    pda: row.onchainPda,
    usdcVault: row.usdcVault,
    tokensHeld,
    claimable,
    totalClaimed: BigInt(row.claimedTotal ?? "0"),
  };
}

export function PortfolioClient() {
  const { ready, connected, walletAddress, login } = useInvestor();

  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  const [txs, setTxs] = useState<ApiTx[]>([]);
  const [txsLoading, setTxsLoading] = useState(false);
  const [txsError, setTxsError] = useState<string | null>(null);

  const [claimTarget, setClaimTarget] = useState<PositionRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const toggleRow = useCallback((key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!connected || !walletAddress) {
      setPositions([]);
      setTxs([]);
      setPositionsError(null);
      setTxsError(null);
      setPositionsLoading(false);
      setTxsLoading(false);
      return;
    }
    let cancelled = false;

    setPositionsLoading(true);
    setPositionsError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/portfolio/positions?owner=${encodeURIComponent(walletAddress)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as { positions?: ApiPositionRow[] };
        if (cancelled) return;
        const rows = (data.positions ?? [])
          .map(rowFromApi)
          .filter((r): r is PositionRow => r !== null);
        setPositions(rows);
        if (!res.ok) {
          setPositionsError("Couldn't load positions. Try refreshing.");
        }
      } catch (err) {
        console.error("portfolio positions load", err);
        if (!cancelled) {
          setPositionsError(
            err instanceof Error ? err.message : "Failed to load positions"
          );
        }
      } finally {
        if (!cancelled) setPositionsLoading(false);
      }
    })();

    setTxsLoading(true);
    setTxsError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/portfolio/transactions?owner=${encodeURIComponent(walletAddress)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as { transactions?: ApiTx[] };
        if (cancelled) return;
        setTxs(data.transactions ?? []);
        if (!res.ok) {
          setTxsError("Couldn't load transactions.");
        }
      } catch (err) {
        console.error("portfolio txs load", err);
        if (!cancelled) {
          setTxsError(
            err instanceof Error ? err.message : "Failed to load transactions"
          );
        }
      } finally {
        if (!cancelled) setTxsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, walletAddress, reloadKey]);

  if (!ready) {
    return <PortfolioSkeleton />;
  }

  if (!connected) {
    return (
      <Card className="gap-4 p-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full border border-green/30 bg-green/5">
          <Wallet className="size-5 text-green" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-fg">
            Connect wallet to view portfolio
          </h2>
          <p className="text-sm text-fg-muted">
            Your positions, claims, and transaction history will show up here.
          </p>
        </div>
        <div>
          <Button onClick={() => login()} data-testid="portfolio-connect">
            Connect wallet
          </Button>
        </div>
      </Card>
    );
  }

  const totals = positions.reduce(
    (acc, p) => {
      acc.invested += p.tokensHeld;
      acc.claimable += p.claimable;
      acc.claimed += p.totalClaimed;
      return acc;
    },
    { invested: 0n, claimable: 0n, claimed: 0n }
  );

  return (
    <div className="space-y-8">
      <WalletBalancesCard owner={walletAddress!} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatTile
          label="Total invested"
          value={fmtUsdc(totals.invested.toString())}
          accent="green"
        />
        <StatTile
          label="Total claimable"
          value={fmtUsdc(totals.claimable.toString())}
          accent="cyan"
          sub="claim anytime"
        />
        <StatTile
          label="Total claimed"
          value={fmtUsdc(totals.claimed.toString())}
          accent="violet"
        />
        <StatTile
          label="Realized vs predicted"
          value="+2.1%"
          accent="green"
          sub="portfolio-weighted · demo"
        />
      </div>

      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions">
            Positions{" "}
            <span className="ml-1 text-xs text-fg-muted">
              ({positions.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="history">Transaction history</TabsTrigger>
          <TabsTrigger value="secondary">
            Secondary{" "}
            <span className="ml-1 text-[10px] text-amber">Q3 2026</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-6">
          {positionsLoading && positions.length === 0 ? (
            <PortfolioSkeleton />
          ) : positionsError && positions.length === 0 ? (
            <Card className="gap-3 p-10 text-center">
              <p className="text-sm text-fg-muted">{positionsError}</p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  className="mt-2"
                >
                  <RefreshCw className="mr-1 size-3.5" />
                  Refresh
                </Button>
              </div>
            </Card>
          ) : positions.length === 0 ? (
            <Card className="p-10 text-center text-fg-muted">
              <p>You don&apos;t have any positions yet.</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/projects">Explore projects</Link>
              </Button>
            </Card>
          ) : (
            <Card className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Target</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Claimable</TableHead>
                      <TableHead className="text-right">Claimed</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((p, i) => {
                      const rowKey = `${p.kind}-${p.id}`;
                      const expanded = expandedRows.has(rowKey);
                      const demoVault = DEMO_VAULTS[i % DEMO_VAULTS.length];
                      return (
                        <Fragment key={rowKey}>
                          <TableRow>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => toggleRow(rowKey)}
                                aria-label={expanded ? "Collapse details" : "Expand details"}
                                className="text-fg-muted hover:text-fg"
                              >
                                {expanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <Link
                                href={
                                  p.kind === "project"
                                    ? `/projects/${p.id}`
                                    : `/pools/${p.id}`
                                }
                                className="font-medium hover:text-green"
                              >
                                {p.name}
                              </Link>
                            </TableCell>
                            <TableCell className="capitalize text-fg-muted">
                              {p.kind}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={p.status} />
                            </TableCell>
                            <TableCell className="mono-num text-right">
                              {fmtNumber(Number(p.tokensHeld) / 1_000_000, 2)}
                            </TableCell>
                            <TableCell className="mono-num text-right text-green">
                              {fmtUsdc(p.claimable.toString())}
                            </TableCell>
                            <TableCell className="mono-num text-right">
                              {fmtUsdc(p.totalClaimed.toString())}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={p.claimable > 0n ? "default" : "outline"}
                                disabled={p.claimable === 0n}
                                onClick={() => setClaimTarget(p)}
                              >
                                Claim
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expanded ? (
                            <TableRow>
                              <TableCell colSpan={8} className="p-0">
                                <PositionDrillDown vault={demoVault} />
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y divide-line/60 md:hidden">
                {positions.map((p, i) => {
                  const rowKey = `${p.kind}-${p.id}`;
                  const expanded = expandedRows.has(rowKey);
                  const demoVault = DEMO_VAULTS[i % DEMO_VAULTS.length];
                  return (
                    <li key={rowKey} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={
                              p.kind === "project"
                                ? `/projects/${p.id}`
                                : `/pools/${p.id}`
                            }
                            className="block truncate font-medium text-fg"
                          >
                            {p.name}
                          </Link>
                          <p className="mt-0.5 text-xs capitalize text-fg-muted">
                            {p.kind} · {p.status}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-fg-muted">Tokens</p>
                          <p className="mono-num text-fg">
                            {fmtNumber(Number(p.tokensHeld) / 1_000_000, 2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-fg-muted">Claimable</p>
                          <p className="mono-num text-green">
                            {fmtUsdc(p.claimable.toString())}
                          </p>
                        </div>
                        <div>
                          <p className="text-fg-muted">Claimed</p>
                          <p className="mono-num text-fg">
                            {fmtUsdc(p.totalClaimed.toString())}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={p.claimable === 0n}
                          onClick={() => setClaimTarget(p)}
                          variant={p.claimable > 0n ? "default" : "outline"}
                        >
                          Claim
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRow(rowKey)}
                          aria-label={expanded ? "Hide details" : "Show details"}
                        >
                          {expanded ? "Hide" : "Details"}
                        </Button>
                      </div>
                      {expanded ? (
                        <div className="-mx-4 mt-3 -mb-4">
                          <PositionDrillDown vault={demoVault} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {txsLoading && txs.length === 0 ? (
            <PortfolioSkeleton />
          ) : txsError && txs.length === 0 ? (
            <Card className="gap-3 p-10 text-center">
              <p className="text-sm text-fg-muted">
                Couldn&apos;t load transactions — try refresh.
              </p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  className="mt-2"
                >
                  <RefreshCw className="mr-1 size-3.5" />
                  Refresh
                </Button>
              </div>
            </Card>
          ) : txs.length === 0 ? (
            <Card className="p-10 text-center text-fg-muted">
              No transactions yet for this wallet.
            </Card>
          ) : (
            <Card className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Signature</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txs.map((t) => {
                      const sig = t.signature ?? t.txSig ?? "";
                      return (
                        <TableRow key={sig}>
                          <TableCell className="text-fg-muted">
                            {new Date(t.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>{t.txType.replace(/_/g, " ")}</TableCell>
                          <TableCell className="mono-num text-right">
                            {t.amountUsdc ? fmtUsdc(t.amountUsdc) : "—"}
                          </TableCell>
                          <TableCell>
                            <a
                              href={explorerTx(sig)}
                              target="_blank"
                              rel="noopener"
                              className="mono-num inline-flex items-center gap-1 text-fg-muted transition-colors hover:text-fg"
                            >
                              {shortSig(sig, 6)}
                              <ExternalLink className="size-3" />
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y divide-line/60 md:hidden">
                {txs.map((t) => {
                  const sig = t.signature ?? t.txSig ?? "";
                  return (
                    <li key={sig} className="p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{t.txType.replace(/_/g, " ")}</span>
                        <span className="mono-num">
                          {t.amountUsdc ? fmtUsdc(t.amountUsdc) : "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-fg-muted">
                        <span>{new Date(t.createdAt).toLocaleString()}</span>
                        <a
                          href={explorerTx(sig)}
                          target="_blank"
                          rel="noopener"
                          className="mono-num inline-flex items-center gap-1"
                        >
                          {shortSig(sig, 4)}
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="secondary" className="mt-6">
          <SecondaryMarketCard />
        </TabsContent>
      </Tabs>

      {claimTarget ? (
        <ClaimModal
          open={!!claimTarget}
          onOpenChange={(v) => !v && setClaimTarget(null)}
          target={{
            kind: claimTarget.kind,
            id: claimTarget.id,
            name: claimTarget.name,
            pda: claimTarget.pda,
            usdcVault: claimTarget.usdcVault,
          }}
          claimableRaw={claimTarget.claimable.toString()}
          onSuccess={() => {
            setClaimTarget(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Card className="p-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
