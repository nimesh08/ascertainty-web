import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN, type Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import {
  findPlatformPda,
  findMrvProjectPda,
  findBaselinePda,
  findVerificationPda,
  findAuditorPda,
} from "../pda";

export async function buildRegisterMrvProject(args: {
  program: Program<Exira>;
  admin: PublicKey;
  projectId: number | bigint;
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
}): Promise<{ tx: Transaction; mrvPda: PublicKey }> {
  const [platformPda] = findPlatformPda();
  const [mrvPda] = findMrvProjectPda(args.projectId);

  const ix = await args.program.methods
    .registerMrvProject(
      new BN(args.projectId.toString()),
      args.msmeName,
      args.sector,
      args.location,
      args.upgradeType
    )
    .accountsPartial({
      platform: platformPda,
      admin: args.admin,
      mrvProject: mrvPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return { tx: new Transaction().add(ix), mrvPda };
}

export async function buildSubmitBaseline(args: {
  program: Program<Exira>;
  auditor: PublicKey;
  mrvPda: PublicKey;
  energyKwhPerYear: bigint;
  fuelType: string;
  costInrPerYear: bigint;
  co2TonsPerYearX100: bigint;
  reportHash: Uint8Array; // 32 bytes
}): Promise<Transaction> {
  if (args.reportHash.length !== 32) {
    throw new Error("reportHash must be 32 bytes");
  }
  const [auditorPda] = findAuditorPda(args.auditor);
  const [baselinePda] = findBaselinePda(args.mrvPda);

  const ix = await args.program.methods
    .submitBaseline(
      new BN(args.energyKwhPerYear.toString()),
      args.fuelType,
      new BN(args.costInrPerYear.toString()),
      new BN(args.co2TonsPerYearX100.toString()),
      Array.from(args.reportHash)
    )
    .accountsPartial({
      auditorSigner: args.auditor,
      auditor: auditorPda,
      mrvProject: args.mrvPda,
      baseline: baselinePda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildSubmitVerification(args: {
  program: Program<Exira>;
  auditor: PublicKey;
  mrvPda: PublicKey;
  index: number;
  periodStart: bigint; // unix seconds
  periodEnd: bigint;
  energyKwhSaved: bigint;
  costInrSaved: bigint;
  co2TonsAvoidedX100: bigint;
  savingsVsExpectedBps: number;
  reportHash: Uint8Array;
}): Promise<Transaction> {
  if (args.reportHash.length !== 32) {
    throw new Error("reportHash must be 32 bytes");
  }
  const [auditorPda] = findAuditorPda(args.auditor);
  const [verificationPda] = findVerificationPda(args.mrvPda, args.index);

  const ix = await args.program.methods
    .submitVerification(
      args.index,
      new BN(args.periodStart.toString()),
      new BN(args.periodEnd.toString()),
      new BN(args.energyKwhSaved.toString()),
      new BN(args.costInrSaved.toString()),
      new BN(args.co2TonsAvoidedX100.toString()),
      args.savingsVsExpectedBps,
      Array.from(args.reportHash)
    )
    .accountsPartial({
      auditorSigner: args.auditor,
      auditor: auditorPda,
      mrvProject: args.mrvPda,
      verification: verificationPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildAttestVerification(args: {
  program: Program<Exira>;
  auditor: PublicKey;
  mrvPda: PublicKey;
  index: number;
}): Promise<Transaction> {
  const [auditorPda] = findAuditorPda(args.auditor);
  const [verificationPda] = findVerificationPda(args.mrvPda, args.index);

  const ix = await args.program.methods
    .attestVerification()
    .accountsPartial({
      auditorSigner: args.auditor,
      auditor: auditorPda,
      mrvProject: args.mrvPda,
      verification: verificationPda,
    })
    .instruction();
  return new Transaction().add(ix);
}
