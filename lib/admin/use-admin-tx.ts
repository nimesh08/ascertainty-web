"use client";

import { useCallback, useMemo } from "react";
import { useWallets } from "@privy-io/react-auth/solana";
import { useSignTransaction } from "@privy-io/react-auth/solana";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { getConnection, getExiraProgram } from "@/lib/solana/program";
import { buildPrivyAnchorWallet } from "@/lib/privy/signer";
import type { Program } from "@anchor-lang/core";
import type { Exira } from "@/lib/solana/idl/exira";

export interface AdminTxContext {
  connection: Connection;
  program: Program<Exira>;
  wallet: PublicKey;
  signAndSend: (tx: Transaction, extraSigners?: Keypair[]) => Promise<string>;
  ready: boolean;
}

/**
 * Hook that wires Privy's connected Solana wallet to an Anchor `Program<Exira>`
 * and exposes a `signAndSend(tx)` helper for admin-authored transactions.
 */
export function useAdminTx(): AdminTxContext {
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  const connection = useMemo(() => getConnection(), []);
  const active = wallets[0];
  const ready = Boolean(active);

  const anchorWallet = useMemo(() => {
    if (!active) return null;
    return buildPrivyAnchorWallet({ wallet: active, sign: signTransaction });
  }, [active, signTransaction]);

  const program = useMemo(() => {
    if (!anchorWallet) return null;
    return getExiraProgram(anchorWallet, connection);
  }, [anchorWallet, connection]);

  const walletKey = useMemo(
    () => (active ? new PublicKey(active.address) : null),
    [active]
  );

  const signAndSend = useCallback(
    async (tx: Transaction, extraSigners: Keypair[] = []): Promise<string> => {
      if (!walletKey || !anchorWallet) {
        throw new Error("No connected wallet");
      }
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = walletKey;

      if (extraSigners.length > 0) tx.partialSign(...extraSigners);

      const signed = await anchorWallet.signTransaction(tx);
      const raw = (signed as Transaction).serialize();

      const signature = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );
      return signature;
    },
    [walletKey, anchorWallet, connection]
  );

  return {
    connection,
    // `program` can be null until wallet resolves — narrow with `ready`
    program: program as Program<Exira>,
    wallet: walletKey as PublicKey,
    signAndSend,
    ready,
  };
}

export type { Program };
export type { VersionedTransaction };
