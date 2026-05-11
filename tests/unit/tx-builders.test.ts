import { describe, it, expect, beforeAll } from "vitest";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorProvider, Program, type Wallet } from "@anchor-lang/core";
import type { Exira } from "@/lib/solana/idl/exira";
import idl from "@/lib/solana/idl/exira.json";
import {
  buildBuyProjectTokens,
  buildClaimProjectReturns,
  buildCreateProject,
  buildActivateProject,
  buildDistributeRepayment,
  buildCreatePool,
  buildAddProjectToPool,
  buildBuyPoolTokens,
  buildClaimPoolReturns,
  buildDistributePoolReturns,
  buildAddAuditor,
  buildRegisterMrvProject,
  buildSubmitBaseline,
  buildSubmitVerification,
  buildAttestVerification,
} from "@/lib/solana/tx";
import {
  DEVNET_USDC_MINT,
  EXIRA_PROGRAM_ID,
  findPlatformPda,
  findProjectPda,
  findPoolPda,
  findPoolLinkPda,
  findPositionPda,
  findMrvProjectPda,
  findBaselinePda,
  findVerificationPda,
  findAuditorPda,
} from "@/lib/solana/pda";

/**
 * These are pure client-side builder tests: they never send anything to the
 * network. We construct a fake Connection (that refuses network I/O) and rely
 * on @anchor-lang/core's .instruction() which only needs the IDL + program id.
 */
