import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { AnchorProvider, Program, type Wallet } from "@anchor-lang/core";
import { expect } from "chai";
import * as fs from "node:fs";
import * as path from "node:path";

import type { Exira } from "../../lib/solana/idl/exira";
import idl from "../../lib/solana/idl/exira.json";
import {
  DEVNET_USDC_MINT,
  EXIRA_PROGRAM_ID,
  findPlatformPda,
  findPositionPda,
  findProjectPda,
  findAuditorPda,
} from "../../lib/solana/pda";
import {
  buildActivateProject,
  buildBuyProjectTokens,
  buildClaimProjectReturns,
  buildCreatePool,
  buildCreateProjectBundle,
  buildDistributePoolReturns,
  buildDistributeRepayment,
} from "../../lib/solana/tx";

/**
 * Mocha integration tests against Solana devnet.
 *
 *   npm run test:integration              -> read-only checks (LIVE_WRITE unset)
 *   LIVE_WRITE=1 npm run test:integration -> full happy-path incl. 0.01 USDC buy
 *
 * Read-only tests assert:
 *   1. We can connect to devnet.
 *   2. The Exira program is deployed at EXIRA_PROGRAM_ID.
 *   3. Platform PDA exists on-chain (program is initialized).
 *   4. Admin keypair is loaded and its pubkey matches .env ADMIN_WALLET.
 *   5. Each tx builder returns a transaction whose first instruction targets
 *      the Exira program (builders use live Connection but never `.rpc()`).
 */

function loadEnv() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
loadEnv();

function loadAdminKeypair(): Keypair {
  const p = path.resolve(process.cwd(), "keys/admin.json");
  const data = JSON.parse(fs.readFileSync(p, "utf-8")) as number[];
  return Keypair.fromSecretKey(new Uint8Array(data));
}

function makeProgram(connection: Connection, payer: Keypair): Program<Exira> {
  const wallet: Wallet = {
    publicKey: payer.publicKey,
    signTransaction: async (tx) => {
      const anyTx = tx as unknown as { partialSign?: (...s: Keypair[]) => void };
      if (typeof anyTx.partialSign === "function") {
        anyTx.partialSign(payer);
      }
      return tx;
    },
    signAllTransactions: async (txs) => {
      for (const tx of txs) {
        const anyTx = tx as unknown as { partialSign?: (...s: Keypair[]) => void };
        if (typeof anyTx.partialSign === "function") {
          anyTx.partialSign(payer);
        }
      }
      return txs;
    },
    payer,
  };
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program<Exira>(idl as Exira, provider);
}

