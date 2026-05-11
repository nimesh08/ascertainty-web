import { PublicKey, SystemProgram, Transaction, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN, type Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import {
  findMrvProjectPda,
  findBaselinePda,
  findProjectPda,
  findPlatformPda,
  findAuditorPda,
} from "../pda";

export interface CreateProjectBundleArgs {
  program: Program<Exira>;
  admin: PublicKey;
  auditor: PublicKey; // auditor wallet (must already be registered on-chain)
  projectId: number | bigint; // off-chain chosen id (u64); caller picks uniquely
  msmeName: string;
  sector: string;
  location: string;
  upgradeType: string;
  fuelType: string;
  baselineKwhPerYear: bigint;
  baselineCostInrPerYear: bigint;
  baselineCo2TonsPerYearX100: bigint;
  reportHash: Uint8Array; // 32 bytes
  targetUsdc: bigint;
  termMonths: number;
  usdcMint: PublicKey;
}

export interface CreateProjectBundleOutput {
  tx: Transaction;
  tokenMintKeypair: Keypair;
  mrvPda: PublicKey;
  projectPda: PublicKey;
  usdcVault: PublicKey;
  signers: Keypair[]; // extra signers needed (the fresh token mint keypair)
}

/**
 * Atomically bundle three instructions into one transaction:
 *   register_mrv_project + submit_baseline + create_project
 *
 * This is the "add project" admin wizard flow.
 *
 * Requires BOTH the admin (platform admin) and the auditor to sign.
 * If admin == auditor in dev/test, still pass the same key for both.
 * Additional signer: the fresh SPL mint Keypair (stored in output.tokenMintKeypair).
 */
export async function buildCreateProjectBundle(
  args: CreateProjectBundleArgs
): Promise<CreateProjectBundleOutput> {
  const { program, admin, auditor, projectId, usdcMint } = args;

  const [platformPda] = findPlatformPda();
  const [mrvPda] = findMrvProjectPda(projectId);
  const [baselinePda] = findBaselinePda(mrvPda);
  const [projectPda] = findProjectPda(projectId);
  const [auditorPda] = findAuditorPda(auditor);
  const tokenMintKp = Keypair.generate();
  const usdcVault = getAssociatedTokenAddressSync(usdcMint, projectPda, true);

  if (args.reportHash.length !== 32) {
    throw new Error("reportHash must be 32 bytes");
  }

  const registerIx = await program.methods
    .registerMrvProject(
      new BN(projectId.toString()),
      args.msmeName,
      args.sector,
      args.location,
      args.upgradeType
    )
    .accountsPartial({
      platform: platformPda,
      admin,
      mrvProject: mrvPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const baselineIx = await program.methods
    .submitBaseline(
      new BN(args.baselineKwhPerYear.toString()),
      args.fuelType,
      new BN(args.baselineCostInrPerYear.toString()),
      new BN(args.baselineCo2TonsPerYearX100.toString()),
      Array.from(args.reportHash)
    )
    .accountsPartial({
      auditorSigner: auditor,
      auditor: auditorPda,
      mrvProject: mrvPda,
      baseline: baselinePda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const createIx = await program.methods
    .createProject(
      new BN(projectId.toString()),
      new BN(args.targetUsdc.toString()),
      args.termMonths
    )
    .accountsPartial({
      platform: platformPda,
      admin,
      mrvProject: mrvPda,
      project: projectPda,
      tokenMint: tokenMintKp.publicKey,
      usdcVault,
      usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(registerIx, baselineIx, createIx);
  return {
    tx,
    tokenMintKeypair: tokenMintKp,
    mrvPda,
    projectPda,
    usdcVault,
    signers: [tokenMintKp],
  };
}

/** Standalone create_project (if MRV+baseline already exist). */
export async function buildCreateProject(args: {
  program: Program<Exira>;
  admin: PublicKey;
  projectId: number | bigint;
  targetUsdc: bigint;
  termMonths: number;
  usdcMint: PublicKey;
}): Promise<{
  tx: Transaction;
  projectPda: PublicKey;
  usdcVault: PublicKey;
  tokenMintKeypair: Keypair;
  signers: Keypair[];
}> {
  const [platformPda] = findPlatformPda();
  const [projectPda] = findProjectPda(args.projectId);
  const [mrvPda] = findMrvProjectPda(args.projectId);
  const tokenMintKp = Keypair.generate();
  const usdcVault = getAssociatedTokenAddressSync(args.usdcMint, projectPda, true);

  const ix = await args.program.methods
    .createProject(
      new BN(args.projectId.toString()),
      new BN(args.targetUsdc.toString()),
      args.termMonths
    )
    .accountsPartial({
      platform: platformPda,
      admin: args.admin,
      mrvProject: mrvPda,
      project: projectPda,
      tokenMint: tokenMintKp.publicKey,
      usdcVault,
      usdcMint: args.usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();

  return {
    tx: new Transaction().add(ix),
    projectPda,
    usdcVault,
    tokenMintKeypair: tokenMintKp,
    signers: [tokenMintKp],
  };
}
