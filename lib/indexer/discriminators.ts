/**
 * Anchor account discriminators for the Exira program.
 *
 * These are the 8-byte prefixes Anchor writes at the start of every account
 * data blob. They can be pulled straight from the on-chain IDL.
 */

import idlJson from "../../idl/exira.json";

type IdlAccount = { name: string; discriminator: number[] };

const accounts = (idlJson as unknown as { accounts: IdlAccount[] }).accounts;

export const DISCRIMINATORS: Record<string, Buffer> = Object.fromEntries(
  accounts.map((a) => [a.name, Buffer.from(a.discriminator)])
);

export const ACCOUNT_NAMES = [
  "Auditor",
  "Baseline",
  "InvestorPosition",
  "MrvProject",
  "Platform",
  "Pool",
  "PoolProjectLink",
  "Project",
  "Verification",
] as const;

export type AccountName = (typeof ACCOUNT_NAMES)[number];
