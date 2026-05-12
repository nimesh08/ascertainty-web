"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { SavingsBand } from "./savings-band";

// Five fields per the MVP plan — compressed-air leakage ECM
const schema = z.object({
  deal_id: z.string().min(1, "Required").max(60),
  ecm_id: z.string().min(1, "Required").max(40),
  compressor_rated_kw: z.coerce.number().positive("Must be > 0"),
  operating_hours_per_day: z.coerce.number().min(0).max(24),
  operating_days_per_year: z.coerce.number().min(0).max(365),
  leakage_pct: z.coerce.number().min(0).max(95),
  industry_sector: z.enum(["textiles", "auto_components", "other"]),
  investment_inr: z.coerce.number().min(0).optional(),
  electricity_rate_inr_kwh: z.coerce.number().positive().default(8.0),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

interface Prediction {
  predicted_savings_kwh: number;
  savings_lower_p5_kwh: number;
  savings_upper_p95_kwh: number;
  sigma_kwh: number;
  sigma_scale_applied: number;
  confidence_grade: "A" | "B" | "C";
  predicted_savings_pct: number;
  model_used: string;
  payback_months: number | null;
  p5_payback_months: number | null;
  is_below_baseline_floor: boolean;
}

interface AuditorIntakeFormProps {
  dealId?: string;
  initial?: {
    ecmId: string;
    auditInputsJson?: Record<string, unknown> | null;
    predictionJson?: Record<string, unknown> | null;
  } | null;
}

const DEBOUNCE_MS = 350;

export function AuditorIntakeForm({ dealId, initial }: AuditorIntakeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(
    (initial?.predictionJson as Prediction | null) ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const inputs = (initial?.auditInputsJson ?? {}) as Record<string, unknown>;
  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      deal_id: dealId ?? (inputs.deal_id as string | undefined) ?? "",
      ecm_id: initial?.ecmId ?? "ecm-1",
      compressor_rated_kw: (inputs.compressor_rated_kw as number | undefined) ?? "" as unknown as number,
      operating_hours_per_day: 24,
      operating_days_per_year: 350,
      leakage_pct: (inputs.leakage_pct as number | undefined) ?? "" as unknown as number,
      industry_sector: (inputs.industry_sector as "textiles" | "auto_components" | "other" | undefined) ?? "textiles",
      investment_inr: (inputs.investment_inr as number | undefined) ?? undefined,
      electricity_rate_inr_kwh: (inputs.electricity_rate_inr_kwh as number | undefined) ?? 8.0,
    },
  });

  const watched = useWatch({ control: form.control });

  // Baseline kWh derived from rated_kw × hours × days
  const baselineKwh = useMemo(() => {
    const kw = Number(watched.compressor_rated_kw);
    const hr = Number(watched.operating_hours_per_day);
    const days = Number(watched.operating_days_per_year);
    if (!kw || !hr || !days) return null;
    return kw * hr * days;
  }, [
    watched.compressor_rated_kw,
    watched.operating_hours_per_day,
    watched.operating_days_per_year,
  ]);

  // 5-field completeness for progress display
  const filledCount = useMemo(() => {
    let n = 0;
    if (Number(watched.compressor_rated_kw) > 0) n++;
    if (Number(watched.operating_hours_per_day) > 0) n++;
    if (Number(watched.operating_days_per_year) > 0) n++;
    if (Number(watched.leakage_pct) > 0) n++;
    if (watched.industry_sector) n++;
    return n;
  }, [watched]);

  // Debounced live prediction (does NOT persist — only persists on Submit)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!baselineKwh || baselineKwh <= 0) {
      setPrediction(null);
      setError(null);
      return;
    }
    const leak = Number(watched.leakage_pct);
    if (!leak || leak <= 0) {
      setPrediction(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setPredicting(true);
      setError(null);
      try {
        const res = await fetch("/api/inference-preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            equipment_type: "compressed_air",
            ecm_category: "compressed_air_leakage",
            ecm_description: "Compressed-air leakage ECM",
            industry_sector: watched.industry_sector,
            baseline_kwh_per_year: baselineKwh,
            compressor_rated_kw: Number(watched.compressor_rated_kw),
            leakage_pct: leak,
            electricity_rate_inr_kwh: Number(watched.electricity_rate_inr_kwh) || 8.0,
            investment_inr: watched.investment_inr ? Number(watched.investment_inr) : undefined,
          }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(text || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as Prediction;
        setPrediction(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPrediction(null);
      } finally {
        setPredicting(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    baselineKwh,
    watched.leakage_pct,
    watched.industry_sector,
    watched.compressor_rated_kw,
    watched.electricity_rate_inr_kwh,
    watched.investment_inr,
  ]);

  async function onSubmit(values: FormOutput) {
    if (!baselineKwh) {
      toast.error("Fill rated_kw / hours / days first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deal_id: values.deal_id,
          ecm_id: values.ecm_id,
          equipment_type: "compressed_air",
          ecm_category: "compressed_air_leakage",
          ecm_description: "Compressed-air leakage ECM (auditor intake)",
          industry_sector: values.industry_sector,
          baseline_kwh_per_year: baselineKwh,
          compressor_rated_kw: values.compressor_rated_kw,
          leakage_pct: values.leakage_pct,
          electricity_rate_inr_kwh: values.electricity_rate_inr_kwh,
          investment_inr: values.investment_inr,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text);
      }
      toast.success("Saved. Lender preview is live.");
      router.push(`/lender/${encodeURIComponent(values.deal_id)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const electricityRate = Number(watched.electricity_rate_inr_kwh) || 8.0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compressed-air leakage ECM</CardTitle>
            <span className="text-xs text-zinc-500">{filledCount} / 5 fields</span>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="deal_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. deal-2026-leak-01"
                          disabled={!!dealId}
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ecm_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ECM ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ecm-3"
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="compressor_rated_kw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compressor rated kW <span className="text-xs text-zinc-500">(nameplate)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="45"
                        {...field}
                        value={field.value === 0 || field.value == null ? "" : String(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="operating_hours_per_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating hours / day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="24"
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="operating_days_per_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating days / year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="350"
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="leakage_pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leakage % <span className="text-xs text-zinc-500">(Fluke ii910 measurement)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="42"
                        {...field}
                        value={field.value === 0 || field.value == null ? "" : String(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry_sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry sector</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-3"
                      >
                        {([
                          ["textiles", "Textiles / Spinning"],
                          ["auto_components", "Auto components"],
                          ["other", "Other"],
                        ] as const).map(([val, lbl]) => (
                          <label
                            key={val}
                            className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                          >
                            <RadioGroupItem value={val} />
                            <span>{lbl}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3 border-t pt-4">
                <FormField
                  control={form.control}
                  name="investment_inr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment (₹) <span className="text-xs text-zinc-500">optional</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1000"
                          placeholder="500000"
                          {...field}
                          value={field.value == null ? "" : String(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricity_rate_inr_kwh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Electricity rate (₹/kWh)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={String(field.value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={submitting || filledCount < 5} className="w-full">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Saving…" : "Save & open lender preview"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>Live confidence band</CardTitle>
        </CardHeader>
        <CardContent>
          {baselineKwh && (
            <div className="mb-4 rounded-md bg-zinc-100 px-3 py-2 text-xs dark:bg-zinc-900">
              <div className="text-zinc-500">Derived baseline</div>
              <div className="font-medium">
                {baselineKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr
              </div>
              <div className="text-zinc-500">
                = {Number(watched.compressor_rated_kw) || 0} kW × {Number(watched.operating_hours_per_day) || 0} h × {Number(watched.operating_days_per_year) || 0} d
              </div>
            </div>
          )}
          {predicting && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Predicting…
            </div>
          )}
          {error && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}
          {!predicting && !error && !prediction && (
            <div className="text-sm text-zinc-500">
              Fill at least: rated_kW, hours/day, days/yr, leakage % — band updates live.
            </div>
          )}
          {prediction && (
            <div className="space-y-4">
              <SavingsBand
                predictedKwh={prediction.predicted_savings_kwh}
                p5Kwh={prediction.savings_lower_p5_kwh}
                p95Kwh={prediction.savings_upper_p95_kwh}
                grade={prediction.confidence_grade}
                electricityRateInrKwh={electricityRate}
              />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                  <div className="text-zinc-500">Model</div>
                  <div className="font-mono">{prediction.model_used.replace("exira_pinn_", "")}</div>
                </div>
                <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                  <div className="text-zinc-500">σ scale applied</div>
                  <div className="font-mono">{prediction.sigma_scale_applied.toFixed(2)}×</div>
                </div>
                {prediction.payback_months != null && (
                  <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                    <div className="text-zinc-500">Payback (point)</div>
                    <div>{prediction.payback_months.toFixed(1)} mo</div>
                  </div>
                )}
                {prediction.p5_payback_months != null && (
                  <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                    <div className="text-zinc-500">Payback (P5)</div>
                    <div className="font-medium text-emerald-700 dark:text-emerald-300">
                      {prediction.p5_payback_months.toFixed(1)} mo
                    </div>
                  </div>
                )}
              </div>
              {prediction.is_below_baseline_floor && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                  P5 hit zero floor — model can&apos;t bound below confidently for this case. Lender should
                  use point estimate cautiously or wait for more measurement.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
