import { NextResponse } from "next/server";
import { getPool } from "@/lib/db/queries/pools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const detail = await getPool(id);
    if (!detail) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ pool: detail });
  } catch (err) {
    console.error("/api/pools/[id]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
