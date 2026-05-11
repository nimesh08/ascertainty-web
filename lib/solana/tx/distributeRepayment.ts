import { PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN, type Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPlatformPda } from "../pda";

export interface DistributeRepaymentArgs {
  program: Program<Exira>;
  admin: PublicKey;
  projectPda: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
  amountUsdc: bigint;
}

export async function buildDistributeRepayment(
  args: DistributeRepaymentArgs
): Promise<Transaction> {
  const { program, admin, projectPda, usdcVault, usdcMint, amountUsdc } = args;
  const [platformPda] = findPlatformPda();
  const adminUsdcAta = getAssociatedTokenAddressSync(usdcMint, admin, false);

  const ix = await program.methods
    .distributeRepayment(new BN(amountUsdc.toString()))
    .accountsPartial({
      platform: platformPda,
      admin,
      project: projectPda,
      adminUsdcAta,
      usdcVault,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  return new Transaction().add(ix);
}
