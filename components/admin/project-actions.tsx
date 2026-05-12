"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Zap, Send, CheckCircle2, ArrowUpFromLine } from "lucide-react";
import { PublicKey } from "@solana/web3.js";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useAdminTx } from "@/lib/admin/use-admin-tx";
import { buildActivateProject } from "@/lib/solana/tx/activateProject";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { explorerTx, fmtUsdc } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

export interface AdminProjectActionsProps {
  projectId: string;
  status: string;
  onchainProjectPda: string | null;
  tokenMint: string | null;
  usdcVault: string | null;
  tokensSoldRaw: string;
  targetUsdcRaw: string;
  totalDistributedRaw: string;
  treasuryWallet?: string | null;
}

export function AdminProjectActions(props: AdminProjectActionsProps) {
  const router = useRouter();
  const { program, wallet, signAndSend, ready } = useAdminTx();
  const [busy, setBusy] = useState(false);

  const canActivate =
    props.status === "funding" &&
    BigInt(props.tokensSoldRaw) >= BigInt(props.targetUsdcRaw) &&
    BigInt(props.targetUsdcRaw) > 0n;
  const canDisperse =
    props.status === "active" || props.status === "repaying";
  const canClose =
    props.status === "repaying" &&
    BigInt(props.totalDistributedRaw) >= BigInt(props.targetUsdcRaw);

  async function activate() {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    if (!props.onchainProjectPda || !props.usdcVault) {
      toast.error("On-chain addresses missing — re-sync the project.");
      return;
    }
    setBusy(true);
    try {
      const tx = await buildActivateProject({
        program,
        admin: wallet,
        treasury: new PublicKey(props.treasuryWallet ?? wallet.toBase58()),
        projectPda: new PublicKey(props.onchainProjectPda),
        usdcVault: new PublicKey(props.usdcVault),
        usdcMint: DEVNET_USDC_MINT,
      });
      const sig = await signAndSend(tx);
      void triggerIndexerSync();
      toast.success("Project activated", {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Activation failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  const feeEstimate =
    (BigInt(props.targetUsdcRaw) * 150n) / 10_000n; // 1.5% of target

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            disabled={!canActivate || busy}
            className="gap-1.5"
            variant="default"
          >
            <Zap className="size-4" /> Activate
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate project?</DialogTitle>
            <DialogDescription>
              This opens the vault and sends funds to the MSME. A 1.5%
              origination fee will be deducted up-front.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-line/70 bg-bg-2/60 p-3 text-sm">
            <div className="mono-num flex justify-between py-1">
              <span className="text-fg-muted">Target raise</span>
              <span>{fmtUsdc(props.targetUsdcRaw)}</span>
            </div>
            <div className="mono-num flex justify-between py-1">
              <span className="text-fg-muted">Origination fee (1.5%)</span>
              <span className="text-accent">
                −{fmtUsdc(feeEstimate.toString())}
              </span>
            </div>
            <div className="mono-num flex justify-between border-t border-line/60 pt-2 font-medium">
              <span>Net to MSME</span>
              <span>
                {fmtUsdc(
                  (
                    BigInt(props.targetUsdcRaw) - feeEstimate
                  ).toString()
                )}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={activate} disabled={busy} className="gap-1.5">
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              Confirm activation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        asChild
        disabled={!canDisperse}
        variant="outline"
        className="gap-1.5"
      >
        <Link
          href={canDisperse ? `/admin/projects/${props.projectId}/disperse` : "#"}
        >
          <Send className="size-4" /> Disperse
        </Link>
      </Button>

      <Button
        size="sm"
        asChild
        variant="outline"
        className="gap-1.5"
      >
        <Link href={`/admin/projects/${props.projectId}/withdraw`}>
          <ArrowUpFromLine className="size-4" /> Withdraw funds
        </Link>
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={!canClose || busy}
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <CheckCircle2 className="size-4" /> Close
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close project?</DialogTitle>
            <DialogDescription>
              V1: closing is a UI-only action; it marks the project inactive in
              the off-chain DB. On-chain, investors continue claiming from the
              cumulative distribution state. This action can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() =>
                toast.info("Close flow will ship in V1.1", {
                  description: "Contract support pending.",
                })
              }
            >
              I understand — close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
