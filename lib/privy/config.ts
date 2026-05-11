import type { PrivyClientConfig } from "@privy-io/react-auth";

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export const SOLANA_CHAIN = "solana:devnet" as const;

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet", "google"],
  appearance: {
    theme: "dark",
    accentColor: "#4ADE80",
    logo: undefined,
    walletChainType: "solana-only",
    showWalletLoginFirst: false,
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
    solana: {
      createOnLogin: "users-without-wallets",
    },
  },
};
