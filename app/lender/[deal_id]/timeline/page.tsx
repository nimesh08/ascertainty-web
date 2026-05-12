import Link from "next/link";
import { eq, asc } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimelineScrubber, type Snapshot } from "@/components/lender/timeline-scrubber";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DealTimelinePage({
  params,
}: {
  params: Promise<{ deal_id: string }>;
}) {
  const { deal_id } = await params;

  const ecms = await db
    .select()
    .from(schema.underwritingResults)
    .where(eq(schema.underwritingResults.dealId, deal_id))
    .orderBy(asc(schema.underwritingResults.ecmId));

  if (ecms.length === 0) {
    return (
      <Container className="py-10 sm:py-14">
        <PageHeader
          kicker={`Audit timeline · ${deal_id}`}
          title="Deal not found"
          description="No predictions on file for this deal yet."
        />
      </Container>
    );
  }

  // Pull all snapshots across all ECMs of this deal, ordered by day/time
  const allSnapshots = await db
    .select()
    .from(schema.underwritingSnapshots)
    .where(
      eq(
        schema.underwritingSnapshots.underwritingResultId,
        ecms[0].id // primary ECM for v0.2; multi-ECM aggregation comes later
      )
    )
    .orderBy(asc(schema.underwritingSnapshots.snapshotDay));

  const rate = Number(ecms[0]?.electricityRateInrKwh ?? 8.0);

  const snapshots: Snapshot[] = allSnapshots.map((s) => ({
    id: s.id,
    day: s.snapshotDay,
    label: s.label,
    predicted_kwh: Number(s.pinnSavingsKwh ?? 0),
    p5_kwh: Number(s.pinnP5LowerKwh ?? 0),
    p95_kwh: Number(s.pinnP95UpperKwh ?? 0),
    sigma_kwh: Number(s.pinnSigmaKwh ?? 0),
    grade: (s.confidenceGrade as "A" | "B" | "C" | null) ?? null,
    model_used: s.modelUsed,
    snapshot_at: s.snapshotAt.toISOString(),
  }));

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker={`Audit timeline · ${deal_id}`}
        title={`How the underwriting tightened over ${snapshots.length} snapshots`}
        description="Each row is a /predict call from the auditor's intake form. As more measurements come in, the σ shrinks, the band tightens, and the P5 floor firms up — that's the calibrated-uncertainty-on-small-data moat made visible."
        right={
          <Link href={`/lender/${encodeURIComponent(deal_id)}`}>
            <Button variant="outline">← Back to lender preview</Button>
          </Link>
        }
      />

      <div className="mt-8">
        {snapshots.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No snapshots recorded yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-fg-muted">
                Every prediction created via{" "}
                <code className="rounded bg-bg-2/60 px-1">/api/predict</code>{" "}
                appends a snapshot. Once the auditor has saved at least one
                prediction (or you seed one via the demo script), it shows up
                here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <TimelineScrubber
            dealId={deal_id}
            snapshots={snapshots}
            electricityRateInrKwh={rate}
          />
        )}
      </div>
    </Container>
  );
}
