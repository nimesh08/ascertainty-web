/**
 * Shared Solana Connection + read-only Anchor Program for the indexer.
 *
 * The program is constructed lazily and cached. Anchor requires a Wallet even
 * for read-only fetches; we pass a throwaway Keypair wrapped in a Wallet
 * shim. No signing ever happens in the indexer code path.
 */

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import idlJson from "../../idl/exira.json";
import type { Exira } from "../../idl/exira";

export const PROGRAM_ID = new PublicKey(
  "J7z1a2bwMEC8MchgZwskJZ8PzXg4UG674VgD8DuotJn2"
);

export function getRpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    "https://api.devnet.solana.com"
  );
}

let _connection: Connection | null = null;
export function getConnection(): Connection {
  if (_connection) return _connection;
  _connection = new Connection(getRpcUrl(), { commitment: "confirmed" });
  return _connection;
}

let _program: Program<Exira> | null = null;
export function getReadOnlyProgram(): Program<Exira> {
  if (_program) return _program;
  const connection = getConnection();
  const kp = Keypair.generate();
  const wallet = new Wallet(kp);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  _program = new Program<Exira>(idlJson as unknown as Exira, provider);
  return _program;
}

export type { Exira };