describe("Exira devnet integration", function () {
  this.timeout(120_000);

  let connection: Connection;
  let admin: Keypair;
  let program: Program<Exira>;

  before(() => {
    const rpc =
      process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";
    connection = new Connection(rpc, "confirmed");
    admin = loadAdminKeypair();
    program = makeProgram(connection, admin);
  });

  // ---------------------- read-only ----------------------
  describe("read-only sanity", () => {
    it("loads admin keypair matching ADMIN_WALLET env", () => {
      const envAdmin =
        process.env.ADMIN_WALLET ??
        "AMBKUrFo8LM9psLtppLZBbbXqNU99BQuw9tfeHME2Ltg";
      expect(admin.publicKey.toBase58()).to.eq(envAdmin);
    });

    it("connects to devnet and fetches a blockhash", async () => {
      const { blockhash } = await connection.getLatestBlockhash();
      expect(blockhash).to.be.a("string");
      expect(blockhash.length).to.be.greaterThan(20);
    });

    it("Exira program is deployed at EXIRA_PROGRAM_ID", async () => {
      const info = await connection.getAccountInfo(EXIRA_PROGRAM_ID);
      expect(info, "program account not found").to.not.be.null;
      expect(info!.executable).to.eq(true);
    });

    it("Platform PDA exists on-chain (program is initialized)", async () => {
      const [platform] = findPlatformPda();
      const info = await connection.getAccountInfo(platform);
      expect(info, "platform PDA not initialized — run init_platform first").to
        .not.be.null;
    });

    it("builder: buildActivateProject yields an Exira instruction (read-only)", async () => {
      const [projectPda] = findProjectPda(12345);
      const usdcVault = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        projectPda,
        true
      );
      const tx = await buildActivateProject({
        program,
        admin: admin.publicKey,
        treasury: admin.publicKey,
        projectPda,
        usdcVault,
        usdcMint: DEVNET_USDC_MINT,
      });
      expect(tx.instructions[0].programId.equals(EXIRA_PROGRAM_ID)).to.eq(true);
    });

    it("builder: buildDistributeRepayment yields an Exira instruction (read-only)", async () => {
      const [projectPda] = findProjectPda(12345);
      const usdcVault = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        projectPda,
        true
      );
      const tx = await buildDistributeRepayment({
        program,
        admin: admin.publicKey,
        projectPda,
        usdcVault,
        usdcMint: DEVNET_USDC_MINT,
        amountUsdc: 1_000n,
      });
      expect(tx.instructions[0].programId.equals(EXIRA_PROGRAM_ID)).to.eq(true);
    });

    it("builder: buildClaimProjectReturns yields an Exira instruction (read-only)", async () => {
      const [projectPda] = findProjectPda(12345);
      const usdcVault = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        projectPda,
        true
      );
      const tx = await buildClaimProjectReturns({
        program,
        investor: admin.publicKey,
        projectPda,
        usdcVault,
        usdcMint: DEVNET_USDC_MINT,
      });
      expect(tx.instructions[0].programId.equals(EXIRA_PROGRAM_ID)).to.eq(true);
    });

    it("builder: buildCreatePool emits a transaction requiring pool_token_mint signer", async () => {
      const out = await buildCreatePool({
        program,
        admin: admin.publicKey,
        poolId: 99999,
        targetUsdc: 1_000n,
        usdcMint: DEVNET_USDC_MINT,
      });
      expect(out.signers).to.have.length(1);
      expect(out.tx.instructions[0].programId.equals(EXIRA_PROGRAM_ID)).to.eq(
        true
      );
    });

    it("builder: buildDistributePoolReturns yields an Exira instruction (read-only)", async () => {
      const poolPda = Keypair.generate().publicKey; // pseudo pool — we never send
      const tx = await buildDistributePoolReturns({
        program,
        admin: admin.publicKey,
        poolPda,
        usdcVault: Keypair.generate().publicKey,
        usdcMint: DEVNET_USDC_MINT,
        amountUsdc: 500n,
      });
      expect(tx.instructions[0].programId.equals(EXIRA_PROGRAM_ID)).to.eq(true);
    });
  });

  // ---------------------- live write ----------------------
  describe("LIVE_WRITE end-to-end flow", function () {
    before(function () {
      if (!process.env.LIVE_WRITE) this.skip();
    });

    // Project id picked per-run to avoid collisions with prior runs.
    // We only do a buyProjectTokens against a pre-existing project id passed
    // in via LIVE_PROJECT_ID — if not provided we skip, because creating a
    // fresh project requires an auditor whose availability varies across runs.
    const LIVE_PROJECT_ID = process.env.LIVE_PROJECT_ID
      ? BigInt(process.env.LIVE_PROJECT_ID)
      : null;

    it("admin has enough SOL for fees (> 0.01 SOL)", async () => {
      const lamports = await connection.getBalance(admin.publicKey);
      expect(lamports, "fund admin wallet on devnet").to.be.greaterThan(
        10_000_000
      );
    });

    it("buys 0.01 USDC into LIVE_PROJECT_ID and asserts on-chain tokens_sold increases", async function () {
      if (!LIVE_PROJECT_ID) this.skip();
      const [projectPda] = findProjectPda(LIVE_PROJECT_ID);
      const info = await connection.getAccountInfo(projectPda);
      expect(info, "LIVE_PROJECT_ID is not a live project PDA").to.not.be.null;

      // Fetch project account state pre-buy
      const projectBefore = await program.account.project.fetch(projectPda);
      const tokensSoldBefore = (
        projectBefore as unknown as { tokensSold: { toString(): string } }
      ).tokensSold.toString();
      const tokenMint = (
        projectBefore as unknown as { tokenMint: PublicKey }
      ).tokenMint;
      const usdcVault = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        projectPda,
        true
      );

      // Make sure admin has a USDC ATA with balance (we don't mint devnet USDC
      // here; if this fails, user must airdrop USDC-dev to the admin wallet).
      const adminUsdcAta = getAssociatedTokenAddressSync(
        DEVNET_USDC_MINT,
        admin.publicKey,
        false
      );
      try {
        const acct = await getAccount(connection, adminUsdcAta);
        expect(
          Number(acct.amount),
          "admin USDC ATA balance is 0 — fund with devnet USDC first"
        ).to.be.greaterThan(10_000);
      } catch (e) {
        this.skip();
        return;
      }

      const tx = await buildBuyProjectTokens({
        program,
        investor: admin.publicKey,
        projectPda,
        tokenMint,
        usdcVault,
        usdcMint: DEVNET_USDC_MINT,
        amountUsdc: 10_000n, // 0.01 USDC
      });
      const sig = await sendAndConfirmTransaction(connection, tx, [admin], {
        commitment: "confirmed",
      });
      expect(sig).to.be.a("string");

      const projectAfter = await program.account.project.fetch(projectPda);
      const tokensSoldAfter = (
        projectAfter as unknown as { tokensSold: { toString(): string } }
      ).tokensSold.toString();
      expect(
        Number(BigInt(tokensSoldAfter) - BigInt(tokensSoldBefore))
      ).to.be.greaterThan(0);

      const [position] = findPositionPda(projectPda, admin.publicKey);
      const positionAcct = await program.account.investorPosition.fetch(position);
      expect(
        (
          positionAcct as unknown as {
            tokenAmount: { toString(): string };
          }
        ).tokenAmount.toString()
      ).to.not.eq("0");
    });

    // Reference flows exposed for completeness; each self-skips unless
    // the caller explicitly opts in via env flag.
    it("(opt-in) createProject bundle — requires FRESH_PROJECT_ID + auditor on-chain", async function () {
      if (!process.env.FRESH_PROJECT_ID) this.skip();
      const projectId = BigInt(process.env.FRESH_PROJECT_ID);
      const auditor = admin.publicKey; // admin self-acts as auditor in dev
      const [auditorPda] = findAuditorPda(auditor);
      const auditorInfo = await connection.getAccountInfo(auditorPda);
      if (!auditorInfo) this.skip();

      const bundle = await buildCreateProjectBundle({
        program,
        admin: admin.publicKey,
        auditor,
        projectId,
        msmeName: "Integration Test MSME",
        sector: "Textile",
        location: "Tamil Nadu",
        upgradeType: "motor-vfd",
        fuelType: "diesel",
        baselineKwhPerYear: 100_000n,
        baselineCostInrPerYear: 500_000n,
        baselineCo2TonsPerYearX100: 200n,
        reportHash: new Uint8Array(32),
        targetUsdc: 1_000_000n,
        termMonths: 12,
        usdcMint: DEVNET_USDC_MINT,
      });
      const sig = await sendAndConfirmTransaction(
        connection,
        bundle.tx,
        [admin, ...bundle.signers],
        { commitment: "confirmed" }
      );
      expect(sig).to.be.a("string");
    });
  });
});
