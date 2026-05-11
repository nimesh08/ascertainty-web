import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.pools)
      .orderBy(desc(schema.pools.createdAt))
      .limit(200);
    return NextResponse.json({
      pools: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        targetUsdc: r.targetUsdc,
        tokensSold: r.tokensSold,
        totalDistributed: r.totalDistributed,
        cumulativePerToken: r.cumulativePerToken,
        onchainPoolId: r.onchainPoolId?.toString() ?? null,
        onchainPda: r.onchainPda,
        poolTokenMint: r.poolTokenMint,
        usdcVault: r.usdcVault,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("/api/pools", err);
    return NextResponse.json({ pools: [] }, { status: 500 });
  }
}
