import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/auditors — upserts the DB row after the on-chain
 * `add_auditor` ix confirms. `onchainRegistered` is set to true once the
 * transaction lands; active/inactive is an off-chain flag toggled via PATCH.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const walletPubkey = body.walletPubkey ? String(body.walletPubkey) : null;
  const name = body.name ? String(body.name) : null;
  const certification = body.certification ? String(body.certification) : null;
  const signature = body.signature ? String(body.signature) : null;
  if (!walletPubkey || !name || !certification || !signature) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }
  try {
    await db
      .insert(schema.auditors)
      .values({
        walletPubkey,
        name,
        certification,
        onchainRegistered: true,
      })
      .onConflictDoNothing({ target: schema.auditors.walletPubkey });
    await db
      .insert(schema.transactions)
      .values({
        txSig: signature,
        txType: "add_auditor",
        walletPubkey: session.wallet,
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/admin/auditors", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/auditors — off-chain active/inactive flag. Does not touch
 * the on-chain registry.
 */
export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const walletPubkey = body.walletPubkey ? String(body.walletPubkey) : null;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;
  if (!walletPubkey || isActive === null) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }
  try {
    await db
      .update(schema.auditors)
      .set({ isActive })
      .where(eq(schema.auditors.walletPubkey, walletPubkey));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/admin/auditors", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
