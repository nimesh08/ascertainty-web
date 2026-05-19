import Link from "next/link";
import { eq } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavingsBand } from "@/components/auditor/savings-band";
import { KPITile } from "@/components/shared/KPITile";
import { EligibilityBanner } from "@/components/shared/EligibilityBanner";
import { PolicyComplianceRow } from "@/components/shared/PolicyComplianceRow";
import { DistributionChart } from "@/components/shared/DistributionChart";
import {
  evaluatePolicy,
  type PolicyEvaluation,
} from "@/lib/underwriting/policy";
import { prettyEquipment, cleanModelName, sortEcmsNumerically, prettySector } from "@/lib/utils/equipment";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const fmtInr = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtRatio = (n: number) => `${n.toFixed(2)}×`;

export default async function LenderDealPage({
  params,
}: {
  params: Promise<{ deal_id: string }>;
}) {
  const { deal_id } = await params;

  const rows = sortEcmsNumerically(
    await db
      .select()
      .from(schema.underwritingResults)
      .where(eq(schema.underwritingResults.dealId, deal_id))
  );

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

  // Deal-level aggregates
  const sumPredicted = rows.reduce((a, r) => a + Number(r.pinnSavingsKwh ?? 0), 0);
  const sumP5 = rows.reduce((a, r) => a + Number(r.pinnP5LowerKwh ?? 0), 0);
  const sumP95 = rows.reduce((a, r) => a + Number(r.pinnP95UpperKwh ?? 0), 0);
  const sumSigma = Math.sqrt(
    rows.reduce((a, r) => a + Math.pow(Number(r.pinnSigmaKwh ?? 0), 2), 0)
  );
  const sumInvestment = rows.reduce((a, r) => a + Number(r.investmentInr ?? 0), 0);
  const rate = Number(rows[0]?.electricityRateInrKwh ?? 8.0);

  const grades = rows.map((r) => r.confidenceGrade).filter(Boolean) as Array<
    "A" | "B" | "C"
  >;
  const overallGrade: "A" | "B" | "C" = grades.includes("C")
    ? "C"
    : grades.includes("B")
      ? "B"
      : grades[0] ?? "C";

  // Borrower EBITDA — take first non-null across ECMs (a single borrower per deal)
  const borrowerEbitdaInr = rows
    .map((r) => (r.borrowerEbitdaInr != null ? Number(r.borrowerEbitdaInr) : null))
    .find((v) => v != null) as number | undefined;

  // Worst payback across ECMs governs tenor/payback policy check
  const worstPaybackMonths = rows.reduce<number | null>((acc, r) => {
    const p = r.paybackMonths != null ? Number(r.paybackMonths) : null;
    if (p == null) return acc;
    if (acc == null) return p;
    return Math.max(acc, p);
  }, null);

  const evaluation: PolicyEvaluation = evaluatePolicy({
    predictedKwh: sumPredicted,
    p5Kwh: sumP5,
    p50Kwh: sumPredicted,
    grade: overallGrade,
    electricityRateInrKwh: rate,
    investmentInr: sumInvestment,
    paybackMonths: worstPaybackMonths,
    borrowerEbitdaInr: borrowerEbitdaInr ?? null,
  });

  const filledEcms = rows.length;
  const sector = rows[0]?.sector ?? "—";
  const linkedProjectId = rows[0]?.projectId ?? null;
  const auditorWallet = rows[0]?.auditorWallet?.slice(0, 8) ?? "—";
  const dealEligibleForCommit =
    evaluation.status === "eligible" || evaluation.status === "eligible_enhanced_mv";

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker={`Lender preview · ${deal_id}`}
        title={`${filledEcms} ECM${filledEcms === 1 ? "" : "s"} · ${prettySector(sector)}`}
        description="Live underwriting from the auditor's measurements. DSCR at P5 is the governing metric — soft commitment is conditional on every §5 threshold clearing."
        right={
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link href={`/lender/${encodeURIComponent(deal_id)}/timeline`}>
                <Button variant="outline" className="rounded-full">View audit timeline</Button>
              </Link>
              {dealEligibleForCommit ? (
                <Link href={`/lender/${encodeURIComponent(deal_id)}/soft-commit`}>
                  <Button size="lg" className="rounded-full">Sign soft commitment →</Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="rounded-full"
                  title="Deal does not currently clear all §5 underwriting thresholds. See ineligibility detail."
                >
                  Sign soft commitment →
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-fg-muted">
              {linkedProjectId ? (
                <Link
                  href={`/projects/${linkedProjectId}`}
                  className="underline underline-offset-2 hover:text-accent"
                >
                  Investor view ↗
                </Link>
              ) : null}
              <Link
                href="/docs/underwriting-policy"
                className="underline underline-offset-2 hover:text-accent"
              >
                Underwriting policy ↗
              </Link>
            </div>
          </div>
        }
      />

      <div className="mt-6">
        <EligibilityBanner evaluation={evaluation} />
      </div>

      {/* Headline KPI grid */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPITile
          label="DSCR @ P5"
          value={fmtRatio(evaluation.dscrAtP5)}
          sublabel="Threshold ≥ 1.30× · §5.1"
          status={evaluation.dscrAtP5 >= 1.3 ? "ok" : "fail"}
          emphasis="headline"
        />
        <KPITile
          label="DSCR @ P50"
          value={fmtRatio(evaluation.dscrAtP50)}
          sublabel="Threshold ≥ 1.75× · §5.1"
          status={evaluation.dscrAtP50 >= 1.75 ? "ok" : "fail"}
        />
        <KPITile
          label="EBITDA Coverage"
          value={
            evaluation.ebitdaCoverage != null ? fmtRatio(evaluation.ebitdaCoverage) : "—"
          }
          sublabel={
            evaluation.ebitdaCoverage != null
              ? "If retrofit savings = 0 · §5.1"
              : "Borrower financials pending"
          }
          status={
            evaluation.ebitdaCoverage == null
              ? "neutral"
              : evaluation.ebitdaCoverage >= 1.8
                ? "ok"
                : "fail"
          }
        />
        <KPITile
          label="Recommended loan"
          value={fmtInr(evaluation.loanInr)}
          sublabel={`${evaluation.tenureMonths} mo @ 14% · DSCR target 1.30×`}
        />
      </div>

      {/* Policy compliance */}
      <div className="mt-6">
        <PolicyComplianceRow checks={evaluation.checks} />
      </div>

      {/* Distribution chart for the deal */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">
              Predicted savings distribution
            </div>
            <CardTitle className="text-base">
              Calibrated band — μ {Math.round(sumPredicted).toLocaleString()} kWh/yr ± σ{" "}
              {Math.round(sumSigma).toLocaleString()} kWh
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="border-line bg-bg-2 text-[10px] text-fg-muted"
          >
            Aggregated across {filledEcms} ECM{filledEcms === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <CardContent>
          <DistributionChart
            predictedKwh={sumPredicted}
            sigmaKwh={sumSigma}
            p5Kwh={sumP5}
            p95Kwh={sumP95}
            electricityRateInrKwh={rate}
          />
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-fg-muted">
            <span>
              Audit progress: <span className="text-fg">{filledEcms} ECMs</span>
            </span>
            <span>
              Auditor: <span className="font-mono text-fg">{auditorWallet}…</span>
            </span>
            <span>
              Total CapEx:{" "}
              <span className="text-fg">{fmtInr(sumInvestment)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Per-ECM breakdown */}
      <div className="mt-8 space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          Per-ECM detail
        </h2>
        {rows.map((r) => {
          const point = Number(r.pinnSavingsKwh ?? 0);
          const p5 = Number(r.pinnP5LowerKwh ?? 0);
          const p95 = Number(r.pinnP95UpperKwh ?? 0);
          const grade = (r.confidenceGrade as "A" | "B" | "C" | null) ?? undefined;
          const ecmDscrAtP5 =
            r.dscrAtP5 != null
              ? Number(r.dscrAtP5)
              : evaluatePolicy({
                  predictedKwh: point,
                  p5Kwh: p5,
                  p50Kwh: point,
                  grade: grade ?? "C",
                  electricityRateInrKwh: Number(r.electricityRateInrKwh ?? 8.0),
                  investmentInr: Number(r.investmentInr ?? 0),
                  paybackMonths: r.paybackMonths != null ? Number(r.paybackMonths) : null,
                  borrowerEbitdaInr:
                    r.borrowerEbitdaInr != null ? Number(r.borrowerEbitdaInr) : null,
                }).dscrAtP5;
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    <span className="font-mono text-sm text-fg-muted">ECM {r.ecmId}</span>
                    <span className="mx-2 text-fg-faint">·</span>
                    {prettyEquipment(r.equipmentType)}
                  </CardTitle>
                  <span className="shrink-0 text-xs text-fg-muted">
                    {cleanModelName(r.modelUsed)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <SavingsBand
                  predictedKwh={point}
                  p5Kwh={p5}
                  p95Kwh={p95}
                  grade={grade}
                  electricityRateInrKwh={Number(r.electricityRateInrKwh ?? 8.0)}
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <KPITile
                    label="DSCR @ P5"
                    value={fmtRatio(ecmDscrAtP5)}
                    status={ecmDscrAtP5 >= 1.3 ? "ok" : "fail"}
                  />
                  <KPITile
                    label="Grade"
                    value={grade ?? "—"}
                    status={
                      grade === "A" ? "ok" : grade === "B" ? "warn" : grade === "C" ? "fail" : "neutral"
                    }
                  />
                  <KPITile
                    label="Payback (P5)"
                    value={
                      r.p5PaybackMonths != null
                        ? `${Number(r.p5PaybackMonths).toFixed(1)} mo`
                        : "—"
                    }
                  />
                  <KPITile
                    label="Investment"
                    value={r.investmentInr ? fmtInr(Number(r.investmentInr)) : "—"}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
