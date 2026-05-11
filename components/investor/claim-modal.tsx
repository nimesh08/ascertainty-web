"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInvestor } from "@/lib/hooks/use-investor";
import {
  buildClaimProjectReturns,
  buildClaimPoolReturns,
} from "@/lib/solana/tx";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { fmtUsdc, explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

export interface ClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target:
    | {
        kind: "project";
        id: string;
        name: string;
        pda: string;
        usdcVault: string;
      }
    | {
        kind: "pool";
        id: string;
        name: string;
        pda: string;
        usdcVault: string;
      };
  claimableRaw: string;
  onSuccess?: (signature: string) => void;
}

interface SimPreview {
  usdcDelta: number; // positive = credit
  err: string | null;
}

export function ClaimModal({
  open,
  onOpenChange,
  target,
  claimableRaw,
  onSuccess,
}: ClaimModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [sim, setSim] = useState<SimPreview | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const { connected, program, publicKey, walletAddress, connection, signAndSend, login } =
    useInvestor();
  const router = useRouter();

  const simCacheRef = useRef<{ key: string; value: SimPreview } | null>(null);

  const simulate = useCallback(async () => {
    if (!connected || !program || !publicKey) return;
    const cacheKey = `${target.pda}:${claimableRaw}`;
    if (simCacheRef.current?.key === cacheKey) {
      setSim(simCacheRef.current.value);
      return;
    }
    setSimLoading(true);
    try {
      let tx: Transaction;
      if (target.kind === "project") {
        tx = await buildClaimProjectReturns({
          program,
          investor: publicKey,
          projectPda: new PublicKey(target.pda),
          usdcVault: new PublicKey(target.usdcVault),
          usdcMint: DEVNET_USDC_MINT,
        });
      } else {
        tx = await buildClaimPoolReturns({
          program,
          investor: publicKey,
          poolPda: new PublicKey(target.pda),
          usdcVault: new PublicKey(target.usdcVault),
          usdcMint: DEVNET_USDC_MINT,
        });
      }
      tx.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const vtx = new VersionedTransaction(tx.compileMessage());
      const res = await connection.simulateTransaction(vtx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });
      const value = res.value as typeof res.value & {
        preTokenBalances?: Array<{
          accountIndex: number;
          mint: string;
          uiTokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number | null;
            uiAmountString: string;
          };
        }>;
        postTokenBalances?: Array<{
          accountIndex: number;
          mint: string;
          uiTokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number | null;
            uiAmountString: string;
          };
        }>;
      };
      const usdcAta = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        publicKey,
        false
      ).toBase58();
      const accountKeys = (tx.compileMessage().accountKeys ?? []).map((k) =>
        k.toBase58()
      );

      const findAmount = (
        arr: typeof value.preTokenBalances
      ): number => {
        for (const entry of arr ?? []) {
          const addr = accountKeys[entry.accountIndex];
          if (addr === usdcAta && entry.mint === DEVNET_USDC_MINT.toBase58()) {
            return Number(entry.uiTokenAmount.uiAmount ?? 0);
          }
        }
        return 0;
      };
      const preAmt = findAmount(value.preTokenBalances);
      const postAmt = findAmount(value.postTokenBalances);

      const preview: SimPreview = {
        usdcDelta: postAmt - preAmt,
        err: value.err
          ? typeof value.err === "string"
            ? value.err
            : JSON.stringify(value.err)
          : null,
      };
      simCacheRef.current = { key: cacheKey, value: preview };
      setSim(preview);
    } catch (err) {
      console.error("claim simulation failed", err);
      setSim({
        usdcDelta: 0,
        err: err instanceof Error ? err.message : "Simulation failed",
      });
    } finally {
      setSimLoading(false);
    }
  }, [connected, program, publicKey, connection, target, claimableRaw]);

  useEffect(() => {
    if (!open) {
      simCacheRef.current = null;
      setSim(null);
      return;
    }
    void simulate();
  }, [open, simulate]);

  async function onConfirm() {
    if (!connected || !program || !publicKey) {
      toast.error("Connect a Solana wallet first");
      login();
      return;
    }
    if (sim?.err) {
      toast.error("Simulation failed", { description: sim.err });
      return;
    }
    setSubmitting(true);
    try {
      let tx;
      if (target.kind === "project") {
        tx = await buildClaimProjectReturns({
          program,
          investor: publicKey,
          projectPda: new PublicKey(target.pda),
          usdcVault: new PublicKey(target.usdcVault),
          usdcMint: DEVNET_USDC_MINT,
        });
      } else {
        tx = await buildClaimPoolReturns({
          program,
          investor: publicKey,
          poolPda: new PublicKey(target.pda),
          usdcVault: new PublicKey(target.usdcVault),
          usdcMint: DEVNET_USDC_MINT,
        });
      }
      const sig = await signAndSend(tx);

      try {
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature: sig, ...latest },
          "confirmed"
        );
      } catch (confirmErr) {
        console.warn("confirmTransaction post-claim warning", confirmErr);
      }

      // Record investor-side tx so portfolio history updates on the next
      // router.refresh() without waiting for a signature indexer. Token
      // amount is intentionally null for claims (USDC-only movement).
      try {
        await fetch("/api/investor/transactions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            txSig: sig,
            txType: target.kind === "project" ? "claim_project" : "claim_pool",
            ...(target.kind === "project"
              ? { projectId: target.id }
              : { poolId: target.id }),
            amountUsdc: claimableRaw,
            walletPubkey: walletAddress ?? publicKey.toBase58(),
          }),
        });
      } catch (recErr) {
        console.warn("record investor claim tx failed", recErr);
      }

      await triggerIndexerSync();
      router.refresh();

      toast.success("Claim confirmed", {
        description: (
          <a
            href={explorerTx(sig)}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 underline"
          >
            View on explorer <ExternalLink className="size-3" />
          </a>
        ),
      });
      onSuccess?.(sig);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Claim failed";
      toast.error("Claim failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const showSim = !!sim && !sim.err;
  const simErr = sim?.err ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-1">
        <DialogHeader>
          <DialogTitle>Claim distributions</DialogTitle>
          <DialogDescription>
            Withdraw pending USDC distributions from {target.name} to your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-line/80 bg-bg-2/50 p-4 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-muted">
            Claimable
          </p>
          <p className="mono-num mt-1 text-3xl font-medium text-green">
            {fmtUsdc(claimableRaw)}
          </p>
        </div>

        <div className="rounded-lg border border-line/80 bg-bg-2/50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-fg-muted">You receive</span>
            <span className="mono-num text-green inline-flex items-center gap-1.5">
              {simLoading && !showSim ? (
                <Loader2 className="size-3 animate-spin text-fg-muted" />
              ) : null}
              {showSim
                ? fmtUsdc(
                    BigInt(
                      Math.round(Math.max(0, sim!.usdcDelta) * 1_000_000)
                    ).toString()
                  )
                : fmtUsdc(claimableRaw)}
            </span>
          </div>
          {showSim ? (
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-fg-muted">
              Simulated on-chain preview
            </p>
          ) : null}
        </div>

        {simErr ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Simulation failed</p>
              <p className="mt-0.5 text-xs opacity-80 break-words">{simErr}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              submitting || simLoading || !!simErr || claimableRaw === "0"
            }
            onClick={onConfirm}
          >
            {submitting ? "Signing…" : "Confirm claim"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
