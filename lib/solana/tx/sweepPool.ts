import { PublicKey, SystemProgram, Transaction, Keypair } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN, type Program } from "@anchor-lang/core";
import type { Exira } from "../idl/exira";
import { findPlatformPda, findPoolPda, findPoolLinkPda, findPositionPda } from "../pda";

export interface CreatePoolArgs {
  program: Program<Exira>;
  admin: PublicKey;
  poolId: number | bigint;
  targetUsdc: bigint;
  usdcMint: PublicKey;
}

export async function buildCreatePool(
  args: CreatePoolArgs
): Promise<{ tx: Transaction; poolPda: PublicKey; usdcVault: PublicKey; poolTokenMintKp: Keypair; signers: Keypair[] }> {
  const { program, admin, poolId, targetUsdc, usdcMint } = args;
  const [platformPda] = findPlatformPda();
  const [poolPda] = findPoolPda(poolId);
  const poolTokenMintKp = Keypair.generate();
  const usdcVault = getAssociatedTokenAddressSync(usdcMint, poolPda, true);

  const ix = await program.methods
    .createPool(new BN(poolId.toString()), new BN(targetUsdc.toString()))
    .accountsPartial({
      platform: platformPda,
      admin,
      pool: poolPda,
      poolTokenMint: poolTokenMintKp.publicKey,
      usdcVault,
      usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();

  return {
    tx: new Transaction().add(ix),
    poolPda,
    usdcVault,
    poolTokenMintKp,
    signers: [poolTokenMintKp],
  };
}

export async function buildAddProjectToPool(args: {
  program: Program<Exira>;
  admin: PublicKey;
  poolPda: PublicKey;
  projectPda: PublicKey;
}): Promise<{ tx: Transaction; linkPda: PublicKey }> {
  const [platformPda] = findPlatformPda();
  const [linkPda] = findPoolLinkPda(args.poolPda, args.projectPda);

  const ix = await args.program.methods
    .addProjectToPool()
    .accountsPartial({
      platform: platformPda,
      admin: args.admin,
      pool: args.poolPda,
      project: args.projectPda,
      poolProjectLink: linkPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  return { tx: new Transaction().add(ix), linkPda };
}

export async function buildBuyPoolTokens(args: {
  program: Program<Exira>;
  investor: PublicKey;
  poolPda: PublicKey;
  poolTokenMint: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
  amountUsdc: bigint;
}): Promise<Transaction> {
  const [position] = findPositionPda(args.poolPda, args.investor);
  const investorUsdcAta = getAssociatedTokenAddressSync(args.usdcMint, args.investor, false);
  const investorPoolTokenAta = getAssociatedTokenAddressSync(args.poolTokenMint, args.investor, false);

  const ix = await args.program.methods
    .buyPoolTokens(new BN(args.amountUsdc.toString()))
    .accountsPartial({
      pool: args.poolPda,
      poolTokenMint: args.poolTokenMint,
      usdcVault: args.usdcVault,
      investor: args.investor,
      investorUsdcAta,
      investorPoolTokenAta,
      position,
      usdcMint: args.usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();
  return new Transaction().add(ix);
}

export async function buildClaimPoolReturns(args: {
  program: Program<Exira>;
  investor: PublicKey;
  poolPda: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
}): Promise<Transaction> {
  const [position] = findPositionPda(args.poolPda, args.investor);
  const investorUsdcAta = getAssociatedTokenAddressSync(args.usdcMint, args.investor, false);

  const ix = await args.program.methods
    .claimPoolReturns()
    .accountsPartial({
      pool: args.poolPda,
      usdcVault: args.usdcVault,
      investor: args.investor,
      position,
      investorUsdcAta,
      usdcMint: args.usdcMint,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .instruction();
  return new Transaction().add(ix);
}

/**
 * V1 Sweep flow (admin-orchestrated):
 *   1. Admin separately claims from each underlying project to admin USDC ATA
 *      (via regular claim_project_returns ix) — NOT modeled here since it's
 *      per-investor PDAs. V1 contracts: the pool PDA itself cannot claim.
 *   2. Admin deposits total into pool vault via distribute_pool_returns(amount).
 *
 * This builder produces JUST step 2 — the caller is responsible for step 1
 * orchestration (typically done off-chain by the admin UI watching claims).
 */
export async function buildDistributePoolReturns(args: {
  program: Program<Exira>;
  admin: PublicKey;
  poolPda: PublicKey;
  usdcVault: PublicKey;
  usdcMint: PublicKey;
  amountUsdc: bigint;
}): Promise<Transaction> {
  const [platformPda] = findPlatformPda();
  const adminUsdcAta = getAssociatedTokenAddressSync(args.usdcMint, args.admin, false);
  const ix = await args.program.methods
    .distributePoolReturns(new BN(args.amountUsdc.toString()))
    .accountsPartial({
      platform: platformPda,
      admin: args.admin,
      pool: args.poolPda,
      adminUsdcAta,
      usdcVault: args.usdcVault,
      usdcMint: args.usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  return new Transaction().add(ix);
}
