import Link from "next/link";
import { eq, asc, desc } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SoftCommitForm } from "@/components/lender/soft-commit-form";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const TARGET_DSCR = 1.4;
const TENURE_BY_GRADE: Record<string, number> = { A: 36, B: 30, C: 24 };
const VAULT_IRR = 0.14;

function recommended(p5Kwh: number, rate: number, grade: string) {
  const annualSavingsInr = p5Kwh * rate;
  const annualDebtServiceInr = annualSavingsInr / TARGET_DSCR;
  const tenureMonths = TENURE_BY_GRADE[grade] ?? 24;
  const monthlyR = VAULT_IRR / 12;
  const pvFactor = (1 - Math.pow(1 + monthlyR, -tenureMonths)) / monthlyR;
  const loanInr = (annualDebtServiceInr / 12) * pvFactor;
  return { loanInr, tenureMonths, annualDebtServiceInr };
}

export default async function SoftCommitPage({
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
          kicker="Soft commitment"
          title={`Deal ${deal_id} not found`}
          description="No ECMs have been entered for this deal yet."
        />
      </Container>
    );
  }

  const sumPredicted = rows.reduce((a, r) => a + Number(r.pinnSavingsKwh ?? 0), 0);
  const sumP5 = rows.reduce((a, r) => a + Number(r.pinnP5LowerKwh ?? 0), 0);
  const sumInvestment = rows.reduce((a, r) => a + Number(r.investmentInr ?? 0), 0);
  const rate = Number(rows[0]?.electricityRateInrKwh ?? 8.0);
  const grades = rows.map((r) => r.confidenceGrade).filter(Boolean) as string[];
  const overallGrade = grades.includes("C") ? "C" : grades.includes("B") ? "B" : grades[0] ?? "C";
  const { loanInr, tenureMonths } = recommended(sumP5, rate, overallGrade);

  // Existing soft commitments on this deal (via the first ECM's id)
  const existing = await db
    .select()
    .from(schema.softCommitments)
    .where(eq(schema.softCommitments.underwritingResultId, rows[0].id))
    .orderBy(desc(schema.softCommitments.signedAt));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Container className="py-10 sm:py-14 print:py-4">
      <div className="print:hidden">
        <PageHeader
          kicker={`Soft commitment · ${deal_id}`}
          title="Letter draft"
          description="Conditional commitment from the lender, contingent on realized final savings ≥ P5 lower bound at Day 30. Not a final loan agreement."
          right={
            <Link href={`/lender/${encodeURIComponent(deal_id)}`}>
              <Button variant="outline">← Back to preview</Button>
            </Link>
          }
        />
      </div>

      {/* Printable letter (visible in both screen + print) */}
      <Card className="mt-8 print:mt-0 print:border-0 print:shadow-none">
        <CardHeader>
          <CardTitle>Letter of Soft Commitment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 leading-relaxed">
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <span className="text-zinc-500">Date:</span> {today}
            </div>
            <div>
              <span className="text-zinc-500">Deal ID:</span>{" "}
              <span className="font-mono">{deal_id}</span>
            </div>
            <div>
              <span className="text-zinc-500">Borrower (MSME):</span>{" "}
              {(rows[0].auditInputsJson as Record<string, unknown> | null)?.["plant_name"]?.toString() ?? "TBD"}
            </div>
            <div>
              <span className="text-zinc-500">Sector:</span> {rows[0].sector}
            </div>
            <div>
              <span className="text-zinc-500">ECMs scope:</span>{" "}
              {rows.map((r) => `${r.ecmId} (${r.equipmentType})`).join(", ")}
            </div>
            <div>
              <span className="text-zinc-500">Overall PINN grade:</span> {overallGrade}
            </div>
          </div>

          <div className="text-sm">
            <p>
              Subject to the conditions below, the undersigned lender hereby provides a{" "}
              <strong>conditional soft commitment</strong> to finance the energy-efficiency
              retrofit deal identified above. This letter is non-binding and does not
              constitute a final loan agreement; it represents the lender&apos;s intent to
              fund based on the Ascertainty underwriting preview produced from the
              in-progress energy audit.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
              Indicative loan terms
            </h3>
            <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[480px] text-sm">
                <tbody>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-500">Total investment (capex)</td>
                    <td className="px-3 py-2 text-right">₹{sumInvestment.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-500">Predicted annual savings (point)</td>
                    <td className="px-3 py-2 text-right">
                      {sumPredicted.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr (≈ ₹
                      {(sumPredicted * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr)
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100 bg-emerald-50/50 dark:border-zinc-800 dark:bg-emerald-950/30">
                    <td className="px-3 py-2 text-emerald-800 dark:text-emerald-300">
                      <strong>P5 lower bound (lender floor)</strong>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {sumP5.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr (≈ ₹
                      {(sumP5 * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr)
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-500">Target DSCR</td>
                    <td className="px-3 py-2 text-right">{TARGET_DSCR}×</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-500">Tenure</td>
                    <td className="px-3 py-2 text-right">{tenureMonths} months</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-500">Target vault IRR</td>
                    <td className="px-3 py-2 text-right">{(VAULT_IRR * 100).toFixed(0)}%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-zinc-500">Indicative loan amount</td>
                    <td className="px-3 py-2 text-right text-lg font-medium">
                      ₹{loanInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-zinc-500">
              Conditions
            </h3>
            <ol className="ml-5 list-decimal space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                Realized annual savings at the Day-30 final audit must be{" "}
                <strong>≥ P5 lower bound</strong> of{" "}
                {sumP5.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/yr.
              </li>
              <li>
                If realized final savings differ from this preview by more than ±15%, terms
                renegotiate using the same DSCR formula on the final savings.
              </li>
              <li>
                IPMVP Option B (metered) post-install validation required for the first
                six months.
              </li>
              <li>
                Final loan documentation, security/collateral arrangements, and disbursement
                conditions to be agreed separately.
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 gap-8 pt-6 sm:grid-cols-2 print:grid-cols-2 print:pt-12">
            <div>
              <div className="border-b border-zinc-300 pb-1 dark:border-zinc-700">&nbsp;</div>
              <div className="mt-1 text-xs text-zinc-500">Lender signature, name, date</div>
            </div>
            <div>
              <div className="border-b border-zinc-300 pb-1 dark:border-zinc-700">&nbsp;</div>
              <div className="mt-1 text-xs text-zinc-500">Borrower acknowledgement (optional)</div>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            This letter is generated from an Ascertainty PINN prediction. The model produces
            calibrated 90% confidence intervals on retrofit savings; the P5 lower bound here
            is the calibrated floor (σ-scale applied per equipment type). Underlying model:{" "}
            {Array.from(new Set(rows.map((r) => r.modelUsed))).filter(Boolean).join(", ")}.
            Sigma scale applied:{" "}
            {Array.from(new Set(rows.map((r) => r.sigmaScaleApplied?.toString()))).filter(Boolean).join(", ")}.
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 print:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Sign / Record</CardTitle>
          </CardHeader>
          <CardContent>
            <SoftCommitForm
              dealId={deal_id}
              recommendedLoanInr={loanInr}
              p5FloorKwh={sumP5}
              recommendedTenureMonths={tenureMonths}
            />
            {existing.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Already recorded
                </h3>
                {existing.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
                  >
                    <div className="font-medium">{s.lenderName}</div>
                    <div className="text-xs text-zinc-500">
                      ₹{Number(s.loanAmountInr).toLocaleString()} at {s.tenureMonths ?? "—"} mo · signed{" "}
                      {new Date(s.signedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