function makeFakeProgram(payer: PublicKey): Program<Exira> {
  const wallet: Wallet = {
    publicKey: payer,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
    payer: Keypair.generate(),
  };
  const connection = new Connection("http://127.0.0.1:9", "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<Exira>(idl as Exira, provider);
}

const admin = Keypair.generate().publicKey;
const auditor = Keypair.generate().publicKey;
const investor = Keypair.generate().publicKey;
const treasury = Keypair.generate().publicKey;
let program: Program<Exira>;
const usdcMint = DEVNET_USDC_MINT;

beforeAll(() => {
  program = makeFakeProgram(admin);
});

// helper: find an AccountMeta by its pubkey on a Transaction
function hasAccount(tx: Transaction, pubkey: PublicKey): boolean {
  return tx.instructions.some((ix) =>
    ix.keys.some((k) => k.pubkey.equals(pubkey))
  );
}

function firstIx(tx: Transaction) {
  return tx.instructions[0];
}

describe("buildCreateProject (standalone)", () => {
  it("returns a single-instruction tx targeting the Exira program", async () => {
    const out = await buildCreateProject({
      program,
      admin,
      projectId: 1,
      targetUsdc: 1_000_000n,
      termMonths: 12,
      usdcMint,
    });
    expect(out.tx.instructions).toHaveLength(1);
    expect(firstIx(out.tx).programId.equals(EXIRA_PROGRAM_ID)).toBe(true);
  });

  it("wires the correct platform/project/mrv PDAs into accounts", async () => {
    const out = await buildCreateProject({
      program,
      admin,
      projectId: 99n,
      targetUsdc: 2_000_000n,
      termMonths: 6,
      usdcMint,
    });
    const [platform] = findPlatformPda();
    const [project] = findProjectPda(99n);
    const [mrv] = findMrvProjectPda(99n);
    expect(hasAccount(out.tx, platform)).toBe(true);
    expect(hasAccount(out.tx, project)).toBe(true);
    expect(hasAccount(out.tx, mrv)).toBe(true);
    expect(out.projectPda.equals(project)).toBe(true);
  });

  it("returns a fresh token mint keypair as a signer", async () => {
    const out = await buildCreateProject({
      program,
      admin,
      projectId: 2,
      targetUsdc: 1_000_000n,
      termMonths: 12,
      usdcMint,
    });
    expect(out.tokenMintKeypair).toBeInstanceOf(Keypair);
    expect(out.signers).toHaveLength(1);
    expect(out.signers[0].publicKey.equals(out.tokenMintKeypair.publicKey)).toBe(
      true
    );
  });
});

describe("buildActivateProject", () => {
  it("produces 1 instruction referencing platform + project vault", async () => {
    const [projectPda] = findProjectPda(10);
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildActivateProject({
      program,
      admin,
      treasury,
      projectPda,
      usdcVault,
      usdcMint,
    });
    expect(tx.instructions).toHaveLength(1);
    const [platform] = findPlatformPda();
    expect(hasAccount(tx, platform)).toBe(true);
    expect(hasAccount(tx, projectPda)).toBe(true);
    expect(hasAccount(tx, usdcVault)).toBe(true);
    expect(hasAccount(tx, treasury)).toBe(true);
  });
});

describe("buildBuyProjectTokens", () => {
  it("encodes non-empty instruction data (amount arg)", async () => {
    const [projectPda] = findProjectPda(1);
    const tokenMint = Keypair.generate().publicKey;
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildBuyProjectTokens({
      program,
      investor,
      projectPda,
      tokenMint,
      usdcVault,
      usdcMint,
      amountUsdc: 1_000_000n,
    });
    expect(firstIx(tx).data.length).toBeGreaterThan(8); // 8 bytes anchor disc + amount
  });

  it("includes the position PDA for (project, investor)", async () => {
    const [projectPda] = findProjectPda(1);
    const tokenMint = Keypair.generate().publicKey;
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildBuyProjectTokens({
      program,
      investor,
      projectPda,
      tokenMint,
      usdcVault,
      usdcMint,
      amountUsdc: 500_000n,
    });
    const [position] = findPositionPda(projectPda, investor);
    expect(hasAccount(tx, position)).toBe(true);
  });

  it("instruction data differs when amount differs (serialization is amount-dependent)", async () => {
    const [projectPda] = findProjectPda(1);
    const tokenMint = Keypair.generate().publicKey;
    const usdcVault = Keypair.generate().publicKey;
    const txA = await buildBuyProjectTokens({
      program,
      investor,
      projectPda,
      tokenMint,
      usdcVault,
      usdcMint,
      amountUsdc: 1_000_000n,
    });
    const txB = await buildBuyProjectTokens({
      program,
      investor,
      projectPda,
      tokenMint,
      usdcVault,
      usdcMint,
      amountUsdc: 2_000_000n,
    });
    expect(Buffer.compare(firstIx(txA).data, firstIx(txB).data)).not.toBe(0);
  });
});

describe("buildClaimProjectReturns", () => {
  it("includes investor position PDA and usdc vault", async () => {
    const [projectPda] = findProjectPda(3);
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildClaimProjectReturns({
      program,
      investor,
      projectPda,
      usdcVault,
      usdcMint,
    });
    const [position] = findPositionPda(projectPda, investor);
    expect(hasAccount(tx, position)).toBe(true);
    expect(hasAccount(tx, usdcVault)).toBe(true);
  });
});

describe("buildDistributeRepayment", () => {
  it("tags admin as a signer and includes project vault", async () => {
    const [projectPda] = findProjectPda(5);
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildDistributeRepayment({
      program,
      admin,
      projectPda,
      usdcVault,
      usdcMint,
      amountUsdc: 5_000_000n,
    });
    const ix = firstIx(tx);
    const adminMeta = ix.keys.find((k) => k.pubkey.equals(admin));
    expect(adminMeta?.isSigner).toBe(true);
    expect(hasAccount(tx, usdcVault)).toBe(true);
  });
});

describe("buildCreatePool + buildAddProjectToPool", () => {
  it("create_pool emits a pool_token_mint signer", async () => {
    const out = await buildCreatePool({
      program,
      admin,
      poolId: 1,
      targetUsdc: 1_000_000n,
      usdcMint,
    });
    expect(out.signers).toHaveLength(1);
    expect(out.signers[0].publicKey.equals(out.poolTokenMintKp.publicKey)).toBe(
      true
    );
  });

  it("add_project_to_pool derives the link PDA deterministically", async () => {
    const [poolPda] = findPoolPda(1);
    const [projectPda] = findProjectPda(1);
    const out = await buildAddProjectToPool({
      program,
      admin,
      poolPda,
      projectPda,
    });
    const [expectedLink] = findPoolLinkPda(poolPda, projectPda);
    expect(out.linkPda.equals(expectedLink)).toBe(true);
    expect(hasAccount(out.tx, expectedLink)).toBe(true);
  });
});

describe("buildBuyPoolTokens / buildClaimPoolReturns / buildDistributePoolReturns", () => {
  it("buy_pool_tokens references pool position PDA", async () => {
    const [poolPda] = findPoolPda(7);
    const poolTokenMint = Keypair.generate().publicKey;
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildBuyPoolTokens({
      program,
      investor,
      poolPda,
      poolTokenMint,
      usdcVault,
      usdcMint,
      amountUsdc: 100_000n,
    });
    const [position] = findPositionPda(poolPda, investor);
    expect(hasAccount(tx, position)).toBe(true);
  });

  it("claim_pool_returns single ix, references investor", async () => {
    const [poolPda] = findPoolPda(7);
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildClaimPoolReturns({
      program,
      investor,
      poolPda,
      usdcVault,
      usdcMint,
    });
    expect(tx.instructions).toHaveLength(1);
    expect(hasAccount(tx, investor)).toBe(true);
  });

  it("distribute_pool_returns tags admin as signer", async () => {
    const [poolPda] = findPoolPda(7);
    const usdcVault = Keypair.generate().publicKey;
    const tx = await buildDistributePoolReturns({
      program,
      admin,
      poolPda,
      usdcVault,
      usdcMint,
      amountUsdc: 500_000n,
    });
    const adminMeta = firstIx(tx).keys.find((k) => k.pubkey.equals(admin));
    expect(adminMeta?.isSigner).toBe(true);
  });
});

describe("buildAddAuditor", () => {
  it("derives the auditor PDA from the auditor wallet", async () => {
    const wallet = Keypair.generate().publicKey;
    const tx = await buildAddAuditor({
      program,
      admin,
      auditorWallet: wallet,
      name: "Acme Audits",
      certification: "BEE-GR1",
    });
    const [expected] = findAuditorPda(wallet);
    expect(hasAccount(tx, expected)).toBe(true);
  });
});

describe("MRV builders", () => {
  it("register_mrv_project returns the mrv PDA and 1 ix", async () => {
    const out = await buildRegisterMrvProject({
      program,
      admin,
      projectId: 42,
      msmeName: "Alpha Spinning Mill",
      sector: "Textiles",
      location: "Tamil Nadu",
      upgradeType: "motor-vfd",
    });
    const [expected] = findMrvProjectPda(42);
    expect(out.mrvPda.equals(expected)).toBe(true);
    expect(out.tx.instructions).toHaveLength(1);
  });

  it("submit_baseline rejects wrong-length report hash", async () => {
    const [mrvPda] = findMrvProjectPda(1);
    await expect(
      buildSubmitBaseline({
        program,
        auditor,
        mrvPda,
        energyKwhPerYear: 1000n,
        fuelType: "diesel",
        costInrPerYear: 100n,
        co2TonsPerYearX100: 50n,
        reportHash: new Uint8Array(31),
      })
    ).rejects.toThrow(/32 bytes/);
  });

  it("submit_baseline accepts 32-byte hash and references baseline + auditor PDA", async () => {
    const [mrvPda] = findMrvProjectPda(8);
    const tx = await buildSubmitBaseline({
      program,
      auditor,
      mrvPda,
      energyKwhPerYear: 1000n,
      fuelType: "diesel",
      costInrPerYear: 100n,
      co2TonsPerYearX100: 50n,
      reportHash: new Uint8Array(32),
    });
    const [auditorPda] = findAuditorPda(auditor);
    const [baselinePda] = findBaselinePda(mrvPda);
    expect(hasAccount(tx, auditorPda)).toBe(true);
    expect(hasAccount(tx, baselinePda)).toBe(true);
  });

  it("submit_verification rejects bad hash and accepts good one", async () => {
    const [mrvPda] = findMrvProjectPda(9);
    await expect(
      buildSubmitVerification({
        program,
        auditor,
        mrvPda,
        index: 0,
        periodStart: 0n,
        periodEnd: 1000n,
        energyKwhSaved: 10n,
        costInrSaved: 5n,
        co2TonsAvoidedX100: 2n,
        savingsVsExpectedBps: 100,
        reportHash: new Uint8Array(5),
      })
    ).rejects.toThrow(/32 bytes/);

    const tx = await buildSubmitVerification({
      program,
      auditor,
      mrvPda,
      index: 2,
      periodStart: 0n,
      periodEnd: 1000n,
      energyKwhSaved: 10n,
      costInrSaved: 5n,
      co2TonsAvoidedX100: 2n,
      savingsVsExpectedBps: 100,
      reportHash: new Uint8Array(32),
    });
    const [verification] = findVerificationPda(mrvPda, 2);
    expect(hasAccount(tx, verification)).toBe(true);
  });

  it("attest_verification references the same verification PDA", async () => {
    const [mrvPda] = findMrvProjectPda(11);
    const tx = await buildAttestVerification({
      program,
      auditor,
      mrvPda,
      index: 0,
    });
    const [verification] = findVerificationPda(mrvPda, 0);
    expect(hasAccount(tx, verification)).toBe(true);
  });
});
