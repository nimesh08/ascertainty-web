import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN, type Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPositionPda } from "../pda";

export interface BuyProjectTokensArgs {
  program: Program<Exira>;
  investor: PublicKey;
  projectPda: PublicKey;
  tokenMint: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
  amountUsdc: bigint;
}

export async function buildBuyProjectTokens(
  args: BuyProjectTokensArgs
): Promise<Transaction> {
  const { program, investor, projectPda, tokenMint, usdcVault, usdcMint, amountUsdc } = args;
  const [position] = findPositionPda(projectPda, investor);
  const investorUsdcAta = getAssociatedTokenAddressSync(usdcMint, investor, false);
  const investorTokenAta = getAssociatedTokenAddressSync(tokenMint, investor, false);

  const ix = await program.methods
    .buyProjectTokens(new BN(amountUsdc.toString()))
    .accountsPartial({
      project: projectPda,
      tokenMint,
      usdcVault,
      investor,
      investorUsdcAta,
      investorTokenAta,
      position,
      usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();

  return new Transaction().add(ix);
}
