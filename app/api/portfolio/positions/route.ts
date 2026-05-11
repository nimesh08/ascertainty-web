import { NextResponse } from "next/server";
import { getPositionsForWallet } from "@/lib/db/queries/investor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("owner") ?? searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ positions: [] });
  }
  try {
    const positions = await getPositionsForWallet(wallet);
    return NextResponse.json({ positions });
  } catch (err) {
    console.error("/api/portfolio/positions", err);
    return NextResponse.json(
      { positions: [], error: "failed_to_load_positions" },
      { status: 500 }
    );
  }
}
