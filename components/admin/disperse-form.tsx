"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

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
import { buildDistributeRepayment } from "@/lib/solana/tx/distributeRepayment";
import { StickyActionBar } from "@/components/admin/sticky-action-bar";
import { explorerTx, fmtUsdc } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

const schema = z.object({
  amountUsdc: z.coerce.number().positive().max(1_000_000),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export interface DisperseFormProps {
  projectId: string;
  msmeName: string;
  onchainPda: string | null;
  usdcVault: string | null;
  tokensSoldRaw: string;
  cumulativePerTokenRaw: string;
  eligibleHolders: number;
}

export function DisperseForm(props: DisperseFormProps) {
  const router = useRouter();
  const { program, wallet, signAndSend, connection, ready } = useAdminTx();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { amountUsdc: 0 },
  });
  const amountHuman = form.watch("amountUsdc") as number | string | undefined;

  useEffect(() => {
    if (!ready || !wallet) return;
    let cancelled = false;
    const ata = getAssociatedTokenAddressSync(
      DEVNET_USDC_MINT,
      wallet,
      false
    );
    getAccount(connection, ata)
      .then((acc) => {
        if (!cancelled) setBalance(acc.amount);
      })
      .catch(() => {
        if (!cancelled) setBalance(0n);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, wallet, connection]);

  const amountRaw = useMemo(() => {
    const n = typeof amountHuman === "string" ? parseFloat(amountHuman) : amountHuman;
    if (!Number.isFinite(n) || !n || n <= 0) return 0n;
    return BigInt(Math.round((n as number) * 1_000_000));
  }, [amountHuman]);

  const insufficient =
    balance !== null && amountRaw > 0n && amountRaw > balance;

  const tokensSold = BigInt(props.tokensSoldRaw);
  const currentPerToken = BigInt(props.cumulativePerTokenRaw);
  const PRECISION = 1_000_000_000_000n;
  const deltaPerToken =
    tokensSold > 0n ? (amountRaw * PRECISION) / tokensSold : 0n;
  const newPerToken = currentPerToken + deltaPerToken;
  const avgClaim =
    props.eligibleHolders > 0
      ? amountRaw / BigInt(props.eligibleHolders)
      : 0n;

  async function onConfirm(values: FormOutput) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    if (!props.onchainPda || !props.usdcVault) {
      toast.error("On-chain addresses missing");
      return;
    }
    setSubmitting(true);
    try {
      const raw = BigInt(Math.round(values.amountUsdc * 1_000_000));
      const tx = await buildDistributeRepayment({
        program,
        admin: wallet,
        projectPda: new PublicKey(props.onchainPda),
        usdcVault: new PublicKey(props.usdcVault),
        usdcMint: DEVNET_USDC_MINT,
        amountUsdc: raw,
      });
      const sig = await signAndSend(tx);

      await fetch("/api/admin/distributions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: props.projectId,
          amountUsdcRaw: raw.toString(),
          signature: sig,
        }),
      });
      void triggerIndexerSync();

      toast.success("Distribution sent", {
        description: `${fmtUsdc(raw.toString())} queued for ${props.msmeName}.`,
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.push(`/admin/projects/${props.projectId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Distribution failed", {
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
            <CardTitle className="text-base">Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amountUsdc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USDC to disperse</FormLabel>
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
                    Wallet balance:{" "}
                    {balance === null ? "loading…" : fmtUsdc(balance.toString())}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {insufficient ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Your USDC balance is below this amount. Top up or reduce the
                  disperse amount.
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
              <span className="text-fg-muted">Tokens sold</span>
              <span>{fmtUsdc(tokensSold.toString())}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Eligible holders</span>
              <span>{props.eligibleHolders}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">cumulativePerToken now</span>
              <span>{currentPerToken.toString()}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Δ per token</span>
              <span className="text-magenta">+{deltaPerToken.toString()}</span>
            </div>
            <div className="mono-num flex justify-between border-t border-line/60 pt-2">
              <span>cumulativePerToken after</span>
              <span>{newPerToken.toString()}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Avg claim / holder</span>
              <span>{fmtUsdc(avgClaim.toString())}</span>
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
                  insufficient ||
                  amountRaw === 0n ||
                  !form.formState.isValid
                }
                className="gap-1.5 min-w-[160px]"
              >
                <Send className="size-4" /> Review & sign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm distribution</DialogTitle>
                <DialogDescription>
                  You are about to disperse to {props.msmeName}. This
                  transaction is signed by your admin wallet.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-line/70 bg-bg-2/60 p-3 text-sm">
                <div className="mono-num flex justify-between py-1">
                  <span className="text-fg-muted">Amount</span>
                  <span>{fmtUsdc(amountRaw.toString())}</span>
                </div>
                <div className="mono-num flex justify-between py-1">
                  <span className="text-fg-muted">Avg / holder</span>
                  <span>{fmtUsdc(avgClaim.toString())}</span>
                </div>
                <div className="mono-num flex justify-between border-t border-line/60 pt-2 font-medium">
                  <span>Holders notified</span>
                  <span>{props.eligibleHolders}</span>
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
                    <Send className="size-4" />
                  )}
                  Sign & send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </StickyActionBar>
      </form>
    </Form>
  );
}
