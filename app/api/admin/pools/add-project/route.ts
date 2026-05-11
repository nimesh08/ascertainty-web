import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/pools/add-project
 *
 * Records a link between a pool and an underlying project after the on-chain
 * `add_project_to_pool` ix has landed. The link PDA is not persisted — it is
 * deterministic from (pool, project) PDAs and easily re-derived off-chain.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const poolId = body.poolId ? String(body.poolId) : null;
  const projectId = body.projectId ? String(body.projectId) : null;
  const signature = body.signature ? String(body.signature) : null;
  if (!poolId || !projectId || !signature) {
    return NextResponse.json(
      { error: "missing-fields", required: ["poolId", "projectId", "signature"] },
      { status: 400 }
    );
  }
  try {
    await db
      .insert(schema.poolProjects)
      .values({ poolId, projectId })
      .onConflictDoNothing({
        target: [schema.poolProjects.poolId, schema.poolProjects.projectId],
      });
    await db
      .insert(schema.transactions)
      .values({
        txSig: signature,
        txType: "add_to_pool",
        poolId,
        projectId,
        walletPubkey: session.wallet,
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/pools/add-project", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
