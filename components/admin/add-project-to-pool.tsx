"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAdminTx } from "@/lib/admin/use-admin-tx";
import { buildAddProjectToPool } from "@/lib/solana/tx/sweepPool";
import { fmtUsdc, explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

export interface ProjectOption {
  id: string;
  msmeName: string;
  sector: string;
  onchainPda: string | null;
  status: string;
  targetUsdc: string;
}

export function AddProjectToPoolPicker({
  poolId,
  poolOnchainPda,
  projects,
}: {
  poolId: string;
  poolOnchainPda: string | null;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const { program, wallet, signAndSend, ready } = useAdminTx();
  const [selected, setSelected] = useState<string | "">("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const picked = useMemo(
    () => projects.find((p) => p.id === selected) ?? null,
    [selected, projects]
  );

  async function confirm() {
    if (!picked) return;
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    if (!poolOnchainPda || !picked.onchainPda) {
      toast.error("On-chain PDA missing");
      return;
    }
    setBusy(true);
    try {
      const { tx } = await buildAddProjectToPool({
        program,
        admin: wallet,
        poolPda: new PublicKey(poolOnchainPda),
        projectPda: new PublicKey(picked.onchainPda),
      });
      const sig = await signAndSend(tx);
      await fetch("/api/admin/pools/add-project", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          poolId,
          projectId: picked.id,
          signature: sig,
        }),
      });
      void triggerIndexerSync();
      toast.success(`${picked.msmeName} added to pool`, {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      setOpen(false);
      setSelected("");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add project", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="size-4" /> Add project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project to pool</DialogTitle>
          <DialogDescription>
            Links an existing on-chain project to this pool. Investors
            subscribing to the pool will share in its repayments.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No projects available
                </SelectItem>
              ) : (
                projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.msmeName} — {fmtUsdc(p.targetUsdc)} · {p.status}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {picked ? (
            <p className="text-xs text-fg-muted">
              Sector:{" "}
              <span className="capitalize text-fg/80">{picked.sector}</span>
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            onClick={confirm}
            disabled={!picked || busy || !ready}
            className="gap-1.5"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add & sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
