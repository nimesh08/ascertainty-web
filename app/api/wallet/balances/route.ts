import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

import { getConnection } from "@/lib/solana/program";
import { getWalletBalances } from "@/lib/solana/balances";

export const runtime = "nodejs";
// Revalidate upstream fetches (RPC) every 10s. Individual requests still
// recompute, but within a single render the connection's JSON-RPC POSTs
// benefit from Next's fetch cache. We use dynamic so the handler itself
// always runs.
export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  if (!owner) {
    return NextResponse.json(
      { error: "Missing ?owner=<pubkey>" },
      { status: 400 }
    );
  }
  let pk: PublicKey;
  try {
    pk = new PublicKey(owner);
  } catch {
    return NextResponse.json(
      { error: "Invalid owner pubkey" },
      { status: 400 }
    );
  }
  try {
    const connection = getConnection();
    const balances = await getWalletBalances(connection, pk);
    return NextResponse.json(balances, {
      headers: {
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("/api/wallet/balances", err);
    return NextResponse.json(
      { error: "Failed to fetch balances" },
      { status: 500 }
    );
  }
}
