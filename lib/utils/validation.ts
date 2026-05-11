import { z } from "zod";

export const SolanaPubkeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const solanaPubkey = z
  .string()
  .regex(SolanaPubkeyRegex, "Invalid Solana address");

export const createProjectSchema = z.object({
  msmeName: z.string().min(1).max(64),
  sector: z.string().min(1).max(32),
  location: z.string().min(1).max(64),
  upgradeType: z.string().min(1).max(32),
  targetUsdc: z.coerce.number().positive().max(10_000_000),
  termMonths: z.coerce.number().int().min(6).max(60),
  fuelType: z.string().min(1).max(16),
  baselineKwhPerYear: z.coerce.number().positive(),
  baselineCostInrPerYear: z.coerce.number().positive(),
  baselineCo2TonsPerYearX100: z.coerce.number().positive(),
  reportHash: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "Must be 64 hex chars (SHA-256)"),
});

export const buyTokensSchema = z.object({
  amountUsdc: z.coerce.number().positive().max(1_000_000),
});

export const dispenseSchema = z.object({
  amountUsdc: z.coerce.number().positive().max(1_000_000),
});

export const createPoolSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(512).optional(),
  targetUsdc: z.coerce.number().positive().max(10_000_000),
});

export const addAuditorSchema = z.object({
  walletPubkey: solanaPubkey,
  name: z.string().min(1).max(64),
  certification: z.string().min(1).max(32),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type BuyTokensInput = z.infer<typeof buyTokensSchema>;
export type DispenseInput = z.infer<typeof dispenseSchema>;
export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type AddAuditorInput = z.infer<typeof addAuditorSchema>;
