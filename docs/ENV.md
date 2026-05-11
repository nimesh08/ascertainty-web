# Environment variables

Authoritative list. All values are read either at build time (from `.env`)
or at runtime (from `process.env`). Variables prefixed `NEXT_PUBLIC_` are
inlined into the client bundle by Next.js and must therefore be
non-sensitive.

Copy [`.env.example`](../.env.example) to `.env.local` and fill in.

## Database

### `DATABASE_URL`

- **Required.**
- Neon Postgres connection string (pooled). Used by Drizzle + raw
  `postgres-js` in `lib/db/index.ts`, `lib/indexer/db.ts`, and scripts.
- Must use `sslmode=require`.
- Read by: `lib/db/index.ts`, `lib/indexer/db.ts`, `drizzle.config.ts`,
  `scripts/seed-admin.ts`, `scripts/sync-all-cli.ts`,
  `app/api/indexer/status/route.ts`, `tests/unit/db-queries.test.ts`.

## Privy

### `NEXT_PUBLIC_PRIVY_APP_ID`

- **Required.** Public.
- Privy app ID from [dashboard.privy.io](https://dashboard.privy.io/).
- Read by: `lib/privy/config.ts`, `lib/privy/verify.ts`,
  `lib/admin/session.ts`.

### `PRIVY_APP_SECRET`

- **Required.** Secret — server-only.
- Privy app secret. Used by `@privy-io/server-auth` to verify the access
  token sent from the browser on admin routes.
- Read by: `lib/privy/verify.ts`, `lib/admin/session.ts`.

## Solana

### `NEXT_PUBLIC_SOLANA_RPC`

- **Required.** Public (URLs with API keys are exposed to the browser).
- Devnet JSON-RPC endpoint. Helius is recommended; the public endpoint
  `https://api.devnet.solana.com` works but is heavily rate-limited.
- Read by: `app/providers.tsx`, `lib/solana/program.ts`,
  `lib/indexer/connection.ts`, `tests/integration/exira.integration.test.ts`.

### `NEXT_PUBLIC_SOLANA_WS`

- Optional.
- Matching WebSocket URL. If unset, the Privy provider derives one by
  rewriting `https://` → `wss://` on the RPC URL.
- Read by: `lib/solana/program.ts`.

### `NEXT_PUBLIC_SOLANA_MAINNET_RPC`

- Optional.
- Mainnet RPC. Privy is configured with both `solana:devnet` and
  `solana:mainnet` entries; the mainnet entry is used for balance lookups
  against the user's linked wallet on mainnet.
- Read by: `app/providers.tsx`.

### `NEXT_PUBLIC_SOLANA_CLUSTER`

- **Required.** Default `devnet`.
- Controls explorer links and labels in the UI footer.
- Read by: `components/shared/SiteFooter.tsx`.

### `NEXT_PUBLIC_EXIRA_PROGRAM_ID`

- **Required.** Public.
- Base58 program ID for the deployed Anchor program. Default in
  `lib/solana/pda.ts` matches the current devnet deployment
  (`J7z1a2bwMEC8MchgZwskJZ8PzXg4UG674VgD8DuotJn2`).
- Read by: `lib/solana/pda.ts`.

### `HELIUS_RPC_URL`

- Optional. Server-only.
- If set, the server-side indexer (`lib/indexer/connection.ts`) uses this
  RPC instead of `NEXT_PUBLIC_SOLANA_RPC`. Useful to route server
  traffic through a separate Helius key with a higher rate limit than the
  browser uses.

## Admin

### `ADMIN_WALLET`

- **Required.** Public (it's a pubkey).
- Base58 pubkey of the admin wallet. Gates `/admin` and the admin-only API
  routes. Also seeded into `admin_wallets` by `npm run db:seed-admin`.
- Read by: `tests/integration/exira.integration.test.ts`. The runtime check
  uses the database (`admin_wallets` table), which is seeded from this
  variable.

## Dev-only overrides

These SHOULD NOT be set in production.

### `DEV_INDEXER_TOKEN`

- Optional. Server-only.
- Shared token that authenticates `POST /api/indexer/sync` without a
  wallet signature. Must match `NEXT_PUBLIC_DEV_INDEXER_TOKEN` for the
  admin-dashboard "Run indexer sync" button to work.
- Read by: `app/api/indexer/sync/route.ts`.

### `NEXT_PUBLIC_DEV_INDEXER_TOKEN`

- Optional. Public.
- Client copy of `DEV_INDEXER_TOKEN`. The admin page sends this as a
  header so the UI can trigger syncs without re-signing.
- Read by: `lib/admin/indexer-sync.ts`.

### `INDEXER_SECRET`

- Optional. Server-only.
- Alternative shared secret for `POST /api/indexer/sync`, sent as header
  `x-indexer-key`. Use this for cron-style triggers (a cron job outside
  the browser has no wallet to sign with).
- Read by: `app/api/indexer/sync/route.ts`.

### `DEV_ADMIN_PUBKEY`

- Optional. Server-only.
- When set AND Privy is not fully configured, `requireAdmin()` treats
  this as the acting admin pubkey, bypassing Privy token verification.
  Convenient for local dev before Privy is set up.
- Read by: `lib/privy/verify.ts`.

## Runtime

### `NODE_ENV`

- `development` | `production` | `test`. Drizzle uses `development` to
  hot-module the `db` singleton. Next.js sets this based on the command
  (`dev` vs `start`).
- Read by: `lib/db/index.ts`.

## Enumeration source

All variables listed above are derived from `grep process.env.*` across
the tree (excluding `node_modules` and `.next`). If you add a new
`process.env.X` read, please add it here too.
