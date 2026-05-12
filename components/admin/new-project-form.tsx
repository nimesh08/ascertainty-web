"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PublicKey } from "@solana/web3.js";
import { DEVNET_USDC_MINT } from "@/lib/solana/pda";
import { buildCreateProjectBundle } from "@/lib/solana/tx/createProject";
import { useAdminTx } from "@/lib/admin/use-admin-tx";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StickyActionBar } from "@/components/admin/sticky-action-bar";
import { solanaPubkey } from "@/lib/utils/validation";
import { explorerTx } from "@/lib/utils/format";
import { triggerIndexerSync } from "@/lib/admin/indexer-sync";
import {
  AdminContentEditor,
  EMPTY_CONTENT,
  serializeAdminContent,
  type AdminContentValue,
} from "@/components/admin/admin-content-editor";

const schema = z.object({
  msmeName: z.string().min(2, "Name too short").max(64),
  sector: z.string().min(1, "Pick a sector"),
  location: z.string().min(2).max(64),
  upgradeType: z.string().min(2).max(32),
  targetUsdc: z.coerce.number().positive().max(10_000_000),
  termMonths: z.coerce.number().int().min(6).max(60),
  fuelType: z.string().min(1).max(16),
  baselineKwhPerYear: z.coerce.number().positive(),
  baselineCostInrPerYear: z.coerce.number().positive(),
  baselineCo2TonsPerYear: z.coerce.number().positive(),
  auditorWallet: solanaPubkey,
  reportHash: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "Must be 64 hex chars (SHA-256)"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const SECTORS = ["textile", "food", "metal", "chemical", "ceramics", "other"];
const FUELS = ["diesel", "coal", "grid", "lpg", "biomass", "other"];

export function NewProjectForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState<AdminContentValue>(EMPTY_CONTENT);
  const { program, wallet, signAndSend, ready } = useAdminTx();

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      msmeName: "",
      sector: "textile",
      location: "",
      upgradeType: "",
      targetUsdc: 0,
      termMonths: 24,
      fuelType: "diesel",
      baselineKwhPerYear: 0,
      baselineCostInrPerYear: 0,
      baselineCo2TonsPerYear: 0,
      auditorWallet: "",
      reportHash: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (!ready || !wallet || !program) {
      toast.error("Wallet not ready yet — connect and retry.");
      return;
    }
    setSubmitting(true);
    try {
      const projectId = Date.now();
      const reportHash = new Uint8Array(
        values.reportHash
          .match(/.{2}/g)!
          .map((b) => parseInt(b, 16))
      );
      const usdcSmallest = BigInt(Math.round(values.targetUsdc * 1_000_000));

      const bundle = await buildCreateProjectBundle({
        program,
        admin: wallet,
        auditor: new PublicKey(values.auditorWallet),
        projectId,
        msmeName: values.msmeName,
        sector: values.sector,
        location: values.location,
        upgradeType: values.upgradeType,
        fuelType: values.fuelType,
        baselineKwhPerYear: BigInt(Math.round(values.baselineKwhPerYear)),
        baselineCostInrPerYear: BigInt(
          Math.round(values.baselineCostInrPerYear)
        ),
        baselineCo2TonsPerYearX100: BigInt(
          Math.round(values.baselineCo2TonsPerYear * 100)
        ),
        reportHash,
        targetUsdc: usdcSmallest,
        termMonths: values.termMonths,
        usdcMint: DEVNET_USDC_MINT,
      });

      const sig = await signAndSend(bundle.tx, bundle.signers);

      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          onchainProjectId: projectId.toString(),
          msmeName: values.msmeName,
          sector: values.sector,
          location: values.location,
          upgradeType: values.upgradeType,
          targetUsdc: usdcSmallest.toString(),
          termMonths: values.termMonths,
          projectPda: bundle.projectPda.toBase58(),
          tokenMint: bundle.tokenMintKeypair.publicKey.toBase58(),
          usdcVault: bundle.usdcVault.toBase58(),
          signature: sig,
          auditorWallet: values.auditorWallet,
          fuelType: values.fuelType,
          baselineKwhPerYear: Math.round(values.baselineKwhPerYear).toString(),
          baselineCostInrPerYear: Math.round(
            values.baselineCostInrPerYear
          ).toString(),
          baselineCo2TonsPerYearX100: Math.round(
            values.baselineCo2TonsPerYear * 100
          ).toString(),
          reportHashHex: values.reportHash,
          // Optional admin content (any blanks become null server-side).
          ...serializeAdminContent(content),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { projectId: string };
      void triggerIndexerSync();
      toast.success("Project created", {
        description: "On-chain transaction confirmed.",
        action: {
          label: "Explorer",
          onClick: () => window.open(explorerTx(sig), "_blank"),
        },
      });
      router.push(`/admin/projects/${data.projectId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSubmitting(false);
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
            <CardTitle className="text-base">1 · MSME details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="msmeName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Business name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Textiles Pvt Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Tirupur, Tamil Nadu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="upgradeType"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Upgrade type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Steam boiler retrofit to gas-fired"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Short description of the equipment being upgraded.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2 · Financing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="targetUsdc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target (USDC)</FormLabel>
                  <FormControl>
                    <NumericInput
                      inputMode="decimal"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="50000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Raise amount in USDC. 1.5% origination fee on activation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="termMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term (months)</FormLabel>
                  <FormControl>
                    <NumericInput
                      inputMode="numeric"
                      type="number"
                      min={6}
                      max={60}
                      step={1}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>6 – 60 months.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3 · Baseline (auditor)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="auditorWallet"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Auditor wallet</FormLabel>
                  <FormControl>
                    <Input
                      className="mono-num"
                      placeholder="Solana pubkey (must be on the registry)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The auditor submits the baseline in the same transaction;
                    they must already be whitelisted under{" "}
                    <span className="text-accent">Admin → Auditors</span>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fuelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FUELS.map((f) => (
                        <SelectItem key={f} value={f} className="capitalize">
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baselineKwhPerYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baseline (kWh / year)</FormLabel>
                  <FormControl>
                    <NumericInput
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min={0}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baselineCostInrPerYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baseline cost (₹ / year)</FormLabel>
                  <FormControl>
                    <NumericInput
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min={0}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baselineCo2TonsPerYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baseline CO₂ (t / year)</FormLabel>
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
                    Rounded to 0.01t on-chain.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportHash"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Baseline report (SHA-256 hex)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="mono-num font-mono text-xs"
                      rows={2}
                      placeholder="64 hex chars of sha256(report.pdf)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              4 · Investor content (optional)
            </CardTitle>
            <p className="text-xs text-fg-muted">
              Fill these now for a rich project page, or skip and edit later
              from the admin detail view. Nothing here is required.
            </p>
          </CardHeader>
          <CardContent>
            <AdminContentEditor
              value={content}
              onChange={setContent}
              labelScope="project"
              disabled={submitting}
            />
          </CardContent>
        </Card>

        <StickyActionBar>
          <Button
            type="button"
            variant="outline"
            onClick={() => history.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !ready}
            className="min-w-[140px]"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing…
              </>
            ) : (
              "Create project"
            )}
          </Button>
        </StickyActionBar>
      </form>
    </Form>
  );
}
