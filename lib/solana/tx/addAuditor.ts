import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPlatformPda, findAuditorPda } from "../pda";

export async function buildAddAuditor(args: {
  program: Program<Exira>;
  admin: PublicKey;
  auditorWallet: PublicKey;
  name: string;
  certification: string;
}): Promise<Transaction> {
  const [platformPda] = findPlatformPda();
  const [auditorPda] = findAuditorPda(args.auditorWallet);

  const ix = await args.program.methods
    .addAuditor(args.name, args.certification)
    .accountsPartial({
      platform: platformPda,
      admin: args.admin,
      auditorWallet: args.auditorWallet,
      auditor: auditorPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}
