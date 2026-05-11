import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ isAdmin: false });
  }
  try {
    const rows = await db
      .select()
      .from(schema.adminWallets)
      .where(eq(schema.adminWallets.walletPubkey, wallet))
      .limit(1);
    return NextResponse.json({ isAdmin: rows.length > 0 });
  } catch (err) {
    console.error("/api/admin/check", err);
    return NextResponse.json({ isAdmin: false });
  }
}
