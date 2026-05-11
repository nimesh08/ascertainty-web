"use client";

import { useState, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { privyConfig, PRIVY_APP_ID } from "@/lib/privy/config";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

const DEVNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
const MAINNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ||
  "https://api.mainnet-beta.solana.com";

function toWsUrl(httpUrl: string): string {
  if (httpUrl.startsWith("https://")) return "wss://" + httpUrl.slice("https://".length);
  if (httpUrl.startsWith("http://")) return "ws://" + httpUrl.slice("http://".length);
  return httpUrl;
}

const solanaRpcs = {
  "solana:devnet": {
    rpc: createSolanaRpc(DEVNET_RPC),
    rpcSubscriptions: createSolanaRpcSubscriptions(toWsUrl(DEVNET_RPC)),
    blockExplorerUrl: "https://explorer.solana.com?cluster=devnet",
  },
  "solana:mainnet": {
    rpc: createSolanaRpc(MAINNET_RPC),
    rpcSubscriptions: createSolanaRpcSubscriptions(toWsUrl(MAINNET_RPC)),
    blockExplorerUrl: "https://explorer.solana.com",
  },
} as const;

function useIsSecureContext(): boolean {
  const [secure, setSecure] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSecure(
      window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    );
  }, []);
  return secure;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );
  const secure = useIsSecureContext();

  const baseConfig = secure
    ? privyConfig
    : {
        ...privyConfig,
        embeddedWallets: {
          ...privyConfig.embeddedWallets,
          solana: { createOnLogin: "off" as const },
        },
      };

  const safeConfig = {
    ...baseConfig,
    externalWallets: {
      ...baseConfig.externalWallets,
      solana: { connectors: solanaConnectors },
    },
    solana: {
      ...baseConfig.solana,
      rpcs: solanaRpcs,
    },
  };

  return (
    <QueryClientProvider client={client}>
      <PrivyProvider appId={PRIVY_APP_ID} config={safeConfig}>
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster />
        </TooltipProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
