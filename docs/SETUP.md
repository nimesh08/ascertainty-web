# Setup

Local-dev quickstart for `ascertainty-web`.

## Prerequisites

- Node.js 20+ (the production box runs Node 20 under pm2). Node 18 should
  work but is untested.
- `npm` 10+. `pnpm`/`yarn` should work but lockfile is npm.
- A [Neon](https://neon.tech/) project (free tier is fine).
- A [Privy](https://dashboard.privy.io/) app.
- A [Helius](https://www.helius.dev/) account (free tier) for a devnet RPC
  URL with a WebSocket, or fall back to `https://api.devnet.solana.com`.

## 1. Clone and install

```bash
gh repo clone nimesh08/ascertainty-web
cd ascertainty-web
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required. A few Solana/Privy/Anchor transitive
dependencies express old peer ranges that npm 10 otherwise rejects.

## 2. Create `.env.local`

```bash
cp .env.example .env.local
$EDITOR .env.local
```

Minimum values needed to boot:

- `DATABASE_URL` — from the Neon console (use the pooled connection string).
- `NEXT_PUBLIC_PRIVY_APP_ID` + `PRIVY_APP_SECRET` — from the Privy
  dashboard (App settings → App ID / App secret).
- `NEXT_PUBLIC_SOLANA_RPC` — a devnet RPC URL. Helius gives you one with a
  key; public fallback is `https://api.devnet.solana.com`.
- `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`.
- `ADMIN_WALLET` — a base58 Solana pubkey. This is the wallet that is
  allowed into `/admin`. Any pubkey you control works for local dev.
- `DEV_ADMIN_PUBKEY` — optional; set to the same value as `ADMIN_WALLET` if
  you want to access `/admin` without going through Privy.

See [`ENV.md`](./ENV.md) for the full reference.

## 3. Push the schema to Neon

```bash
npm run db:push
```

This applies `lib/db/schema.ts` via Drizzle Kit. It is idempotent — re-run
any time the schema changes.

## 4. Seed the admin table

```bash
npm run db:seed-admin
```

This inserts `ADMIN_WALLET` into `admin_wallets`. The gate logic in
`lib/admin/session.ts` checks this table.

> **Note**: `scripts/seed-admin.ts` currently hardcodes the devnet admin
> pubkey (`AMBKUrFo8LM9psLtppLZBbbXqNU99BQuw9tfeHME2Ltg`). For a fresh
> deployment, edit the script to insert your own `ADMIN_WALLET`, or insert
> manually with SQL. `TODO: verify` — follow-up to read `ADMIN_WALLET`
> from `process.env` instead.

## 5. Boot the dev server

```bash
npm run dev
```

The server binds to `http://localhost:3000`. Hit `/` to confirm the landing
page renders (Neon + RPC do a small amount of SSR work there).

## 6. Populate on-chain state (optional)

If the Anchor program on devnet already has projects/pools/MRV data, run:

```bash
npx tsx scripts/sync-all-cli.ts
```

to mirror them into Postgres. Otherwise `/projects` and `/pools` will be
empty until you create projects through `/admin` or directly via the
contracts repo's scripts.

## 7. Verify

- `/` — landing loads, shows real stat counts if the indexer has run.
- `/projects` — list renders (possibly empty).
- Connect a wallet from the nav (Privy modal).
- `/portfolio` — renders empty state if the wallet has no positions.
- `/admin` — loads for `ADMIN_WALLET` (or `DEV_ADMIN_PUBKEY`).

If something breaks, [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) has the
common ones.
