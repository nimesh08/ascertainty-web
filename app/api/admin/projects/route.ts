import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/projects
 *
 * Called by the admin "new project" wizard AFTER the user has signed and
 * confirmed the bundled on-chain tx (register_mrv + submit_baseline +
 * create_project). This route writes the off-chain DB rows so the UI has
 * something to show before the indexer catches up. The indexer remains the
 * authoritative source of truth and will reconcile rows on the next sweep.
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const required = [
    "onchainProjectId",
    "msmeName",
    "sector",
    "location",
    "upgradeType",
    "targetUsdc",
    "termMonths",
    "projectPda",
    "tokenMint",
    "usdcVault",
    "signature",
    "auditorWallet",
    "fuelType",
    "baselineKwhPerYear",
    "reportHashHex",
  ];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null) {
      return NextResponse.json(
        { error: `missing-field:${key}` },
        { status: 400 }
      );
    }
  }

  try {
    const onchainId = BigInt(String(body.onchainProjectId));

    const [mrv] = await db
      .insert(schema.mrvProjects)
      .values({
        onchainProjectId: onchainId,
        msmeName: String(body.msmeName),
        sector: String(body.sector),
        location: String(body.location),
        upgradeType: String(body.upgradeType),
        baselineSubmitted: true,
        status: "baseline_submitted",
      })
      .returning();

    await db.insert(schema.mrvBaselines).values({
      mrvProjectId: mrv.id,
      auditorWallet: String(body.auditorWallet),
      energyKwhPerYear: BigInt(String(body.baselineKwhPerYear)),
      fuelType: String(body.fuelType),
      reportHash: String(body.reportHashHex),
    });

    const [project] = await db
      .insert(schema.projects)
      .values({
        onchainProjectId: onchainId,
        onchainPda: String(body.projectPda),
        tokenMint: String(body.tokenMint),
        usdcVault: String(body.usdcVault),
        msmeName: String(body.msmeName),
        sector: String(body.sector),
        location: String(body.location),
        upgradeType: String(body.upgradeType),
        targetUsdc: String(body.targetUsdc),
        termMonths: Number(body.termMonths),
        status: "funding",
        mrvProjectId: mrv.id,
        // Optional admin content (all NULLABLE)
        description:
          typeof body.description === "string" && body.description.trim()
            ? String(body.description)
            : null,
        aboutProject:
          typeof body.aboutProject === "string" && body.aboutProject.trim()
            ? String(body.aboutProject)
            : null,
        managementText:
          typeof body.managementText === "string" && body.managementText.trim()
            ? String(body.managementText)
            : null,
        financialsText:
          typeof body.financialsText === "string" && body.financialsText.trim()
            ? String(body.financialsText)
            : null,
        highlights: Array.isArray(body.highlights)
          ? (body.highlights as Array<{
              title: string;
              detail: string;
              icon?: string;
            }>)
          : null,
        documents: Array.isArray(body.documents)
          ? (body.documents as Array<{ name: string; url: string }>)
          : null,
        trustScore:
          typeof body.trustScore === "number" &&
          Number.isFinite(body.trustScore)
            ? Math.round(body.trustScore)
            : null,
        expectedApyBps:
          typeof body.expectedApyBps === "number" &&
          Number.isFinite(body.expectedApyBps)
            ? Math.round(body.expectedApyBps)
            : null,
      })
      .returning();

    await db
      .insert(schema.transactions)
      .values({
        txSig: String(body.signature),
        txType: "create_project",
        projectId: project.id,
        walletPubkey: session.wallet,
      })
      .onConflictDoNothing({ target: schema.transactions.txSig });

    return NextResponse.json({ projectId: project.id, mrvId: mrv.id });
  } catch (err) {
    console.error("POST /api/admin/projects", err);
    return NextResponse.json(
      {
        error: "db-error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
