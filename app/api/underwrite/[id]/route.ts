import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/underwrite/[id]
 *
 * `[id]` can be either:
 *   - the deal_id (human-readable slug; returns all ECMs for the deal), OR
 *   - an underwriting_results.id (uuid; returns one ECM)
 *
 * Public read — lenders need to view soft-commitment preview without auth.
 * (We could later require Privy session if needed for compliance.)
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "missing-id" }, { status: 400 });

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  try {
    if (isUuid) {
      const rows = await db
        .select()
        .from(schema.underwritingResults)
        .where(eq(schema.underwritingResults.id, id))
        .limit(1);
      if (rows.length === 0) {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }
      return NextResponse.json({ result: rows[0] });
    }

    const rows = await db
      .select()
      .from(schema.underwritingResults)
      .where(eq(schema.underwritingResults.dealId, id));
    if (rows.length === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ deal_id: id, ecms: rows });
  } catch (err) {
    console.error("GET /api/underwrite/[id]", err);
    return NextResponse.json(
      { error: "db-error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
