import { NextResponse } from "next/server";
import { getProjectWithDetails } from "@/lib/db/queries/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const detail = await getProjectWithDetails(id);
    if (!detail) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ project: detail });
  } catch (err) {
    console.error("/api/projects/[id]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
