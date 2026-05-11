import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") ?? searchParams.get("owner");
  if (!wallet) {
    return NextResponse.json({ transactions: [] });
  }
  try {
    const txs = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.walletPubkey, wallet))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(200);
    return NextResponse.json({
      transactions: txs.map((t) => ({
        ...t,
        slot: t.slot?.toString() ?? null,
      })),
    });
  } catch (err) {
    console.error("/api/portfolio/transactions", err);
    return NextResponse.json({ transactions: [] }, { status: 500 });
  }
}
