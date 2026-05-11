import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.createdAt))
      .limit(200);
    return NextResponse.json({
      projects: rows.map((r) => ({
        id: r.id,
        msmeName: r.msmeName,
        sector: r.sector,
        location: r.location,
        upgradeType: r.upgradeType,
        status: r.status,
        targetUsdc: r.targetUsdc,
        tokensSold: r.tokensSold,
        totalDistributed: r.totalDistributed,
        cumulativePerToken: r.cumulativePerToken,
        termMonths: r.termMonths,
        onchainProjectId: r.onchainProjectId?.toString() ?? null,
        onchainPda: r.onchainPda,
        tokenMint: r.tokenMint,
        usdcVault: r.usdcVault,
        activatedAt: r.activatedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("/api/projects", err);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}
