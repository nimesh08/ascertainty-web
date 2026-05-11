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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NumericInput } from "@/components/admin/numeric-input";
import { StickyActionBar } from "@/components/admin/sticky-action-bar";

import { useAdminTx } from "@/lib/admin/use-admin-tx";
import { buildDistributePoolReturns } from "@/lib/solana/tx/sweepPool";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { explorerTx, fmtUsdc } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

const schema = z.object({
  amountUsdc: z.coerce.number().positive().max(1_000_000),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export interface SweepFormProps {
  poolId: string;
  poolName: string;
  poolOnchainPda: string | null;
  usdcVault: string | null;
  tokensSoldRaw: string;
  cumulativePerTokenRaw: string;
}

export function SweepForm(props: SweepFormProps) {
  const router = useRouter();
  const { program, wallet, signAndSend, connection, ready } = useAdminTx();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { amountUsdc: 0 },
  });
  const amountHuman = form.watch("amountUsdc") as number | string | undefined;

  useEffect(() => {
    if (!ready || !wallet) return;
    let cancelled = false;
    const ata = getAssociatedTokenAddressSync(DEVNET_USDC_MINT, wallet, false);
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
    if (!Number.isFinite(n) || !n || (n as number) <= 0) return 0n;
    return BigInt(Math.round((n as number) * 1_000_000));
  }, [amountHuman]);

  const insufficient = balance !== null && amountRaw > balance;

  const tokensSold = BigInt(props.tokensSoldRaw);
  const PRECISION = 1_000_000_000_000n;
  const deltaPerToken =
    tokensSold > 0n ? (amountRaw * PRECISION) / tokensSold : 0n;
  const newPerToken = BigInt(props.cumulativePerTokenRaw) + deltaPerToken;

  async function onSubmit(values: FormOutput) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    if (!props.poolOnchainPda || !props.usdcVault) {
      toast.error("On-chain addresses missing");
      return;
    }
    setBusy(true);
    try {
      const raw = BigInt(Math.round(values.amountUsdc * 1_000_000));
      const tx = await buildDistributePoolReturns({
        program,
        admin: wallet,
        poolPda: new PublicKey(props.poolOnchainPda),
        usdcVault: new PublicKey(props.usdcVault),
        usdcMint: DEVNET_USDC_MINT,
        amountUsdc: raw,
      });
      const sig = await signAndSend(tx);
      await fetch("/api/admin/pools/sweep", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          poolId: props.poolId,
          amountUsdcRaw: raw.toString(),
          signature: sig,
        }),
      });
      void triggerIndexerSync();
      toast.success("Sweep sent", {
        description: `${fmtUsdc(raw.toString())} deposited to ${props.poolName}.`,
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.push(`/admin/pools/${props.poolId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Sweep failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 pb-24 md:grid-cols-2 md:pb-0"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sweep amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="amountUsdc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USDC to distribute</FormLabel>
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
                    {balance === null
                      ? "loading…"
                      : fmtUsdc(balance.toString())}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {insufficient ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>Balance is below the requested amount.</span>
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
              <span className="text-fg-muted">Pool tokens outstanding</span>
              <span>{fmtUsdc(tokensSold.toString())}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">cumulativePerToken now</span>
              <span>{props.cumulativePerTokenRaw}</span>
            </div>
            <div className="mono-num flex justify-between">
              <span className="text-fg-muted">Δ per token</span>
              <span className="text-magenta">+{deltaPerToken.toString()}</span>
            </div>
            <div className="mono-num flex justify-between border-t border-line/60 pt-2 font-medium">
              <span>After</span>
              <span>{newPerToken.toString()}</span>
            </div>
          </CardContent>
        </Card>

        <StickyActionBar className="md:col-span-2">
          <Button asChild variant="outline" type="button" disabled={busy}>
            <Link href={`/admin/pools/${props.poolId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={busy || !ready || insufficient || amountRaw === 0n}
            className="gap-1.5 min-w-[160px]"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Sign & sweep
          </Button>
        </StickyActionBar>
      </form>
    </Form>
  );
}
