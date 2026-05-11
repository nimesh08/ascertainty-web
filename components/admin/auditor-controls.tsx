"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { useAdminTx } from "@/lib/admin/use-admin-tx";
import { buildAddAuditor } from "@/lib/solana/tx/addAuditor";
import { addAuditorSchema, type AddAuditorInput } from "@/lib/utils/validation";
import { explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

export function AddAuditorDialog() {
  const router = useRouter();
  const { program, wallet, signAndSend, ready } = useAdminTx();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<AddAuditorInput>({
    resolver: zodResolver(addAuditorSchema),
    defaultValues: { walletPubkey: "", name: "", certification: "" },
  });

  async function onSubmit(values: AddAuditorInput) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    setBusy(true);
    try {
      const tx = await buildAddAuditor({
        program,
        admin: wallet,
        auditorWallet: new PublicKey(values.walletPubkey),
        name: values.name,
        certification: values.certification,
      });
      const sig = await signAndSend(tx);
      await fetch("/api/admin/auditors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, signature: sig }),
      });
      void triggerIndexerSync();
      toast.success("Auditor added", {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add auditor", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="size-4" /> Add auditor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add auditor</DialogTitle>
          <DialogDescription>
            Whitelists a Solana wallet as an MRV auditor. They’ll be able to
            submit baselines and verifications.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="add-auditor-form"
          >
            <FormField
              control={form.control}
              name="walletPubkey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet address</FormLabel>
                  <FormControl>
                    <Input className="mono-num" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Audit Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification</FormLabel>
                  <FormControl>
                    <Input placeholder="BEE / ISO 50001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="submit"
            form="add-auditor-form"
            disabled={busy || !ready}
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

export function AuditorActiveToggle({
  walletPubkey,
  initial,
}: {
  walletPubkey: string;
  initial: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function onChange(next: boolean) {
    setChecked(next);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/auditors", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletPubkey, isActive: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(next ? "Auditor activated" : "Auditor deactivated", {
        description:
          "Off-chain flag only — on-chain registry state is unchanged.",
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      setChecked(!next);
      toast.error("Update failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Checkbox
      checked={checked}
      disabled={busy}
      onCheckedChange={(v) => onChange(Boolean(v))}
      aria-label={checked ? "Active" : "Inactive"}
    />
  );
}
