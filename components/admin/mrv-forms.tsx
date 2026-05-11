"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import BN from "bn.js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/admin/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAdminTx } from "@/lib/admin/use-admin-tx";
import {
  buildSubmitBaseline,
  buildSubmitVerification,
  buildAttestVerification,
} from "@/lib/solana/tx/mrv";
import { findMrvProjectPda } from "@/lib/solana/pda";
import { explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";

export interface MrvProjectOption {
  id: string;
  onchainProjectId: string | null;
  msmeName: string;
  baselineSubmitted: boolean;
  verificationCount: number;
}

export interface PendingVerification {
  verificationId: string;
  mrvId: string;
  mrvLabel: string;
  index: number;
  onchainProjectId: string;
}

const hex32 = z
  .string()
  .regex(/^[0-9a-fA-F]{64}$/, "Must be 64 hex chars (SHA-256)");

const baselineSchema = z.object({
  mrvId: z.string().min(1, "Pick a project"),
  energyKwhPerYear: z.coerce.number().positive(),
  fuelType: z.string().min(1),
  costInrPerYear: z.coerce.number().positive(),
  co2TonsPerYear: z.coerce.number().positive(),
  reportHash: hex32,
});

const verificationSchema = z.object({
  mrvId: z.string().min(1, "Pick a project"),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  kwhSaved: z.coerce.number().positive(),
  costSavedInr: z.coerce.number().positive(),
  co2Tons: z.coerce.number().positive(),
  savingsBps: z.coerce.number().int().min(-10000).max(10000),
  reportHash: hex32,
});

type BaselineInput = z.input<typeof baselineSchema>;
type BaselineValues = z.output<typeof baselineSchema>;
type VerificationInput = z.input<typeof verificationSchema>;
type VerificationValues = z.output<typeof verificationSchema>;

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

export function MrvForms({
  mrvProjects,
  pendingVerifications,
}: {
  mrvProjects: MrvProjectOption[];
  pendingVerifications: PendingVerification[];
}) {
  const router = useRouter();
  const { program, wallet, signAndSend, ready } = useAdminTx();
  const [busy, setBusy] = useState<string | null>(null);

  const baselineForm = useForm<BaselineInput, unknown, BaselineValues>({
    resolver: zodResolver(baselineSchema),
    defaultValues: {
      mrvId: "",
      energyKwhPerYear: 0,
      fuelType: "diesel",
      costInrPerYear: 0,
      co2TonsPerYear: 0,
      reportHash: "",
    },
  });

  const verificationForm = useForm<
    VerificationInput,
    unknown,
    VerificationValues
  >({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      mrvId: "",
      periodStart: "",
      periodEnd: "",
      kwhSaved: 0,
      costSavedInr: 0,
      co2Tons: 0,
      savingsBps: 0,
      reportHash: "",
    },
  });

  function findMrv(mrvId: string): MrvProjectOption | null {
    return mrvProjects.find((p) => p.id === mrvId) ?? null;
  }

  async function onSubmitBaseline(values: BaselineValues) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    const mrv = findMrv(values.mrvId);
    if (!mrv?.onchainProjectId) {
      toast.error("MRV project has no on-chain id yet.");
      return;
    }
    setBusy("baseline");
    try {
      const [mrvPda] = findMrvProjectPda(new BN(mrv.onchainProjectId));
      const tx = await buildSubmitBaseline({
        program,
        auditor: wallet,
        mrvPda,
        energyKwhPerYear: BigInt(Math.round(values.energyKwhPerYear)),
        fuelType: values.fuelType,
        costInrPerYear: BigInt(Math.round(values.costInrPerYear)),
        co2TonsPerYearX100: BigInt(Math.round(values.co2TonsPerYear * 100)),
        reportHash: hexToBytes(values.reportHash),
      });
      const sig = await signAndSend(tx);
      await fetch("/api/admin/mrv", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "baseline",
          mrvId: values.mrvId,
          auditorWallet: wallet.toBase58(),
          signature: sig,
          energyKwhPerYear: Math.round(values.energyKwhPerYear).toString(),
          fuelType: values.fuelType,
          reportHashHex: values.reportHash,
        }),
      });
      void triggerIndexerSync();
      toast.success("Baseline submitted", {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      baselineForm.reset();
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit baseline", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  }

  async function onSubmitVerification(values: VerificationValues) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    const mrv = findMrv(values.mrvId);
    if (!mrv?.onchainProjectId) {
      toast.error("MRV project has no on-chain id yet.");
      return;
    }
    setBusy("verification");
    try {
      const [mrvPda] = findMrvProjectPda(new BN(mrv.onchainProjectId));
      const startMs = new Date(values.periodStart).getTime();
      const endMs = new Date(values.periodEnd).getTime();
      const nextIndex = mrv.verificationCount;
      const tx = await buildSubmitVerification({
        program,
        auditor: wallet,
        mrvPda,
        index: nextIndex,
        periodStart: BigInt(Math.floor(startMs / 1000)),
        periodEnd: BigInt(Math.floor(endMs / 1000)),
        energyKwhSaved: BigInt(Math.round(values.kwhSaved)),
        costInrSaved: BigInt(Math.round(values.costSavedInr * 100)),
        co2TonsAvoidedX100: BigInt(Math.round(values.co2Tons * 100)),
        savingsVsExpectedBps: values.savingsBps,
        reportHash: hexToBytes(values.reportHash),
      });
      const sig = await signAndSend(tx);
      await fetch("/api/admin/mrv", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "verification",
          mrvId: values.mrvId,
          signature: sig,
          auditorWallet: wallet.toBase58(),
          periodStartMs: startMs,
          periodEndMs: endMs,
          reportHashHex: values.reportHash,
        }),
      });
      void triggerIndexerSync();
      toast.success("Verification submitted", {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      verificationForm.reset();
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit verification", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  }

  async function onAttest(pending: PendingVerification) {
    if (!ready || !program || !wallet) {
      toast.error("Wallet not ready");
      return;
    }
    setBusy(`attest-${pending.verificationId}`);
    try {
      const [mrvPda] = findMrvProjectPda(new BN(pending.onchainProjectId));
      const tx = await buildAttestVerification({
        program,
        auditor: wallet,
        mrvPda,
        index: pending.index,
      });
      const sig = await signAndSend(tx);
      await fetch("/api/admin/mrv", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "attest",
          mrvId: pending.mrvId,
          verificationId: pending.verificationId,
          signature: sig,
        }),
      });
      void triggerIndexerSync();
      toast.success("Verification attested", {
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Attest failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  }

  const mrvsWithoutBaseline = mrvProjects.filter((p) => !p.baselineSubmitted);
  const mrvsWithBaseline = mrvProjects.filter((p) => p.baselineSubmitted);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit baseline</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...baselineForm}>
            <form
              onSubmit={baselineForm.handleSubmit(onSubmitBaseline)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                control={baselineForm.control}
                name="mrvId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>MRV project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a project…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mrvsWithoutBaseline.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            All baselines submitted
                          </SelectItem>
                        ) : (
                          mrvsWithoutBaseline.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.msmeName} (#{p.onchainProjectId ?? "—"})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={baselineForm.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={baselineForm.control}
                name="energyKwhPerYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>kWh / year</FormLabel>
                    <FormControl>
                      <NumericInput type="number" step="1" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={baselineForm.control}
                name="costInrPerYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>₹ / year</FormLabel>
                    <FormControl>
                      <NumericInput type="number" step="1" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={baselineForm.control}
                name="co2TonsPerYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CO₂ t / year</FormLabel>
                    <FormControl>
                      <NumericInput
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={baselineForm.control}
                name="reportHash"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>SHA-256 hex</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        className="font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="submit"
                  disabled={!ready || busy !== null}
                  className="min-w-[140px] gap-1.5"
                >
                  {busy === "baseline" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Submit baseline
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit verification</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...verificationForm}>
            <form
              onSubmit={verificationForm.handleSubmit(onSubmitVerification)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                control={verificationForm.control}
                name="mrvId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>MRV project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a project…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mrvsWithBaseline.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            Submit a baseline first
                          </SelectItem>
                        ) : (
                          mrvsWithBaseline.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.msmeName} (#{p.onchainProjectId ?? "—"}) · next
                              index {p.verificationCount}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="savingsBps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings vs expected (bps)</FormLabel>
                    <FormControl>
                      <NumericInput
                        type="number"
                        step="1"
                        min={-10000}
                        max={10000}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period end</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="kwhSaved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>kWh saved</FormLabel>
                    <FormControl>
                      <NumericInput type="number" step="1" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="costSavedInr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>₹ saved</FormLabel>
                    <FormControl>
                      <NumericInput
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="co2Tons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CO₂ t avoided</FormLabel>
                    <FormControl>
                      <NumericInput
                        type="number"
                        step="0.01"
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={verificationForm.control}
                name="reportHash"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>SHA-256 hex</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        className="font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end sm:col-span-2">
                <Button
                  type="submit"
                  disabled={!ready || busy !== null}
                  className="min-w-[160px] gap-1.5"
                >
                  {busy === "verification" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Submit verification
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attest pending</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingVerifications.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              Nothing pending attestation.
            </p>
          ) : (
            <ul className="divide-y divide-line/50">
              {pendingVerifications.map((v) => {
                const key = `attest-${v.verificationId}`;
                return (
                  <li
                    key={v.verificationId}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{v.mrvLabel}</p>
                      <p className="mono-num text-xs text-fg-muted">
                        Verification #{v.index}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onAttest(v)}
                      disabled={!ready || busy === key}
                      className="gap-1.5"
                    >
                      {busy === key ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : null}
                      Attest
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
