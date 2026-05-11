import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import {
  EXIRA_PROGRAM_ID,
  DEVNET_USDC_MINT,
  findPlatformPda,
  findProjectPda,
  findPoolPda,
  findPoolLinkPda,
  findPositionPda,
  findMrvProjectPda,
  findBaselinePda,
  findVerificationPda,
  findAuditorPda,
  PLATFORM_SEED,
  PROJECT_SEED,
  POOL_SEED,
} from "@/lib/solana/pda";

const randomKey = () => PublicKey.unique();

describe("pda constants", () => {
  it("EXIRA_PROGRAM_ID is a valid PublicKey", () => {
    expect(EXIRA_PROGRAM_ID).toBeInstanceOf(PublicKey);
    expect(EXIRA_PROGRAM_ID.toBase58().length).toBeGreaterThan(30);
  });

  it("DEVNET_USDC_MINT matches Circle devnet mint", () => {
    expect(DEVNET_USDC_MINT.toBase58()).toBe(
      "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    );
  });

  it("seed byte buffers match string constants", () => {
    expect(PLATFORM_SEED.toString()).toBe("platform");
    expect(PROJECT_SEED.toString()).toBe("project");
    expect(POOL_SEED.toString()).toBe("pool");
  });
});

describe("findPlatformPda", () => {
  it("derives the same PDA across calls (deterministic)", () => {
    const [a] = findPlatformPda();
    const [b] = findPlatformPda();
    expect(a.equals(b)).toBe(true);
  });

  it("matches manual derivation with the platform seed", () => {
    const [pda, bump] = findPlatformPda();
    const [expected, expectedBump] = PublicKey.findProgramAddressSync(
      [PLATFORM_SEED],
      EXIRA_PROGRAM_ID
    );
    expect(pda.equals(expected)).toBe(true);
    expect(bump).toBe(expectedBump);
  });
});

describe("findProjectPda", () => {
  it("different ids produce different PDAs", () => {
    const [a] = findProjectPda(1);
    const [b] = findProjectPda(2);
    expect(a.equals(b)).toBe(false);
  });

  it("accepts number, bigint, and BN for the same id (equivalent results)", () => {
    const [fromNum] = findProjectPda(42);
    const [fromBig] = findProjectPda(42n);
    const [fromBn] = findProjectPda(new BN(42));
    expect(fromNum.equals(fromBig)).toBe(true);
    expect(fromNum.equals(fromBn)).toBe(true);
  });

  it("returns a valid bump (0-255)", () => {
    const [, bump] = findProjectPda(7);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
  });
});

describe("findPoolPda", () => {
  it("is distinct from findProjectPda for the same id", () => {
    const [pool] = findPoolPda(1);
    const [project] = findProjectPda(1);
    expect(pool.equals(project)).toBe(false);
  });

  it("deterministic across multiple calls", () => {
    const [a] = findPoolPda(100n);
    const [b] = findPoolPda(100n);
    expect(a.equals(b)).toBe(true);
  });
});

describe("findPoolLinkPda", () => {
  it("link PDA depends on both pool and project", () => {
    const [pool1] = findPoolPda(1);
    const [pool2] = findPoolPda(2);
    const [proj] = findProjectPda(5);
    const [a] = findPoolLinkPda(pool1, proj);
    const [b] = findPoolLinkPda(pool2, proj);
    expect(a.equals(b)).toBe(false);
  });

  it("swapping pool and project yields different PDA (order matters)", () => {
    const p1 = randomKey();
    const p2 = randomKey();
    const [ab] = findPoolLinkPda(p1, p2);
    const [ba] = findPoolLinkPda(p2, p1);
    expect(ab.equals(ba)).toBe(false);
  });
});

describe("findPositionPda", () => {
  it("positions differ per target", () => {
    const owner = randomKey();
    const [project] = findProjectPda(1);
    const [pool] = findPoolPda(1);
    const [posProject] = findPositionPda(project, owner);
    const [posPool] = findPositionPda(pool, owner);
    expect(posProject.equals(posPool)).toBe(false);
  });

  it("positions differ per owner", () => {
    const [target] = findProjectPda(1);
    const o1 = randomKey();
    const o2 = randomKey();
    const [a] = findPositionPda(target, o1);
    const [b] = findPositionPda(target, o2);
    expect(a.equals(b)).toBe(false);
  });
});

describe("findMrvProjectPda / findBaselinePda", () => {
  it("mrv PDA differs from project PDA for the same id", () => {
    const [mrv] = findMrvProjectPda(9);
    const [proj] = findProjectPda(9);
    expect(mrv.equals(proj)).toBe(false);
  });

  it("baseline PDA depends on the mrv project", () => {
    const [mrvA] = findMrvProjectPda(1);
    const [mrvB] = findMrvProjectPda(2);
    const [a] = findBaselinePda(mrvA);
    const [b] = findBaselinePda(mrvB);
    expect(a.equals(b)).toBe(false);
  });
});

describe("findVerificationPda", () => {
  it("different indexes for the same mrv produce different PDAs", () => {
    const [mrv] = findMrvProjectPda(3);
    const [v0] = findVerificationPda(mrv, 0);
    const [v1] = findVerificationPda(mrv, 1);
    expect(v0.equals(v1)).toBe(false);
  });

  it("deterministic for a given (mrv, index) pair", () => {
    const [mrv] = findMrvProjectPda(4);
    const [first] = findVerificationPda(mrv, 5);
    const [second] = findVerificationPda(mrv, 5);
    expect(first.equals(second)).toBe(true);
  });
});

describe("findAuditorPda", () => {
  it("unique per auditor wallet", () => {
    const w1 = randomKey();
    const w2 = randomKey();
    const [a] = findAuditorPda(w1);
    const [b] = findAuditorPda(w2);
    expect(a.equals(b)).toBe(false);
  });
});
