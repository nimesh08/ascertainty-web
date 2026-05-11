"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { buyTokensSchema } from "@/lib/utils/validation";
import { useInvestor } from "@/lib/hooks/use-investor";
import {
  buildBuyProjectTokens,
  buildBuyPoolTokens,
} from "@/lib/solana/tx";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { fmtNumber, fmtUsdc, explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

const buyFormSchema = z.object({
  amountUsdc: z
    .string()
    .min(1, "Amount required")
    .refine((v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n > 0 && n <= 1_000_000;
    }, "Enter a valid amount"),
});
type BuyFormValues = z.infer<typeof buyFormSchema>;

void buyTokensSchema;

export interface BuyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target:
    | {
        kind: "project";
        id: string;
        name: string;
        pda: string;
        tokenMint: string;
        usdcVault: string;
      }
    | {
        kind: "pool";
        id: string;
        name: string;
        pda: string;
        poolTokenMint: string;
        usdcVault: string;
      };
  onSuccess?: (signature: string) => void;
}

interface SimPreview {
  usdcDelta: number; // negative = debit
  tokenDelta: number; // positive = received
  tokenDecimals: number;
  err: string | null;
  logs?: string[];
}

export function BuyModal({ open, onOpenChange, target, onSuccess }: BuyModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [sim, setSim] = useState<SimPreview | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const { connected, program, publicKey, walletAddress, connection, signAndSend, login } =
    useInvestor();
  const router = useRouter();

  const form = useForm<BuyFormValues>({
    resolver: zodResolver(buyFormSchema),
    defaultValues: { amountUsdc: "10" },
  });

  const amount = form.watch("amountUsdc");
  const previewTokens = useMemo(() => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  // Cache key: (target pda, amount-raw). Skip re-simulating for same input.
  const simCacheRef = useRef<{ key: string; value: SimPreview } | null>(null);

  const tokenMint =
    target.kind === "project" ? target.tokenMint : target.poolTokenMint;

  const simulate = useCallback(
    async (amountUsdcStr: string) => {
      if (!connected || !program || !publicKey) return;
      const n = parseFloat(amountUsdcStr);
      if (!Number.isFinite(n) || n <= 0) {
        setSim(null);
        return;
      }
      const amountRaw = BigInt(Math.round(n * 1_000_000));
      const cacheKey = `${target.pda}:${amountRaw.toString()}`;
      if (simCacheRef.current?.key === cacheKey) {
        setSim(simCacheRef.current.value);
        return;
      }

      setSimLoading(true);
      try {
        let tx: Transaction;
        if (target.kind === "project") {
          tx = await buildBuyProjectTokens({
            program,
            investor: publicKey,
            projectPda: new PublicKey(target.pda),
            tokenMint: new PublicKey(target.tokenMint),
            usdcVault: new PublicKey(target.usdcVault),
            usdcMint: DEVNET_USDC_MINT,
            amountUsdc: amountRaw,
          });
        } else {
          tx = await buildBuyPoolTokens({
            program,
            investor: publicKey,
            poolPda: new PublicKey(target.pda),
            poolTokenMint: new PublicKey(target.poolTokenMint),
            usdcVault: new PublicKey(target.usdcVault),
            usdcMint: DEVNET_USDC_MINT,
            amountUsdc: amountRaw,
          });
        }
        tx.feePayer = publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        // Build a VersionedTransaction so we can pass SimulateTransactionConfig
        // (the legacy `Transaction` overload doesn't accept sigVerify/replaceRecentBlockhash).
        const vtx = new VersionedTransaction(tx.compileMessage());

        const res = await connection.simulateTransaction(vtx, {
          sigVerify: false,
          replaceRecentBlockhash: true,
        });
        // web3.js's SimulatedTransactionResponse TS type omits pre/post token
        // balances, but they're returned by the RPC at runtime.
        const value = res.value as typeof res.value & {
          preTokenBalances?: Array<{
            accountIndex: number;
            mint: string;
            owner?: string;
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
            owner?: string;
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
        const tokenAta = getAssociatedTokenAddressSync(
          new PublicKey(tokenMint),
          publicKey,
          false
        ).toBase58();

        const pre = value.preTokenBalances ?? [];
        const post = value.postTokenBalances ?? [];
        const accountKeys = (tx.compileMessage().accountKeys ?? []).map((k) =>
          k.toBase58()
        );

        const find = (
          arr: typeof pre,
          ata: string,
          mint: string
        ): { amount: number; decimals: number } => {
          for (const entry of arr) {
            const addr = accountKeys[entry.accountIndex];
            if (addr === ata && entry.mint === mint) {
              return {
                amount: Number(entry.uiTokenAmount.uiAmount ?? 0),
                decimals: entry.uiTokenAmount.decimals,
              };
            }
          }
          return { amount: 0, decimals: 6 };
        };

        const preUsdc = find(pre, usdcAta, DEVNET_USDC_MINT.toBase58());
        const postUsdc = find(post, usdcAta, DEVNET_USDC_MINT.toBase58());
        const preTok = find(pre, tokenAta, tokenMint);
        const postTok = find(post, tokenAta, tokenMint);

        const preview: SimPreview = {
          usdcDelta: postUsdc.amount - preUsdc.amount,
          tokenDelta: postTok.amount - preTok.amount,
          tokenDecimals: postTok.decimals || preTok.decimals || 6,
          err: value.err
            ? typeof value.err === "string"
              ? value.err
              : JSON.stringify(value.err)
            : null,
          logs: value.logs ?? undefined,
        };
        simCacheRef.current = { key: cacheKey, value: preview };
        setSim(preview);
      } catch (err) {
        console.error("simulation failed", err);
        setSim({
          usdcDelta: 0,
          tokenDelta: 0,
          tokenDecimals: 6,
          err:
            err instanceof Error ? err.message : "Simulation failed",
        });
      } finally {
        setSimLoading(false);
      }
    },
    [connected, program, publicKey, connection, target, tokenMint]
  );

  // Debounced simulation on amount change while open.
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      void simulate(amount);
    }, 400);
    return () => clearTimeout(handle);
  }, [open, amount, simulate]);

  // Reset cache when target changes or modal closes.
  useEffect(() => {
    if (!open) {
      simCacheRef.current = null;
      setSim(null);
    }
  }, [open, target.pda]);

  async function onSubmit(values: BuyFormValues) {
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
      const amountRaw = BigInt(
        Math.round(parseFloat(values.amountUsdc) * 1_000_000)
      );
      let tx;
      if (target.kind === "project") {
        tx = await buildBuyProjectTokens({
          program,
          investor: publicKey,
          projectPda: new PublicKey(target.pda),
          tokenMint: new PublicKey(target.tokenMint),
          usdcVault: new PublicKey(target.usdcVault),
          usdcMint: DEVNET_USDC_MINT,
          amountUsdc: amountRaw,
        });
      } else {
        tx = await buildBuyPoolTokens({
          program,
          investor: publicKey,
          poolPda: new PublicKey(target.pda),
          poolTokenMint: new PublicKey(target.poolTokenMint),
          usdcVault: new PublicKey(target.usdcVault),
          usdcMint: DEVNET_USDC_MINT,
          amountUsdc: amountRaw,
        });
      }
      const sig = await signAndSend(tx);

      // Best-effort confirmation — Privy-sent txs include preflight; this
      // await is "extra" durability so DB reads after refresh see the tx.
      try {
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          { signature: sig, ...latest },
          "confirmed"
        );
      } catch (confirmErr) {
        console.warn("confirmTransaction post-send warning", confirmErr);
      }

      // Record the investor-side tx row so /portfolio history reflects it
      // without relying on a signature-aware indexer. Best-effort; swallow
      // failures so we never block the success toast / UI refresh.
      try {
        const tokenDeltaRaw =
          sim && sim.tokenDelta > 0
            ? BigInt(
                Math.round(sim.tokenDelta * Math.pow(10, sim.tokenDecimals))
              ).toString()
            : undefined;
        await fetch("/api/investor/transactions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            txSig: sig,
            txType: target.kind === "project" ? "buy_project" : "buy_pool",
            ...(target.kind === "project"
              ? { projectId: target.id }
              : { poolId: target.id }),
            amountUsdc: amountRaw.toString(),
            tokenAmount: tokenDeltaRaw,
            walletPubkey: walletAddress ?? publicKey.toBase58(),
          }),
        });
      } catch (recErr) {
        console.warn("record investor tx failed", recErr);
      }

      await triggerIndexerSync();
      router.refresh();

      toast.success("Investment confirmed", {
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
      form.reset({ amountUsdc: "10" });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error("Investment failed", { description: msg });
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
          <DialogTitle>Invest in {target.name}</DialogTitle>
          <DialogDescription>
            USDC on Solana devnet. You&apos;ll receive{" "}
            {target.kind === "project" ? "project" : "pool"} tokens proportional
            to your contribution.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amountUsdc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USDC)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputMode="decimal"
                      placeholder="10"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-line/80 bg-bg-2/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">You pay</span>
                <span className="mono-num text-fg inline-flex items-center gap-1.5">
                  {simLoading && !showSim ? (
                    <Loader2 className="size-3 animate-spin text-fg-muted" />
                  ) : null}
                  {showSim
                    ? fmtUsdc(
                        BigInt(
                          Math.round(Math.abs(sim!.usdcDelta) * 1_000_000)
                        ).toString()
                      )
                    : fmtUsdc(
                        BigInt(
                          Math.round(Number(amount || "0") * 1_000_000)
                        ).toString()
                      )}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-fg-muted">You receive</span>
                <span className="mono-num text-green inline-flex items-center gap-1.5">
                  {simLoading && !showSim ? (
                    <Loader2 className="size-3 animate-spin text-fg-muted" />
                  ) : null}
                  {showSim
                    ? `${fmtNumber(sim!.tokenDelta, 2)} tokens`
                    : `${previewTokens.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} tokens`}
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
                  <p className="mt-0.5 text-xs opacity-80 break-words">
                    {simErr}
                  </p>
                  <p className="mt-1 text-xs opacity-70">
                    Change the amount or check your balance and try again.
                  </p>
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
                type="submit"
                disabled={submitting || simLoading || !!simErr}
              >
                {submitting ? "Signing…" : "Confirm invest"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
