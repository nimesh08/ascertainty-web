# Exira Web

> Frontend and thin backend for the Exira protocol — tokenized MSME climate finance on Solana.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)](https://orm.drizzle.team/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/?cluster=devnet)

## What is this?

Exira is a climate-finance protocol for Indian MSMEs. The core idea: MSMEs have
cash-flowing assets (rooftop solar, efficient lighting retrofits, EV fleets,
biomass digesters) that also produce measurable carbon abatement. Exira lets
investors fund those assets directly with USDC and receive two complementary
payoffs: a proportional share of the project's USDC cash flows, and a share of
verified carbon credits issued against an approved MRV (Measurement,
Reporting, Verification) baseline.

This repository contains the frontend and a thin server layer: Next.js 15
routes that render public pages (landing, projects, pools, portfolio, admin),
a small set of API routes for admin-only writes and indexer triggers, and an
indexer that mirrors the on-chain state (Anchor accounts on Solana Devnet) into a
Postgres database (Neon) for fast reads. The on-chain Anchor program lives in
a separate repo: **[nimesh08/exira-contracts](https://github.com/nimesh08/exira-contracts)**.

## Live deployment

A preview build runs on an EC2 box at **https://13.201.222.240/** against
Solana Devnet. Browsers show a certificate warning because the cert is issued
for an IP via Caddy's shortlived ACME profile; proceed past the warning.

## Architecture

```mermaid
flowchart LR
    B[Browser<br/>Privy SDK] -->|HTTPS| C[Caddy<br/>:443]
    C -->|reverse_proxy| N[Next.js / pm2<br/>:3100]
    N -->|Drizzle / postgres-js| P[(Neon Postgres)]
    N -->|@solana/web3.js<br/>Anchor| S[Solana Devnet<br/>via Helius RPC]
    B -.->|signTransaction| S
    S -.->|account reads| I[Indexer<br/>lib/indexer/*]
    I --> P
```

- The browser talks to Privy for auth and wallet signing, and to the Next.js
  app for HTTP.
- Next.js reads from Postgres for listing / portfolio pages. Writes go
  on-chain (signed by the user's Privy-embedded or external Solana wallet).
- A server-side indexer (`lib/indexer/*`) polls Anchor accounts via
  `program.account.<T>.all()` and upserts into Postgres. It can be triggered
  one-shot (`npx tsx scripts/sync-all-cli.ts`) or via
  `POST /api/indexer/sync`.
- Transactions emitted from the UI are stamped into `transactions` by
  `POST /api/investor/transactions` right after confirmation, which means the
  portfolio reflects user activity without waiting for a full indexer sync.

## Quickstart

```bash
gh repo clone nimesh08/exira-web
cd exira-web
cp .env.example .env.local && $EDITOR .env.local
npm install --legacy-peer-deps
npm run db:push
npm run db:seed-admin
npm run dev
```

`--legacy-peer-deps` is required because a handful of Solana-adjacent packages
still express older peer ranges against React 19.

Open http://localhost:3000 — the landing page should render. Connecting a
wallet requires a Privy app with `localhost:3000` added to its allowed
origins. See [`docs/PRIVY.md`](./docs/PRIVY.md).

## Environment

See [`.env.example`](./.env.example) for the authoritative list with comments,
and [`docs/ENV.md`](./docs/ENV.md) for a detailed variable-by-variable
reference.

| Variable                         | Required | What it's for                                |
| -------------------------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`                   | yes      | Neon Postgres connection string              |
| `NEXT_PUBLIC_PRIVY_APP_ID`       | yes      | Privy app ID (client)                        |
| `PRIVY_APP_SECRET`               | yes      | Privy app secret (server-only)               |
| `NEXT_PUBLIC_SOLANA_RPC`         | yes      | Devnet RPC (Helius recommended)              |
| `NEXT_PUBLIC_SOLANA_WS`          | no       | Matching WebSocket RPC                       |
| `NEXT_PUBLIC_SOLANA_MAINNET_RPC` | no       | Mainnet RPC (used by Privy for mainnet chain)|
| `NEXT_PUBLIC_SOLANA_CLUSTER`     | yes      | `devnet` or `mainnet-beta`                   |
| `NEXT_PUBLIC_EXIRA_PROGRAM_ID`   | yes      | Deployed program ID (devnet default in code) |
| `ADMIN_WALLET`                   | yes      | Base58 admin pubkey for `/admin` gate        |
| `HELIUS_RPC_URL`                 | no       | Server-side RPC override for the indexer     |
| `INDEXER_SECRET`                 | no       | Shared-secret header for indexer sync        |
| `DEV_INDEXER_TOKEN`              | no       | Dev bypass for the admin sync button         |
| `NEXT_PUBLIC_DEV_INDEXER_TOKEN`  | no       | Same token exposed to client in dev          |
| `DEV_ADMIN_PUBKEY`               | no       | Impersonate admin when Privy is absent (dev) |

## Database

Schema in `lib/db/schema.ts`. The app expects a Neon Postgres database
reachable via `postgres-js` with `prepare: false`.

```bash
npm run db:push         # push schema to the DB
npm run db:seed-admin   # insert ADMIN_WALLET into admin_wallets
```

See [`docs/DATABASE.md`](./docs/DATABASE.md) for schema overview and reset
procedures.

## Privy

Privy handles authentication (email, Google, external wallets) and provides
the Solana signer used for all transactions. The provider configuration lives
in `app/providers.tsx` and `lib/privy/config.ts`. See
[`docs/PRIVY.md`](./docs/PRIVY.md) for dashboard setup — allowed origins,
enabled login methods, Solana chain list.

## Indexer

The indexer mirrors on-chain Anchor accounts into Postgres. Both flavors:

```bash
npx tsx scripts/sync-all-cli.ts                  # one-shot, from the shell
curl -X POST \                                   # via the API (admin-gated)
  -H "x-admin-wallet: $ADMIN_WALLET" \
  https://<your-host>/api/indexer/sync
```

The admin dashboard (`/admin`) has a "Run indexer sync" action that hits the
same endpoint. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the
sync model (account-only reads plus signature stamping via
`/api/investor/transactions`).

## Running tests

The repo ships three flavors:

```bash
npm run test:unit         # Vitest (pda, tx-builders, validators, db queries)
npm run test:integration  # Mocha against devnet (read-only by default)
npm run test:e2e          # Playwright (landing + responsive)
```

Type-checking and production build:

```bash
npx tsc --noEmit
npm run build
```

The devnet integration tests require devnet SOL/USDC in the admin wallet when
run with `LIVE_WRITE=1`. Default runs are read-only.

## Deployment

Production on EC2 runs Next.js in standalone (`npm run start`) behind Caddy
(TLS termination + HTTP→HTTPS redirect) and pm2 (process supervision). See
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the full runbook and
[`deploy/`](./deploy) for reference Caddy/pm2/systemd templates.

## Project structure

```
exira-web/
├── app/                   Next.js App Router (routes + server components)
│   ├── admin/             Admin dashboard (auditors, MRV, projects, pools)
│   ├── api/               Route handlers (admin, indexer, investor, wallet)
│   ├── pools/ projects/ portfolio/
│   ├── landing-client.tsx
│   ├── providers.tsx      Privy + React Query providers
│   └── layout.tsx
├── components/            shadcn/ui primitives + feature UI
│   ├── admin/ investor/ landing/ layout/ shared/ ui/
├── lib/
│   ├── admin/             Admin session + indexer-sync helper
│   ├── db/                Drizzle schema + typed queries
│   ├── hooks/             use-is-admin, use-investor, ...
│   ├── indexer/           Anchor → Postgres sync jobs
│   ├── privy/             Privy config + Solana signer adapter
│   ├── solana/            PDAs, program factory, tx builders
│   └── utils/             cn, format, zod validators
├── idl/                   exira.json + exira.ts (Anchor IDL, public)
├── scripts/               sync-all-cli, seed-admin
├── public/                static assets
├── types/                 bs58.d.ts
├── tests/                 unit + integration + e2e
├── deploy/                Caddyfile + pm2 + systemd reference templates
├── docs/                  SETUP, ENV, DATABASE, PRIVY, ARCHITECTURE,
│                          DEPLOYMENT, TROUBLESHOOTING
├── .env.example
├── LICENSE                (MIT)
└── README.md
```

## Related

- **[nimesh08/exira-contracts](https://github.com/nimesh08/exira-contracts)** —
  Anchor program (the on-chain half of this stack).

## License

[MIT](./LICENSE) © 2026 Exira
