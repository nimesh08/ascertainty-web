import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { BN, type Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPlatformPda, findProjectPda } from "../pda";

export interface WithdrawProjectFundsArgs {
  program: Program<Exira>;
  admin: PublicKey;
  /** On-chain project_id (u64). */
  projectId: bigint;
  projectPda: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
  /** Wallet whose USDC ATA should receive the withdrawal. */
  destinationOwner: PublicKey;
  /** Prepend createAssociatedTokenAccountIdempotent for the destination ATA. */
  createDestinationAta: boolean;
  /** Amount in USDC base units (6 decimals). */
  amountUsdc: bigint;
}

/**
 * Build an admin-signed withdraw_project_funds transaction.
 *
 * The on-chain program is PDA-authority over `usdc_vault`, so the admin simply
 * signs as `platform.admin`. The destination must be a USDC ATA (any owner).
 */
export async function buildWithdrawProjectFunds(
  args: WithdrawProjectFundsArgs
): Promise<{ tx: Transaction; destinationAta: PublicKey }> {
  const {
    program,
    admin,
    projectId,
    projectPda,
    usdcVault,
    usdcMint,
    destinationOwner,
    createDestinationAta,
    amountUsdc,
  } = args;

  const [platformPda] = findPlatformPda();
  // projectPda is derived from projectId; we accept it from the caller to avoid
  // redundant work, but keep the helper resilient if caller passes a mismatch.
  const [expectedPda] = findProjectPda(projectId);
  if (!projectPda.equals(expectedPda)) {
    throw new Error(
      `project PDA mismatch: passed ${projectPda.toBase58()}, expected ${expectedPda.toBase58()} for project_id ${projectId}`
    );
  }

  const destinationAta = getAssociatedTokenAddressSync(
    usdcMint,
    destinationOwner,
    // allowOwnerOffCurve = false; admins send to normal wallets. If the admin
    // ever needs to send to a PDA-owned ATA they can build that flow manually.
    false
  );

  const tx = new Transaction();
  if (createDestinationAta) {
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        admin,
        destinationAta,
        destinationOwner,
        usdcMint
      )
    );
  }

  const ix = await program.methods
    .withdrawProjectFunds(new BN(amountUsdc.toString()))
    .accountsPartial({
      platform: platformPda,
      admin,
      project: projectPda,
      usdcVault,
      destination: destinationAta,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  tx.add(ix);

  return { tx, destinationAta };
}
