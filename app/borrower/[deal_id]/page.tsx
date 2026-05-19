import Link from "next/link";
import { eq, desc } from "drizzle-orm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavingsBand } from "@/components/auditor/savings-band";
import { IoTMockChart } from "@/components/shared/IoTMockChart";
import { CarbonCreditPanel } from "@/components/shared/CarbonCreditPanel";
import { sortEcmsNumerically } from "@/lib/utils/equipment";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ScheduleRow {
  month: number;
  label: string;
  payment: number;
  cumulative: number;
}

function projectSchedule(loanInr: number, tenureMonths: number): ScheduleRow[] {
  if (!loanInr || !tenureMonths) return [];
  // Approximate level monthly payment at 14% APR (matches underwriting_report.py)
  const r = 0.14 / 12;
  const monthlyPmt = (loanInr * r) / (1 - Math.pow(1 + r, -tenureMonths));
  const milestones = [1, 6, 12, 18, 24, 30, 36].filter((m) => m <= tenureMonths);
  return milestones.map((m) => ({
    month: m,
    label: m === 1 ? "Month 1" : m === tenureMonths ? `Month ${m} (final)` : `Month ${m}`,
    payment: monthlyPmt,
    cumulative: monthlyPmt * m,
  }));
}

export default async function BorrowerDealPage({
  params,
}: {
  params: Promise<{ deal_id: string }>;
}) {
  const { deal_id } = await params;

  const ecms = sortEcmsNumerically(
    await db
      .select()
      .from(schema.underwritingResults)
      .where(eq(schema.underwritingResults.dealId, deal_id))
  );

  if (ecms.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-fg-muted">
            <p>
              No deal matches <code className="rounded bg-bg-2/60 px-1">{deal_id}</code>{" "}
              yet. If you&apos;re the MSME owner, check the link your auditor
              shared.
            </p>
            <Link href="/" className="text-accent underline">
              Back to home →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Aggregate across all ECMs for the deal
  const sumPredicted = ecms.reduce((a, r) => a + Number(r.pinnSavingsKwh ?? 0), 0);
  const sumP5 = ecms.reduce((a, r) => a + Number(r.pinnP5LowerKwh ?? 0), 0);
  const sumP95 = ecms.reduce((a, r) => a + Number(r.pinnP95UpperKwh ?? 0), 0);
  const sumInvestment = ecms.reduce((a, r) => a + Number(r.investmentInr ?? 0), 0);
  const rate = Number(ecms[0]?.electricityRateInrKwh ?? 8.0);
  const grades = ecms.map((r) => r.confidenceGrade).filter(Boolean) as string[];
  const overallGrade = grades.includes("C")
    ? "C"
    : grades.includes("B")
      ? "B"
      : (grades[0] ?? "C");
  const statusLabel = ecms[0]?.status ?? "pending";
  const plantName =
    (ecms[0]?.auditInputsJson as Record<string, unknown> | null)?.[
      "plant_name"
    ]?.toString() ?? "Your facility";

  const softCommits = await db
    .select()
    .from(schema.softCommitments)
    .where(eq(schema.softCommitments.underwritingResultId, ecms[0].id))
    .orderBy(desc(schema.softCommitments.signedAt));
  const latestCommit = softCommits[0] ?? null;

  const loanInr = latestCommit ? Number(latestCommit.loanAmountInr) : 0;
  const tenureMonths = latestCommit?.tenureMonths ?? 0;
  const schedule = projectSchedule(loanInr, tenureMonths);

  const statusPretty: Record<string, string> = {
    pending: "Audit in progress",
    predicted: "Awaiting lender",
    soft_committed: "Lender soft-committed",
    finalized: "Audit finalized",
    reconciled: "Reconciled",
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-fg-muted">
              Your retrofit deal
            </div>
            <CardTitle className="text-xl">{plantName}</CardTitle>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <span>Deal</span>
              <code className="rounded bg-bg-2/60 px-1 font-mono">{deal_id}</code>
              <Badge variant="outline" className="border-accent/40 bg-accent/10 text-[10px] text-accent">
                {statusPretty[statusLabel] ?? statusLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Savings projection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projected annual savings</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsBand
            predictedKwh={sumPredicted}
            p5Kwh={sumP5}
            p95Kwh={sumP95}
            grade={overallGrade as "A" | "B" | "C"}
            electricityRateInrKwh={rate}
            label="Aggregated across all ECMs"
          />
          <p className="mt-3 text-xs text-fg-muted">
            P5 is the lender-grade lower bound — your loan is sized so the
            payments stay covered even if the audit&apos;s lowest-case scenario
            plays out.
          </p>
        </CardContent>
      </Card>

      {/* Loan terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicative loan terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {latestCommit ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-fg-muted">Loan amount</span>
                <span className="font-medium">
                  ₹{Number(latestCommit.loanAmountInr).toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-fg-muted">Tenure</span>
                <span>{latestCommit.tenureMonths ?? "TBD"} months</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-fg-muted">Interest rate</span>
                <span>
                  {latestCommit.interestRateBps
                    ? `${(latestCommit.interestRateBps / 100).toFixed(2)}% p.a.`
                    : "TBD"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-fg-muted">Capex covered</span>
                <span>
                  {sumInvestment > 0
                    ? `${Math.round((Number(latestCommit.loanAmountInr) / sumInvestment) * 100)}% of ₹${sumInvestment.toLocaleString()}`
                    : "—"}
                </span>
              </div>
              <Badge
                variant="outline"
                className="mt-2 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
              >
                Soft-committed by {latestCommit.lenderName}
              </Badge>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-fg-muted">
                Your prospective lender hasn&apos;t signed the soft commitment
                letter yet. Once the audit progresses to Day 5+ with a confident
                P5 floor, we share the preview with them.
              </p>
              <Badge variant="outline" className="text-[10px]">
                Pending lender review
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carbon credit revenue stream (§11) */}
      <CarbonCreditPanel
        equipmentType={ecms[0]?.equipmentType ?? ""}
        predictedKwhPerYear={sumPredicted}
        audienceLabel="to your lenders"
      />

      {/* Payment schedule (mock) */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="py-1 text-left">Milestone</th>
                    <th className="py-1 text-right">EMI</th>
                    <th className="py-1 text-right">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((r) => (
                    <tr key={r.month} className="border-t border-line/60">
                      <td className="py-1">{r.label}</td>
                      <td className="py-1 text-right">
                        ₹{r.payment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-1 text-right">
                        ₹{r.cumulative.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-fg-muted">
              Projected at 14% APR over {tenureMonths} months. Actual payments
              appear once disbursement occurs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Realized savings — IoT M&V time-series */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">
              Realized savings · post-install M&amp;V
            </div>
            <CardTitle className="text-base">
              Meter readings vs. predicted band
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-amber/40 bg-amber/10 text-[10px] text-amber"
          >
            Live · Demo data
          </Badge>
        </CardHeader>
        <CardContent>
          {sumPredicted > 0 && sumP5 > 0 ? (
            <IoTMockChart
              dealId={deal_id}
              annualPredictedKwh={sumPredicted}
              annualP5Kwh={sumP5}
              annualP95Kwh={sumP95}
              electricityRateInrKwh={rate}
            />
          ) : (
            <p className="text-sm text-fg-muted">
              Meter readings will appear here starting Month 1 post-install.
            </p>
          )}
          <p className="mt-3 text-xs text-fg-muted">
            Your payments are funded from the energy you save. As long as the
            realized line stays above the P5 floor, your DSCR holds and your
            loan covenants stay green.
          </p>
        </CardContent>
      </Card>

      {/* Mobile app teaser */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Get the mobile app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-fg-muted">
            We&apos;re building a native borrower app — installer notifications,
            payment confirmations, and savings dashboards on-the-go. Even
            offline-friendly for low-connectivity sites.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="outline" disabled>
              iOS · Coming soon
            </Button>
            <Button size="sm" variant="outline" disabled>
              Android · Coming soon
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2 text-center">
        <Link href="/" className="text-xs text-fg-muted underline">
          Back to ascertainty.com
        </Link>
      </div>
    </div>
  );
}
