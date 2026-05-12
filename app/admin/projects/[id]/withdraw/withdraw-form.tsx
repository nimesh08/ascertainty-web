"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2, ArrowUpFromLine } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { NumericInput } from "@/components/admin/numeric-input";
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
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { buildWithdrawProjectFunds } from "@/lib/solana/tx/withdrawProjectFunds";
import { StickyActionBar } from "@/components/admin/sticky-action-bar";
import { explorerTx, fmtUsdc } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

const schema = z.object({
  destination: z
    .string()
    .min(32, "Paste a base58 Solana wallet address.")
    .refine((v) => {
      try {
        new PublicKey(v);
        return true;
      } catch {
        return false;
      }
    }, "Not a valid Solana pubkey"),
  createDestinationAta: z.boolean(),
  amountUsdc: z.coerce.number().positive().max(10_000_000),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export interface WithdrawFormProps {
  projectId: string;
  msmeName: string;
  /** On-chain u64 project_id. Null if the project hasn't been synced yet. */
  onchainProjectId: bigint | null;
  onchainPda: string | null;
  usdcVault: string | null;
  status: string;
}

export function WithdrawForm(props: WithdrawFormProps) {
  const router = useRouter();
  const { wallet, signAndSend, connection, program, ready } = useAdminTx();
  const [vaultBalance, setVaultBalance] = useState<bigint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      destination: "",
      createDestinationAta: true,
      amountUsdc: 0,
    },
    mode: "onChange",
  });
  const amountHuman = form.watch("amountUsdc") as number | string | undefined;

  // Live vault balance — poll once on mount and whenever the vault address changes.
  useEffect(() => {
    if (!props.usdcVault) return;
    let cancelled = false;
    const vaultPk = (() => {
      try {
        return new PublicKey(props.usdcVault!);
      } catch {
        return null;
      }
    })();
    if (!vaultPk) return;
    getAccount(connection, vaultPk)
      .then((acc) => {
        if (!cancelled) setVaultBalance(acc.amount);
      })
      .catch(() => {
        if (!cancelled) setVaultBalance(0n);
      });
    return () => {
      cancelled = true;
    };
  }, [props.usdcVault, connection]);

  const amountRaw = useMemo(() => {
    const n =
      typeof amountHuman === "string" ? parseFloat(amountHuman) : amountHuman;
    if (!Number.isFinite(n) || !n || (n as number) <= 0) return 0n;
    return BigInt(Math.round((n as number) * 1_000_000));
  }, [amountHuman]);

  const overdraw =
    vaultBalance !== null && amountRaw > 0n && amountRaw > vaultBalance;
  const remainingAfter =
    vaultBalance !== null && amountRaw <= vaultBalance
      ? vaultBalance - amountRaw
      : null;

  const missingOnchain =
    !props.onchainPda || !props.usdcVault || props.onchainProjectId === null;

  async function onConfirm(values: FormOutput) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    if (missingOnchain) {
      toast.error("Project isn't fully synced on-chain yet.");
      return;
    }
    setSubmitting(true);
    try {
      const raw = BigInt(Math.round(values.amountUsdc * 1_000_000));
      const destinationOwner = new PublicKey(values.destination);

      const { tx, destinationAta } = await buildWithdrawProjectFunds({
        program,
        admin: wallet,
        projectId: props.onchainProjectId!,
        projectPda: new PublicKey(props.onchainPda!),
        usdcVault: new PublicKey(props.usdcVault!),
        usdcMint: DEVNET_USDC_MINT,
        destinationOwner,
        createDestinationAta: values.createDestinationAta,
        amountUsdc: raw,
      });

      const sig = await signAndSend(tx);

      await fetch("/api/admin/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: props.projectId,
          txSig: sig,
          amount: raw.toString(),
          destination: destinationOwner.toBase58(),
        }),
      });
      void triggerIndexerSync();

      toast.success("Withdrawal sent", {
        description: `${fmtUsdc(raw.toString())} sent to ${destinationAta
          .toBase58()
          .slice(0, 8)}… from ${props.msmeName}.`,
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.push(`/admin/projects/${props.projectId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Withdrawal failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form className="grid gap-4 pb-24 md:grid-cols-2 md:pb-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination wallet (owner pubkey)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 9xQ…base58"
                      autoComplete="off"
                      spellCheck={false}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Funds will be transferred to this wallet's USDC
                    associated-token-account. If the ATA doesn't exist, tick
                    the checkbox below to create it in the same transaction.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="createDestinationAta"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0 rounded-md border border-line/70 bg-bg-2/60 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Create destination ATA if it doesn't exist
                    </FormLabel>
                    <FormDescription>
                      Recommended. Idempotent — safe to leave on even if the
                      ATA already exists.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amountUsdc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USDC)</FormLabel>
                  <FormControl>
                    <NumericInput
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      placeholder="1000.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="mono-num">
                    Vault balance:{" "}
                    {vaultBalance === null
                      ? "loading…"
                      : fmtUsdc(vaultBalance.toString())}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {overdraw ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Amount exceeds vault balance. The on-chain program will
                  reject this transaction.
                </span>
              </div>
            ) : null}
            {missingOnchain ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Project isn't fully synced on-chain yet. Withdrawals are
                  disabled until on-chain PDA, vault, and project_id are
                  indexed.
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Project</span>
              <span>{props.msmeName}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Status</span>
              <span>{props.status}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">On-chain PDA</span>
              <span className="truncate max-w-[200px]" title={props.onchainPda ?? ""}>
                {props.onchainPda
                  ? `${props.onchainPda.slice(0, 6)}…${props.onchainPda.slice(-4)}`
                  : "—"}
              </span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Vault balance (live)</span>
              <span>
                {vaultBalance === null
                  ? "…"
                  : fmtUsdc(vaultBalance.toString())}
              </span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Amount to withdraw</span>
              <span className="text-accent">
                −{fmtUsdc(amountRaw.toString())}
              </span>
            </div>
            <div className="mono-num flex justify-between border-t border-line/60 pt-2">
              <span>Remaining after</span>
              <span>
                {remainingAfter === null
                  ? overdraw
                    ? "insufficient"
                    : "…"
                  : fmtUsdc(remainingAfter.toString())}
              </span>
            </div>
          </CardContent>
        </Card>

        <StickyActionBar className="md:col-span-2">
          <Button
            asChild
            type="button"
            variant="outline"
            disabled={submitting}
          >
            <Link href={`/admin/projects/${props.projectId}`}>Cancel</Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={
                  submitting ||
                  !ready ||
                  overdraw ||
                  amountRaw === 0n ||
                  missingOnchain ||
                  !form.formState.isValid
                }
                className="gap-1.5 min-w-[160px]"
              >
                <ArrowUpFromLine className="size-4" /> Review & sign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm withdrawal</DialogTitle>
                <DialogDescription>
                  You are about to move USDC out of the {props.msmeName} vault
                  to an arbitrary destination. This is a privileged operation
                  — verify the destination pubkey carefully.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-line/70 bg-bg-2/60 p-3 text-sm">
                <div className="mono-num flex justify-between py-1">
                  <span className="text-fg-muted">Destination owner</span>
                  <span
                    className="truncate max-w-[220px]"
                    title={form.getValues("destination") || ""}
                  >
                    {form.getValues("destination") || "—"}
                  </span>
                </div>
                <div className="mono-num flex justify-between py-1">
                  <span className="text-fg-muted">Amount</span>
                  <span>{fmtUsdc(amountRaw.toString())}</span>
                </div>
                <div className="mono-num flex justify-between py-1">
                  <span className="text-fg-muted">Create ATA?</span>
                  <span>
                    {form.getValues("createDestinationAta") ? "yes" : "no"}
                  </span>
                </div>
                <div className="mono-num flex justify-between border-t border-line/60 pt-2 font-medium">
                  <span>Vault remaining after</span>
                  <span>
                    {remainingAfter === null
                      ? "—"
                      : fmtUsdc(remainingAfter.toString())}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={form.handleSubmit(onConfirm)}
                  disabled={submitting}
                  className="gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUpFromLine className="size-4" />
                  )}
                  Sign &amp; send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </StickyActionBar>
      </form>
    </Form>
  );
}
