"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/admin/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { StickyActionBar } from "@/components/admin/sticky-action-bar";

import { createPoolSchema } from "@/lib/utils/validation";
import { useAdminTx } from "@/lib/admin/use-admin-tx";
import { buildCreatePool } from "@/lib/solana/tx/sweepPool";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";
import type { z } from "zod";

type PoolInput = z.input<typeof createPoolSchema>;
type PoolOutput = z.output<typeof createPoolSchema>;

export function NewPoolForm() {
  const router = useRouter();
  const { program, wallet, signAndSend, ready } = useAdminTx();
  const [busy, setBusy] = useState(false);

  const form = useForm<PoolInput, unknown, PoolOutput>({
    resolver: zodResolver(createPoolSchema),
    defaultValues: { name: "", description: "", targetUsdc: 0 },
  });

  async function onSubmit(values: PoolOutput) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    setBusy(true);
    try {
      const poolId = Date.now();
      const usdcRaw = BigInt(Math.round(values.targetUsdc * 1_000_000));
      const built = await buildCreatePool({
        program,
        admin: wallet,
        poolId,
        targetUsdc: usdcRaw,
        usdcMint: DEVNET_USDC_MINT,
      });
      const sig = await signAndSend(built.tx, built.signers);
      const res = await fetch("/api/admin/pools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          onchainPoolId: poolId.toString(),
          name: values.name,
          description: values.description ?? "",
          targetUsdc: usdcRaw.toString(),
          poolPda: built.poolPda.toBase58(),
          poolTokenMint: built.poolTokenMintKp.publicKey.toBase58(),
          usdcVault: built.usdcVault.toBase58(),
          signature: sig,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { poolId: string };
      void triggerIndexerSync();
      toast.success("Pool created", {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.push(`/admin/pools/${data.poolId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create pool", {
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
        className="space-y-6 pb-24 md:pb-0"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pool details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tirupur Textiles 2026 Q2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Diversified pool of textile MSMEs..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetUsdc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target (USDC)</FormLabel>
                  <FormControl>
                    <NumericInput
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={0}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Aggregate raise target. Underlying projects added after
                    pool creation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <StickyActionBar>
          <Button
            type="button"
            variant="outline"
            onClick={() => history.back()}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !ready} className="min-w-[120px]">
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing…
              </>
            ) : (
              "Create pool"
            )}
          </Button>
        </StickyActionBar>
      </form>
    </Form>
  );
}
