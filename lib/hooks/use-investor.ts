"use client";

import { useCallback, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSignAndSendTransaction,
  useWallets as useSolanaWallets,
  useSignTransaction as usePrivySignTransaction,
} from "@privy-io/react-auth/solana";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import type { Program } from "@anchor-lang/core";
import bs58 from "bs58";
import type { Exira } from "@/lib/solana/idl/exira";
import { buildPrivyAnchorWallet } from "@/lib/privy/signer";
import { getConnection, getExiraProgram } from "@/lib/solana/program";
import { SOLANA_CHAIN } from "@/lib/privy/config";

export interface InvestorContext {
  ready: boolean;
  connected: boolean;
  publicKey: PublicKey | null;
  walletAddress: string | null;
  connection: Connection;
  program: Program<Exira> | null;
  signAndSend: (tx: Transaction) => Promise<string>;
  login: () => void;
}

export function useInvestor(): InvestorContext {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useSolanaWallets();
  const { signTransaction } = usePrivySignTransaction();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const wallet = wallets?.[0] ?? null;
  const walletAddress = wallet?.address ?? null;

  const connection = useMemo(() => getConnection(), []);

  // Memoize publicKey by address string so downstream `useEffect` deps stay
  // stable across Privy re-renders. Previously we created a fresh PublicKey
  // per render which caused effects keyed on publicKey to loop-cancel.
  const publicKey = useMemo(
    () => (walletAddress ? new PublicKey(walletAddress) : null),
    [walletAddress]
  );

  const program = useMemo(() => {
    if (!wallet) return null;
    const anchorWallet = buildPrivyAnchorWallet({
      wallet,
      sign: signTransaction,
    });
    return getExiraProgram(anchorWallet, connection);
  }, [wallet, signTransaction, connection]);

  const signAndSend = useCallback(
    async (tx: Transaction): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const publicKey = new PublicKey(wallet.address);
      tx.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      const serialized = tx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const out = await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet,
        chain: SOLANA_CHAIN,
      });
      if (!out?.signature) {
        throw new Error("Privy returned no signature");
      }
      return bs58.encode(new Uint8Array(out.signature));
    },
    [wallet, connection, signAndSendTransaction]
  );

  return {
    ready,
    connected: authenticated && !!wallet,
    publicKey,
    walletAddress,
    connection,
    program,
    signAndSend,
    login,
  };
}
