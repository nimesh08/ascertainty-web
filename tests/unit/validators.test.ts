import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  buyTokensSchema,
  dispenseSchema,
  createPoolSchema,
  addAuditorSchema,
  solanaPubkey,
  SolanaPubkeyRegex,
} from "@/lib/utils/validation";

const hash64 = "a".repeat(64);

describe("solanaPubkey schema", () => {
  it("accepts a valid base58 pubkey", () => {
    const ok = solanaPubkey.safeParse("AMBKUrFo8LM9psLtppLZBbbXqNU99BQuw9tfeHME2Ltg");
    expect(ok.success).toBe(true);
  });

  it("rejects too-short strings", () => {
    expect(solanaPubkey.safeParse("abc").success).toBe(false);
  });

  it("rejects strings with invalid base58 chars (0, O, I, l)", () => {
    expect(solanaPubkey.safeParse("0".repeat(44)).success).toBe(false);
  });

  it("SolanaPubkeyRegex rejects empty string", () => {
    expect(SolanaPubkeyRegex.test("")).toBe(false);
  });
});

describe("createProjectSchema", () => {
  const valid = {
    msmeName: "Alpha Mill",
    sector: "Textile",
    location: "TN",
    upgradeType: "motor",
    targetUsdc: 1000,
    termMonths: 12,
    fuelType: "diesel",
    baselineKwhPerYear: 100000,
    baselineCostInrPerYear: 500000,
    baselineCo2TonsPerYearX100: 200,
    reportHash: hash64,
  };

  it("accepts a valid payload", () => {
    const r = createProjectSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects empty msmeName", () => {
    const r = createProjectSchema.safeParse({ ...valid, msmeName: "" });
    expect(r.success).toBe(false);
  });

  it("rejects termMonths < 6", () => {
    const r = createProjectSchema.safeParse({ ...valid, termMonths: 3 });
    expect(r.success).toBe(false);
  });

  it("rejects termMonths > 60", () => {
    const r = createProjectSchema.safeParse({ ...valid, termMonths: 120 });
    expect(r.success).toBe(false);
  });

  it("rejects reportHash not 64 hex chars", () => {
    const r = createProjectSchema.safeParse({ ...valid, reportHash: "xyz" });
    expect(r.success).toBe(false);
  });

  it("coerces numeric strings (HTML form inputs)", () => {
    const r = createProjectSchema.safeParse({
      ...valid,
      targetUsdc: "5000" as unknown as number,
      termMonths: "12" as unknown as number,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.targetUsdc).toBe(5000);
      expect(r.data.termMonths).toBe(12);
    }
  });

  it("rejects negative targetUsdc", () => {
    const r = createProjectSchema.safeParse({ ...valid, targetUsdc: -1 });
    expect(r.success).toBe(false);
  });
});

describe("buyTokensSchema / dispenseSchema", () => {
  it("accepts positive decimal amounts", () => {
    expect(buyTokensSchema.safeParse({ amountUsdc: 0.01 }).success).toBe(true);
    expect(dispenseSchema.safeParse({ amountUsdc: 42.5 }).success).toBe(true);
  });

  it("rejects zero", () => {
    expect(buyTokensSchema.safeParse({ amountUsdc: 0 }).success).toBe(false);
  });

  it("rejects negative", () => {
    expect(buyTokensSchema.safeParse({ amountUsdc: -5 }).success).toBe(false);
  });

  it("enforces amountUsdc upper bound", () => {
    expect(buyTokensSchema.safeParse({ amountUsdc: 1_000_001 }).success).toBe(
      false
    );
  });
});

describe("createPoolSchema", () => {
  it("accepts without description", () => {
    const r = createPoolSchema.safeParse({ name: "Pool A", targetUsdc: 1000 });
    expect(r.success).toBe(true);
  });

  it("description can be up to 512 chars", () => {
    const r = createPoolSchema.safeParse({
      name: "Pool A",
      targetUsdc: 1000,
      description: "x".repeat(512),
    });
    expect(r.success).toBe(true);
  });

  it("description > 512 chars fails", () => {
    const r = createPoolSchema.safeParse({
      name: "Pool A",
      targetUsdc: 1000,
      description: "x".repeat(513),
    });
    expect(r.success).toBe(false);
  });
});

describe("addAuditorSchema", () => {
  it("accepts a valid payload", () => {
    const r = addAuditorSchema.safeParse({
      walletPubkey: "AMBKUrFo8LM9psLtppLZBbbXqNU99BQuw9tfeHME2Ltg",
      name: "Auditor 1",
      certification: "BEE-GR1",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid pubkey", () => {
    const r = addAuditorSchema.safeParse({
      walletPubkey: "not-a-pubkey",
      name: "x",
      certification: "y",
    });
    expect(r.success).toBe(false);
  });
});
