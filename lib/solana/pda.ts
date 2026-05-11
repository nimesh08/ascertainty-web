import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export const EXIRA_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_EXIRA_PROGRAM_ID ??
    "J7z1a2bwMEC8MchgZwskJZ8PzXg4UG674VgD8DuotJn2"
);

/** Official USDC mint on devnet (Circle). */
export const DEVNET_USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// PDA seed bytes (must match on-chain constants.rs)
export const PLATFORM_SEED = Buffer.from("platform");
export const PROJECT_SEED = Buffer.from("project");
export const POOL_SEED = Buffer.from("pool");
export const POOL_LINK_SEED = Buffer.from("pool_link");
export const POSITION_SEED = Buffer.from("position");
export const MRV_PROJECT_SEED = Buffer.from("mrv_project");
export const BASELINE_SEED = Buffer.from("baseline");
export const VERIFICATION_SEED = Buffer.from("verification");
export const AUDITOR_SEED = Buffer.from("auditor");

function u64Le(n: number | bigint | BN): Buffer {
  const bn = typeof n === "number" ? new BN(n) : BN.isBN(n) ? n : new BN(n.toString());
  return bn.toArrayLike(Buffer, "le", 8);
}

export function findPlatformPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([PLATFORM_SEED], EXIRA_PROGRAM_ID);
}

export function findProjectPda(projectId: number | bigint | BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROJECT_SEED, u64Le(projectId)],
    EXIRA_PROGRAM_ID
  );
}

export function findPoolPda(poolId: number | bigint | BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POOL_SEED, u64Le(poolId)],
    EXIRA_PROGRAM_ID
  );
}

export function findPoolLinkPda(
  pool: PublicKey,
  project: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POOL_LINK_SEED, pool.toBuffer(), project.toBuffer()],
    EXIRA_PROGRAM_ID
  );
}

export function findPositionPda(
  target: PublicKey,
  owner: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [POSITION_SEED, target.toBuffer(), owner.toBuffer()],
    EXIRA_PROGRAM_ID
  );
}

export function findMrvProjectPda(projectId: number | bigint | BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [MRV_PROJECT_SEED, u64Le(projectId)],
    EXIRA_PROGRAM_ID
  );
}

export function findBaselinePda(mrvProject: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BASELINE_SEED, mrvProject.toBuffer()],
    EXIRA_PROGRAM_ID
  );
}

export function findVerificationPda(
  mrvProject: PublicKey,
  index: number
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VERIFICATION_SEED, mrvProject.toBuffer(), Buffer.from([index])],
    EXIRA_PROGRAM_ID
  );
}

export function findAuditorPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [AUDITOR_SEED, wallet.toBuffer()],
    EXIRA_PROGRAM_ID
  );
}
