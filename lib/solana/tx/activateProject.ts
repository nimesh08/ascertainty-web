import { PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPlatformPda } from "../pda";

export interface ActivateProjectArgs {
  program: Program<Exira>;
  admin: PublicKey;
  treasury: PublicKey;
  projectPda: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
}

export async function buildActivateProject(
  args: ActivateProjectArgs
): Promise<Transaction> {
  const { program, admin, treasury, projectPda, usdcVault, usdcMint } = args;
  const [platformPda] = findPlatformPda();
  const treasuryUsdcAta = getAssociatedTokenAddressSync(usdcMint, treasury, false);

  const ix = await program.methods
    .activateProject()
    .accountsPartial({
      platform: platformPda,
      admin,
      project: projectPda,
      usdcVault,
      treasuryUsdcAta,
      treasury,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  return new Transaction().add(ix);
}
