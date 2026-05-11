import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HighlightSchema = z.object({
  title: z.string().max(80),
  detail: z.string().max(280),
  icon: z.string().max(32).optional(),
});

const DocumentSchema = z.object({
  name: z.string().max(120),
  url: z.string().max(2048),
});

const PatchSchema = z
  .object({
    description: z.string().max(10_000).nullable().optional(),
    aboutProject: z.string().max(5_000).nullable().optional(),
    highlights: z.array(HighlightSchema).max(24).nullable().optional(),
    managementText: z.string().max(5_000).nullable().optional(),
    financialsText: z.string().max(5_000).nullable().optional(),
    documents: z.array(DocumentSchema).max(48).nullable().optional(),
    trustScore: z
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional(),
    expectedApyBps: z
      .number()
      .int()
      .min(0)
      .max(10_000)
      .nullable()
      .optional(),
  })
  .strict();

/**
 * PATCH /api/admin/projects/[id]
 *
 * Admins can update the descriptive content fields (description, about,
 * highlights, management, financials, documents, trustScore, expectedApyBps).
 * None of these are on-chain — the indexer preserves them on each sync.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Only include keys the caller actually sent; Drizzle treats `undefined`
  // as "skip", but we also want to allow explicit `null` to clear a field.
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  try {
    const updated = await db
      .update(schema.projects)
      .set(patch)
      .where(eq(schema.projects.id, id))
      .returning({ id: schema.projects.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: updated[0].id });
  } catch (err) {
    console.error("PATCH /api/admin/projects/[id]", err);
    return NextResponse.json(
      { error: "db-error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
