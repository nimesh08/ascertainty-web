"use client";

/**
 * Adapts a Privy `ConnectedStandardSolanaWallet` (plus `useSignTransaction` hook)
 * into an Anchor-compatible `Wallet` object.
 *
 * Anchor's Wallet interface:
 *   - publicKey: PublicKey
 *   - signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>
 *   - signAllTransactions<T extends ...>(txs: T[]): Promise<T[]>
 *   - payer?: Keypair  (unused here — Privy holds the key)
 *
 * Privy exposes signing via serialized Uint8Array round-trips.
 */

import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { Wallet } from "@anchor-lang/core";
import type { UseSignTransaction } from "@privy-io/react-auth/solana";
import type { ConnectedStandardSolanaWallet } from "@privy-io/js-sdk-core";
import { SOLANA_CHAIN } from "@/lib/privy/config";

export interface PrivyAnchorWalletArgs {
  wallet: ConnectedStandardSolanaWallet;
  sign: UseSignTransaction["signTransaction"];
}

export function buildPrivyAnchorWallet({
  wallet,
  sign,
}: PrivyAnchorWalletArgs): Wallet {
  const publicKey = new PublicKey(wallet.address);

  async function signOne<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    const serialized =
      tx instanceof VersionedTransaction
        ? tx.serialize()
        : (tx as Transaction).serialize({ requireAllSignatures: false, verifySignatures: false });

    const out = await sign({
      transaction: new Uint8Array(serialized),
      wallet,
      chain: SOLANA_CHAIN,
    });

    if (tx instanceof VersionedTransaction) {
      const recovered = VersionedTransaction.deserialize(out.signedTransaction);
      return recovered as T;
    }
    const recovered = Transaction.from(out.signedTransaction);
    return recovered as T;
  }

  async function signAll<T extends Transaction | VersionedTransaction>(
    txs: T[]
  ): Promise<T[]> {
    // Sign sequentially to be UX-safe with Privy modal. Parallel also works
    // but each sign may prompt, so sequential gives a stable order.
    const out: T[] = [];
    for (const tx of txs) out.push(await signOne(tx));
    return out;
  }

  return {
    publicKey,
    signTransaction: signOne,
    signAllTransactions: signAll,
    // `payer` is declared on the Anchor Wallet interface but never accessed
    // when the wallet provides signing functions; cast to satisfy the type.
     
    payer: undefined as unknown as never,
  };
}
