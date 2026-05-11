import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPositionPda } from "../pda";

export interface ClaimProjectReturnsArgs {
  program: Program<Exira>;
  investor: PublicKey;
  projectPda: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
}

export async function buildClaimProjectReturns(
  args: ClaimProjectReturnsArgs
): Promise<Transaction> {
  const { program, investor, projectPda, usdcVault, usdcMint } = args;
  const [position] = findPositionPda(projectPda, investor);
  const investorUsdcAta = getAssociatedTokenAddressSync(usdcMint, investor, false);

  const ix = await program.methods
    .claimProjectReturns()
    .accountsPartial({
      project: projectPda,
      usdcVault,
      investor,
      position,
      investorUsdcAta,
      usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();

  return new Transaction().add(ix);
}
