"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Flame,
  Leaf,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SavingsBand } from "@/components/auditor/savings-band";
import {
  formatUsd,
  shortSig,
  explorerTx,
} from "@/lib/utils/format";
import { SectionCard, SectionLabel, SectionTitle, ProseText } from "./sections-part-1";

interface UnderwritingForCard {
  dealId: string;
  modelUsed: string | null;
  pinnSavingsKwh: string | null;
  pinnP5LowerKwh: string | null;
  pinnP95UpperKwh: string | null;
  confidenceGrade: string | null;
  electricityRateInrKwh: string | null;
  dscrAtP5: string | null;
  dscrAtP50: string | null;
  carbonEligible: boolean | null;
  carbonTco2PerYear: string | null;
  carbonMethodology: string | null;
}

/** Underwriting brief — TabPFN attribution, savings band, DSCR, carbon, lender link. */
export function UnderwritingBriefSection({
  underwriting,
}: {
  underwriting: UnderwritingForCard | null;
}) {
  if (!underwriting) return null;
  const point = Number(underwriting.pinnSavingsKwh ?? 0);
  const p5 = Number(underwriting.pinnP5LowerKwh ?? 0);
  const p95 = Number(underwriting.pinnP95UpperKwh ?? 0);
  const rate = Number(underwriting.electricityRateInrKwh ?? 8);
  const grade = (underwriting.confidenceGrade ?? null) as "A" | "B" | "C" | null;
  const dscrP5 = underwriting.dscrAtP5 != null ? Number(underwriting.dscrAtP5) : null;
  const dscrP50 = underwriting.dscrAtP50 != null ? Number(underwriting.dscrAtP50) : null;
  const carbonT = underwriting.carbonTco2PerYear != null ? Number(underwriting.carbonTco2PerYear) : null;

  return (
    <SectionCard delay={0.27}>
      <SectionTitle label="Underwriting" title="Calibrated savings brief" />
      <div className="space-y-6">
        {point > 0 ? (
          <SavingsBand
            predictedKwh={point}
            p5Kwh={p5}
            p95Kwh={p95}
            grade={grade ?? undefined}
            electricityRateInrKwh={rate}
            variant="full"
            label="Predicted annual savings (90% conformal PI)"
          />
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {dscrP5 != null ? (
            <MetricTile
              label="DSCR @ P5"
              value={`${dscrP5.toFixed(2)}×`}
              hint={dscrP5 >= 1.3 ? "≥ 1.30× covenant" : "below covenant"}
              tone={dscrP5 >= 1.3 ? "good" : "warn"}
            />
          ) : null}
          {dscrP50 != null ? (
            <MetricTile
              label="DSCR @ P50"
              value={`${dscrP50.toFixed(2)}×`}
              hint={dscrP50 >= 1.75 ? "≥ 1.75× target" : "below target"}
              tone={dscrP50 >= 1.75 ? "good" : "warn"}
            />
          ) : null}
          {carbonT != null && underwriting.carbonEligible ? (
            <MetricTile
              icon={<Leaf className="size-4 text-green" />}
              label="Carbon §11"
              value={`${carbonT.toFixed(1)} tCO₂/yr`}
              hint={underwriting.carbonMethodology ?? "monthly accrual"}
              tone="good"
            />
          ) : null}
        </div>

        <div className="rounded-xl border border-line/60 bg-bg-2/40 p-4 text-sm text-fg/80">
          <p className="leading-relaxed">
            <span className="font-medium text-fg">
              {underwriting.modelUsed ?? "PINN unified"}
            </span>{" "}
            sized this facility under the DSCR-at-P5 ≥ 1.30× covenant. The serving model
            ingests all 21 fields from the audit schema (leakage, rated kW, hours/days,
            plant context); calibration is fit on a 72-ECM Indian audit corpus.{" "}
            <Link href="/#05-benchmarks" className="underline underline-offset-2 hover:text-accent">
              See full benchmarks
            </Link>{" "}
            for the leave-one-out residuals and reproduction script. Carbon credits accrue
            on the same meter under the project&apos;s disclosure schedule.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link
              href={`/lender/${underwriting.dealId}`}
              className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent transition-colors hover:bg-accent/20"
            >
              View lender brief <ArrowRight className="size-3" />
            </Link>
            <Link
              href={`/lender/${underwriting.dealId}/timeline`}
              className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-bg-2/40 px-2.5 py-1 text-fg-muted transition-colors hover:text-fg"
            >
              Underwriting timeline <ArrowRight className="size-3" />
            </Link>
            <Link
              href="/#05-benchmarks"
              className="inline-flex items-center gap-1 rounded-md border border-line/60 bg-bg-2/40 px-2.5 py-1 text-fg-muted transition-colors hover:text-fg"
            >
              Model benchmarks <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/** A/B/C confidence grade tile — replaces the 0-100 trust score when grade is set. */
export function ConfidenceGradeSection({
  grade,
  fallbackScore,
}: {
  grade: "A" | "B" | "C" | null;
  fallbackScore: number | null;
}) {
  if (!grade) {
    if (fallbackScore == null) return null;
    return <TrustScoreSection score={fallbackScore} />;
  }
  const palette = {
    A: { ring: "border-green/40 bg-green/10", text: "text-green", tranche: "Senior tranche eligible", explainer: "Narrow 90% conformal band (<25% of point estimate). Loan can be sized into the senior tranche at up to 60% LTV." },
    B: { ring: "border-[#eab308]/40 bg-[#eab308]/10", text: "text-[#eab308]", tranche: "Senior + Junior split", explainer: "Moderate band width (25–50%). Senior eligible at a lower LTV; junior absorbs first-loss until Day-90 verification tightens the band." },
    C: { ring: "border-accent/40 bg-accent/10", text: "text-accent", tranche: "Junior tranche only", explainer: "Wide band (>50%). Junior-only until a verified second audit period tightens the conformal coverage." },
  }[grade];

  return (
    <SectionCard delay={0.4}>
      <SectionTitle label="Confidence" title="Model confidence grade" />
      <div className="flex flex-wrap items-center gap-6">
        <div
          className={[
            "grid h-28 w-28 shrink-0 place-items-center rounded-full border",
            palette.ring,
          ].join(" ")}
        >
          <div className="text-center">
            <div className={["mono-num text-5xl font-bold", palette.text].join(" ")}>{grade}</div>
            <div className="text-[10px] uppercase tracking-widest text-fg-muted">grade</div>
          </div>
        </div>
        <div className="max-w-md space-y-2">
          <p className={["text-sm font-semibold", palette.text].join(" ")}>{palette.tranche}</p>
          <p className="text-sm leading-relaxed text-fg/80">{palette.explainer}</p>
          <p className="text-[11px] uppercase tracking-widest text-fg-muted">
            Derived from (P95 − P5) / (2 × P50) · 90% conformal PI
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

/** Baseline + verification progress + auditor pills (absorbs old MRV tab). */
export function BaselineImpactSection({
  baseline,
  verifications,
  auditors,
}: {
  baseline: {
    energyKwhPerYear: string;
    fuelType: string;
    auditorWallet: string;
    submittedAt: string;
  } | null;
  verifications: Array<{
    auditorWallet: string;
    attested: boolean;
    periodStart: string;
    periodEnd: string;
  }>;
  auditors: Record<string, { name: string; certification: string }>;
}) {
  const attestedCount = verifications.filter((v) => v.attested).length;

  // Unique set of auditor wallets touching this project.
  const uniqueAuditors = Array.from(
    new Set(
      [
        baseline?.auditorWallet,
        ...verifications.map((v) => v.auditorWallet),
      ].filter(Boolean) as string[]
    )
  );

  const hasAnything = !!baseline || verifications.length > 0;

  return (
    <SectionCard delay={0.25}>
      <SectionTitle label="MRV" title="Baseline & impact" />

      {!hasAnything ? (
        <p className="text-sm text-fg-muted">
          Baseline not yet submitted by the auditor. Verification data will
          appear here once the project is active.
        </p>
      ) : (
        <div className="space-y-5">
          {baseline ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile
                icon={<Zap className="size-4 text-accent" />}
                label="Baseline energy / yr"
                value={`${Number(
                  baseline.energyKwhPerYear
                ).toLocaleString()} kWh`}
              />
              <MetricTile
                icon={<Flame className="size-4 text-accent" />}
                label="Fuel type"
                value={baseline.fuelType}
              />
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-fg-muted">Verification progress</span>
              <span className="mono-num text-fg">
                {attestedCount} / {verifications.length || 0} attested
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-2">
              <div
                className="h-full bg-green transition-all"
                style={{
                  width:
                    verifications.length === 0
                      ? "0%"
                      : `${(attestedCount / verifications.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {uniqueAuditors.length > 0 ? (
            <div className="space-y-2">
              <SectionLabel>Auditors</SectionLabel>
              <ul className="flex flex-wrap gap-2">
                {uniqueAuditors.map((w) => {
                  const meta = auditors[w];
                  return (
                    <li
                      key={w}
                      className="inline-flex items-center gap-2 rounded-full border border-line/60 bg-bg-2/40 px-3 py-1.5 text-xs"
                    >
                      <BadgeCheck className="size-3.5 text-green" />
                      <span className="text-fg">
                        {meta?.name ?? shortSig(w, 5)}
                      </span>
                      {meta?.certification ? (
                        <span className="text-fg-muted">
                          · {meta.certification}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

export function FinancialsSection({
  project,
  apyPct,
}: {
  project: {
    targetUsdc: string;
    termMonths: number;
    status: string;
    financialsText: string | null;
  };
  apyPct: number;
}) {
  return (
    <SectionCard delay={0.3}>
      <SectionTitle label="Financials" title="Financials & returns" />
      {project.financialsText ? (
        <ProseText className="mb-5">
          <p>{project.financialsText}</p>
        </ProseText>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile
          label="Target"
          value={formatUsd(project.targetUsdc)}
        />
        <MetricTile label="Term" value={`${project.termMonths} mo`} />
        <MetricTile
          label="APY"
          value={apyPct > 0 ? `${apyPct.toFixed(2)}%` : "—"}
        />
        <MetricTile
          label="Status"
          value={project.status.replace(/_/g, " ")}
          capitalize
        />
      </div>
    </SectionCard>
  );
}

/**
 * Returns calculator with a slider: pick an amount in USD between $1 and the
 * remaining target. Shows estimated total return + avg monthly income.
 *
 * Formula (simple interest, spec):
 *   totalReturn = amount * (1 + apy * termMonths / 12)
 *   avgMonthly  = (totalReturn - amount) / termMonths
 */
export function ReturnsCalculatorSection({
  remainingRaw,
  targetRaw,
  apyPct,
  termMonths,
}: {
  remainingRaw: bigint;
  targetRaw: bigint;
  apyPct: number;
  termMonths: number;
}) {
  // Convert raw 6-dec to whole-dollar units for the slider (integer ticks).
  // Fall back to $10,000 if already funded to target.
  const maxDollarsRaw = remainingRaw > 0n ? Number(remainingRaw / 1_000_000n) : 0;
  const max = maxDollarsRaw > 0 ? Math.max(1, maxDollarsRaw) : 10_000;
  const min = 1;

  const [amount, setAmount] = useState<number>(() => Math.min(1_000, max));

  const totalReturn = useMemo(() => {
    const r = apyPct / 100;
    return amount * (1 + r * (termMonths / 12));
  }, [amount, apyPct, termMonths]);

  const avgMonthly = useMemo(() => {
    if (termMonths === 0) return 0;
    return (totalReturn - amount) / termMonths;
  }, [totalReturn, amount, termMonths]);

  const apyLabel = apyPct > 0 ? `${apyPct.toFixed(2)}%` : "—";
  const fullyFunded = targetRaw > 0n && remainingRaw === 0n;

  return (
    <SectionCard delay={0.35}>
      <SectionTitle label="Tool" title="Returns calculator" />

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-fg-muted">Investment amount</span>
            <span className="mono-num text-2xl font-semibold text-fg">
              {formatUsd(amount, { human: true, decimals: 0 })}
            </span>
          </div>
          <Slider
            value={[amount]}
            min={min}
            max={max}
            step={1}
            onValueChange={(v) => setAmount(v[0] ?? min)}
            aria-label="Investment amount"
            disabled={max <= min}
          />
          <div className="mt-2 flex justify-between text-[11px] text-fg-muted">
            <span>{formatUsd(min, { human: true, decimals: 0 })} min</span>
            <span>
              {fullyFunded ? "Fully funded" : `${formatUsd(max, { human: true, decimals: 0 })} remaining`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green/20 bg-green/5 p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
              Estimated total return
            </p>
            <p className="mono-num mt-1 text-2xl font-semibold text-green">
              {formatUsd(totalReturn, { human: true, decimals: 2 })}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              Over {termMonths} months @ {apyLabel}
            </p>
          </div>
          <div className="rounded-xl border border-line/60 bg-bg-2/40 p-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-fg-muted">
              Avg. monthly income
            </p>
            <p className="mono-num mt-1 text-2xl font-semibold text-fg">
              {formatUsd(avgMonthly, { human: true, decimals: 2 })}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              Pre-tax, indicative only
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-fg-muted">
          Indicative only. Calculations based on a target XIRR of {apyLabel}.
          Actual returns may vary based on project performance and timing of
          distributions.
        </p>
      </div>
    </SectionCard>
  );
}

export function TrustScoreSection({ score }: { score: number | null }) {
  if (score == null) return null;
  const tier =
    score >= 80 ? "high" : score >= 50 ? "medium" : "low";
  const color =
    tier === "high"
      ? "text-green"
      : tier === "medium"
        ? "text-[#eab308]"
        : "text-accent";
  const ringColor =
    tier === "high"
      ? "border-green/30 bg-green/5"
      : tier === "medium"
        ? "border-[#eab308]/30 bg-[#eab308]/5"
        : "border-accent/30 bg-accent/5";
  return (
    <SectionCard delay={0.4}>
      <SectionTitle label="Trust" title="Net trust score" />
      <div className="flex flex-wrap items-center gap-6">
        <div
          className={[
            "grid h-28 w-28 shrink-0 place-items-center rounded-full border",
            ringColor,
          ].join(" ")}
        >
          <div className="text-center">
            <div className={["mono-num text-3xl font-bold", color].join(" ")}>
              {score}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-fg-muted">
              / 100
            </div>
          </div>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-fg/80">
          Based on audit history, repayment track record, and equipment
          quality. A score above 80 indicates high reliability.
        </p>
      </div>
    </SectionCard>
  );
}

export function DocumentsSection({
  documents,
}: {
  documents: Array<{ name: string; url: string }>;
}) {
  return (
    <SectionCard delay={0.45}>
      <SectionTitle label="Attachments" title="Documents" />
      {documents.length === 0 ? (
        <p className="text-sm text-fg-muted">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {documents.map((d, i) => (
            <li
              key={`${d.name}-${i}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-bg-2/60 text-fg-muted">
                  <FileText className="size-4" />
                </div>
                <span className="truncate text-sm text-fg">{d.name}</span>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={!d.url || d.url === "#"}
              >
                <a
                  href={d.url && d.url !== "#" ? d.url : undefined}
                  target="_blank"
                  rel="noopener"
                >
                  <Download className="size-3.5" /> Download
                </a>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function RepaymentHistorySection({
  distributions,
}: {
  distributions: Array<{
    signature: string;
    amountUsdc: string | null;
    blockTime: string | null;
    createdAt: string;
  }>;
}) {
  return (
    <SectionCard delay={0.5}>
      <SectionTitle label="History" title="Repayment history" />
      {distributions.length === 0 ? (
        <p className="text-sm text-fg-muted">No distributions yet.</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {distributions.map((d) => {
            const ts = d.blockTime ?? d.createdAt;
            return (
              <li
                key={d.signature}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-fg">
                    {new Date(ts).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {new Date(ts).toLocaleTimeString()}
                  </p>
                </div>
                <span className="mono-num shrink-0 text-fg">
                  {d.amountUsdc ? formatUsd(d.amountUsdc) : "—"}
                </span>
                <a
                  href={explorerTx(d.signature)}
                  target="_blank"
                  rel="noopener"
                  className="mono-num inline-flex shrink-0 items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg"
                >
                  {shortSig(d.signature, 5)}
                  <ExternalLink className="size-3" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function MetricTile({
  label,
  value,
  icon,
  capitalize,
  hint,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  capitalize?: boolean;
  hint?: string;
  tone?: "good" | "warn";
}) {
  const valueClass =
    tone === "good"
      ? "text-green"
      : tone === "warn"
        ? "text-[#eab308]"
        : "text-fg";
  return (
    <div className="rounded-xl border border-line/60 bg-bg-2/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-fg-muted">
        {icon}
        {label}
      </div>
      <p
        className={[
          "mono-num mt-1 text-sm font-medium",
          valueClass,
          capitalize ? "capitalize" : "",
        ].join(" ")}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}
