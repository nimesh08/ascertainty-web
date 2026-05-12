import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { AuditorIntakeForm } from "@/components/auditor/intake-form";
import { getAuditorSession } from "@/lib/auditor/session";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditorDealIntakePage({
  params,
}: {
  params: Promise<{ deal_id: string }>;
}) {
  const session = await getAuditorSession();
  if (!session) redirect("/?error=auditor-required");
  const { deal_id } = await params;
  if (!deal_id) redirect("/auditor/intake");

  const rows = await db
    .select()
    .from(schema.underwritingResults)
    .where(eq(schema.underwritingResults.dealId, deal_id))
    .orderBy(asc(schema.underwritingResults.ecmId));

  const latest = rows[rows.length - 1] ?? null;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        kicker={`Auditor intake · ${deal_id}`}
        title={latest ? `Continuing ${latest.equipmentType} ECM` : "New ECM on existing deal"}
        description={
          rows.length > 0
            ? `${rows.length} ECM${rows.length === 1 ? "" : "s"} recorded so far. Add another or update the most recent.`
            : "No ECMs yet on this deal — start with a compressed-air leakage ECM."
        }
      />
      <div className="mt-8">
        <AuditorIntakeForm
          dealId={deal_id}
          initial={
            latest
              ? {
                  ecmId: latest.ecmId,
                  auditInputsJson: latest.auditInputsJson as Record<string, unknown> | null,
                  predictionJson: latest.predictionJson as Record<string, unknown> | null,
                }
              : null
          }
        />
      </div>
      {rows.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            ECMs already on this deal
          </h2>
          <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 text-left">ECM</th>
                  <th className="px-3 py-2 text-left">Equipment</th>
                  <th className="px-3 py-2 text-right">Baseline</th>
                  <th className="px-3 py-2 text-right">PINN savings</th>
                  <th className="px-3 py-2 text-right">P5 floor</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-2 font-mono">{r.ecmId}</td>
                    <td className="px-3 py-2">{r.equipmentType}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(r.baselineKwhPerYear).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.pinnSavingsKwh
                        ? Number(r.pinnSavingsKwh).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.pinnP5LowerKwh
                        ? Number(r.pinnP5LowerKwh).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : "—"}
                    </td>
                    <td className="px-3 py-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
}
