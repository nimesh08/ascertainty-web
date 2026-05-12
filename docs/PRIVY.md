# Privy

[Privy](https://dashboard.privy.io/) provides authentication (email,
Google, wallet) and the Solana signer the app uses for every transaction.
Privy configuration is split across two files:

- [`lib/privy/config.ts`](../lib/privy/config.ts) — app ID + base config
  (login methods, embedded wallet policy, Solana connectors).
- [`app/providers.tsx`](../app/providers.tsx) — wraps `PrivyProvider`
  around the app tree, injects the Solana RPC config, and conditionally
  disables embedded-wallet creation on non-secure origins.

## Dashboard checklist

On [dashboard.privy.io](https://dashboard.privy.io/):

### 1. App creation

Create a new app for `ascertainty-web`. Copy:

- **App ID** → `NEXT_PUBLIC_PRIVY_APP_ID`
- **App secret** → `PRIVY_APP_SECRET` (server-only)

### 2. Allowed origins

Settings → Domains → add every origin the app will serve from:

- `http://localhost:3000` (dev)
- `https://<your-preview-host>` (e.g. `https://ascertainty.com`)
- Any custom domain once DNS is ready

Without this, the Privy modal will refuse to open.

### 3. Login methods

Settings → Login methods → enable:

- Email (OTP)
- Google
- Wallet (Solana section — see next)

### 4. Solana configuration

Settings → Chains → Solana → enable **Devnet** (and optionally
**Mainnet-beta**). The app sets the RPC per-chain from
`NEXT_PUBLIC_SOLANA_RPC` (devnet) and `NEXT_PUBLIC_SOLANA_MAINNET_RPC`
(mainnet) via the `solana.rpcs` map in `app/providers.tsx`.

If you only enable devnet in the dashboard, the app will log the
harmless runtime warning _"No RPC configuration for solana:mainnet"_
whenever Privy tries to look up mainnet balances; either enable mainnet
or scope Privy to devnet only in `privyConfig.solana.chains` (see
`lib/privy/config.ts`).

### 5. External wallet connectors

External wallets (Phantom, Solflare, Backpack, etc.) are wired through
`toSolanaWalletConnectors` in `app/providers.tsx`:

```ts
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});
```

No dashboard configuration is required for individual connectors; Privy
detects installed wallets and offers them in the modal.

### 6. Embedded wallets

`privyConfig.embeddedWallets.solana.createOnLogin` is set to
`"users-without-wallets"` so every email/Google user gets a Privy-hosted
Solana wallet on first login. The provider downgrades this to `"off"` on
non-secure origins (`!window.isSecureContext`) to avoid the Web Crypto
errors you'd otherwise see on bare-IP HTTPS certs that some browsers
don't consider secure.

`TODO: verify` — reread `lib/privy/config.ts` if behavior changes.

## Server-side verification

`lib/privy/verify.ts` uses `@privy-io/server-auth` to verify the access
token the browser attaches as a cookie. `lib/admin/session.ts` then
cross-checks the returned pubkey against the `admin_wallets` table.

If `PRIVY_APP_SECRET` is missing and `DEV_ADMIN_PUBKEY` is set, the
verifier falls back to trusting `DEV_ADMIN_PUBKEY` as the acting admin.
That path is meant for local dev only — leave `DEV_ADMIN_PUBKEY` unset
in production.

## Signing path

1. UI builds a `Transaction` in `lib/solana/tx/*`.
2. `lib/privy/signer.ts` wraps Privy's `useSignTransaction` into the
   shape the helper hooks expect (`useSignAndSend`).
3. After signing, the transaction is sent to devnet. On confirmation the
   signature is POSTed to `/api/investor/transactions` so the portfolio
   reflects the action immediately.
4. `bs58.encode(Uint8Array)` is used to serialize the signature for the
   backend.
