"use client";

import { Connection, PublicKey } from "@solana/web3.js";
import { getReadOnlyProgram } from "@/lib/solana/program";
import { findPositionPda } from "@/lib/solana/pda";
import BN from "bn.js";

export interface PositionData {
  exists: boolean;
  tokensHeld: bigint;
  totalClaimed: bigint;
  lastClaimedPerToken: bigint;
}

export async function fetchPosition(
  connection: Connection,
  targetPda: PublicKey,
  owner: PublicKey
): Promise<PositionData> {
  const program = getReadOnlyProgram(connection);
  const [positionPda] = findPositionPda(targetPda, owner);
  try {
    const acct = (await program.account.investorPosition.fetchNullable(
      positionPda
    )) as unknown as {
      tokensHeld: BN;
      totalClaimed: BN;
      lastClaimedPerToken: BN;
    } | null;
    if (!acct) {
      return {
        exists: false,
        tokensHeld: 0n,
        totalClaimed: 0n,
        lastClaimedPerToken: 0n,
      };
    }
    return {
      exists: true,
      tokensHeld: BigInt(acct.tokensHeld.toString()),
      totalClaimed: BigInt(acct.totalClaimed.toString()),
      lastClaimedPerToken: BigInt(acct.lastClaimedPerToken.toString()),
    };
  } catch (err) {
    console.warn("fetchPosition", err);
    return {
      exists: false,
      tokensHeld: 0n,
      totalClaimed: 0n,
      lastClaimedPerToken: 0n,
    };
  }
}

/** cumulative_per_token is scaled by PRECISION (1e12). */
const PRECISION = 1_000_000_000_000n;

/**
 * Estimate claimable USDC for a position.
 * claimable = tokens_held * (cumulative_per_token - last_claimed_per_token) / PRECISION
 */
export function claimableFromPosition(args: {
  tokensHeld: bigint;
  lastClaimedPerToken: bigint;
  cumulativePerToken: bigint;
}): bigint {
  if (args.tokensHeld === 0n) return 0n;
  const delta = args.cumulativePerToken - args.lastClaimedPerToken;
  if (delta <= 0n) return 0n;
  return (args.tokensHeld * delta) / PRECISION;
}
