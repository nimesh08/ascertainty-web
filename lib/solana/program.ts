import { Connection } from "@solana/web3.js";
import { AnchorProvider, Program, type Wallet } from "@anchor-lang/core";
import type { Exira } from "./idl/exira";
import idl from "./idl/exira.json";

export const DEFAULT_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";
export const DEFAULT_WS = process.env.NEXT_PUBLIC_SOLANA_WS;

export function getConnection(opts?: { commitment?: "processed" | "confirmed" | "finalized" }): Connection {
  return new Connection(DEFAULT_RPC, {
    commitment: opts?.commitment ?? "confirmed",
    wsEndpoint: DEFAULT_WS,
  });
}

/**
 * Anchor Program factory.
 *
 * We intentionally do NOT cache the program singleton at module scope:
 * - In browsers the Wallet changes per user / per reconnect.
 * - In server contexts (tests, indexer) each caller typically passes
 *   its own read-only or signing Wallet.
 *
 * Keep construction cheap (no network calls) and let callers own lifecycle.
 */
export function getExiraProgram(wallet: Wallet, connection?: Connection): Program<Exira> {
  const conn = connection ?? getConnection();
  const provider = new AnchorProvider(conn, wallet, { commitment: "confirmed" });
  return new Program<Exira>(idl as Exira, provider);
}

/** Read-only program — for fetching account state without signing. */
export function getReadOnlyProgram(connection?: Connection): Program<Exira> {
  const conn = connection ?? getConnection();
  // AnchorProvider requires a Wallet for tx signing, but read-only calls
  // never invoke signing. Provide a dummy Wallet that throws on any sign.
  const dummyWallet: Wallet = {
    
    publicKey: undefined as unknown as never,
    signTransaction: async () => {
      throw new Error("Read-only wallet cannot sign");
    },
    signAllTransactions: async () => {
      throw new Error("Read-only wallet cannot sign");
    },
    
    payer: undefined as unknown as never,
  };
  const provider = new AnchorProvider(conn, dummyWallet, { commitment: "confirmed" });
  return new Program<Exira>(idl as Exira, provider);
}

export type { Exira };
