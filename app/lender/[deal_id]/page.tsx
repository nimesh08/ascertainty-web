import Link from "next/link";
import { eq, asc } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavingsBand } from "@/components/auditor/savings-band";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const TARGET_DSCR = 1.4;
const TENURE_BY_GRADE: Record<string, number> = { A: 36, B: 30, C: 24 };
const VAULT_IRR = 0.14;

function recommendedLoanInr(
  p5Kwh: number,
  electricityRate: number,
  grade: string | null
): { loanInr: number; tenureMonths: number; annualDebtServiceInr: number } {
  const annualSavingsInr = p5Kwh * electricityRate;
  const annualDebtServiceInr = annualSavingsInr / TARGET_DSCR;
  const tenureMonths = TENURE_BY_GRADE[grade ?? "C"] ?? 24;
  const monthlyR = VAULT_IRR / 12;
  const pvFactor = (1 - Math.pow(1 + monthlyR, -tenureMonths)) / monthlyR;
  const loanInr = (annualDebtServiceInr / 12) * pvFactor;
  return { loanInr, tenureMonths, annualDebtServiceInr };
}

export default async function LenderDealPage({
  params,
}: {
  params: Promise<{ deal_id: string }>;
}) {
  const { deal_id } = await params;

  const rows = await db
    .select()
    .from(schema.underwritingResults)
    .where(eq(schema.underwritingResults.dealId, deal_id))
    .orderBy(asc(schema.underwritingResults.ecmId));

  if (rows.length === 0) {
    return (
      <Container className="py-10 sm:py-14">
        <PageHeader
          kicker="Lender preview"
          title={`Deal not yet started · ${deal_id}`}
          description="No ECMs have been entered for this deal yet. Check back as the auditor adds data."
        />
      </Container>
    );
  }

  // Deal-level aggregate
  const sumPredicted = rows.reduce((a, r) => a + Number(r.pinnSavingsKwh ?? 0), 0);
  const sumP5 = rows.reduce((a, r) => a + Number(r.pinnP5LowerKwh ?? 0), 0);
  const sumP95 = rows.reduce((a, r) => a + Number(r.pinnP95UpperKwh ?? 0), 0);
  const sumInvestment = rows.reduce((a, r) => a + Number(r.investmentInr ?? 0), 0);
  const rate = Number(rows[0]?.electricityRateInrKwh ?? 8.0);

  // Worst confidence grade across ECMs sets the overall tenure
  const grades = rows.map((r) => r.confidenceGrade).filter(Boolean) as string[];
  const overallGrade = grades.includes("C") ? "C" : grades.includes("B") ? "B" : grades[0] ?? "C";
  const { loanInr, tenureMonths, annualDebtServiceInr } = recommendedLoanInr(
    sumP5,
    rate,
    overallGrade
  );

  const filledEcms = rows.length;
  const sector = rows[0]?.sector ?? "—";
  const auditorWallet = rows[0]?.auditorWallet?.slice(0, 8) ?? "—";

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker={`Lender preview · ${deal_id}`}
        title={`${filledEcms} ECM${filledEcms === 1 ? "" : "s"} · ${sector}`}
        description="Live underwriting from the auditor's measurements. P5 lower bound is the conservative floor used for debt sizing — soft commitment is conditional on realized savings ≥ P5 at Day 30."
        right={
          <div className="flex flex-wrap gap-2">
            <Link href={`/lender/${encodeURIComponent(deal_id)}/timeline`}>
              <Button variant="outline">View audit timeline</Button>
            </Link>
            <Link href={`/lender/${encodeURIComponent(deal_id)}/soft-commit`}>
              <Button size="lg">Sign soft commitment →</Button>
            </Link>
          </div>
        }
      />

      {/* Deal-level summary card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Deal-level summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SavingsBand
            predictedKwh={sumPredicted}
            p5Kwh={sumP5}
            p95Kwh={sumP95}
            grade={(overallGrade as "A" | "B" | "C") || undefined}
            electricityRateInrKwh={rate}
            label="Aggregated annual savings (all ECMs)"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Total investment</div>
              <div className="mt-1 text-lg font-medium">
                ₹{sumInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Recommended loan (P5-based)
              </div>
              <div className="mt-1 text-lg font-medium text-emerald-700 dark:text-emerald-300">
                ₹{loanInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-zinc-500">
                @ {(VAULT_IRR * 100).toFixed(0)}% IRR, {tenureMonths} mo, {TARGET_DSCR}× DSCR
              </div>
            </div>
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Annual debt service</div>
              <div className="mt-1 text-lg font-medium">
                ₹{annualDebtServiceInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Audit progress</div>
              <div className="mt-1 text-lg font-medium">{filledEcms} ECM{filledEcms === 1 ? "" : "s"}</div>
              <div className="text-xs text-zinc-500">Auditor: {auditorWallet}…</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-ECM breakdown */}
      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Per-ECM detail
        </h2>
        {rows.map((r) => {
          const point = Number(r.pinnSavingsKwh ?? 0);
          const p5 = Number(r.pinnP5LowerKwh ?? 0);
          const p95 = Number(r.pinnP95UpperKwh ?? 0);
          const grade = (r.confidenceGrade as "A" | "B" | "C" | null) ?? undefined;
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <span className="font-mono text-sm text-zinc-500">{r.ecmId}</span>
                    <span className="mx-2 text-zinc-300">·</span>
                    {r.equipmentType}
                  </CardTitle>
                  <span className="text-xs text-zinc-500">
                    {r.modelUsed?.replace("exira_pinn_", "")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <SavingsBand
                  predictedKwh={point}
                  p5Kwh={p5}
                  p95Kwh={p95}
                  grade={grade}
                  electricityRateInrKwh={Number(r.electricityRateInrKwh ?? 8.0)}
                />
                {r.investmentInr && r.p5PaybackMonths && (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    <span className="text-zinc-500">
                      Investment:{" "}
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        ₹{Number(r.investmentInr).toLocaleString()}
                      </span>
                    </span>
                    <span className="text-zinc-500">
                      Payback (P5):{" "}
                      <span className="font-medium text-emerald-700 dark:text-emerald-300">
                        {Number(r.p5PaybackMonths).toFixed(1)} mo
                      </span>
                    </span>
                    {r.paybackMonths && (
                      <span className="text-zinc-500">
                        Payback (point): {Number(r.paybackMonths).toFixed(1)} mo
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
