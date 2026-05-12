# Architecture

High-level map of the ascertainty-web codebase and its runtime.

## Stack

- **Next.js 15** (App Router, React 19, `type: "commonjs"`)
- **Tailwind v4** + **shadcn/ui**
- **Privy** for auth + Solana signer
- **Drizzle ORM** on Postgres (Neon)
- **Anchor** (`@coral-xyz/anchor`, `@anchor-lang/core`) against Solana Devnet
- **pm2** + **Caddy** for process management and TLS in production

## Directory tree

```
app/                        Next.js App Router
  layout.tsx                Global shell (providers, nav, footer)
  page.tsx                  Landing (SSR)
  landing-client.tsx        Client-side hero animation
  providers.tsx             Privy + React Query + Toaster
  admin/                    Admin dashboard
    page.tsx                Overview
    auditors/ mrv/ projects/ pools/
  pools/ projects/          Public detail pages
  portfolio/                Investor portfolio
    portfolio-client.tsx
  api/
    admin/                  Admin-only writes (auditors, distributions, mrv, pools, projects, withdraw)
    indexer/                GET status + POST sync
    investor/               Position helpers + transaction stamping
    wallet/                 Balance lookup
    pools/ projects/        Read helpers

components/                 UI
  ui/                       shadcn/ui primitives
  layout/                   Nav, site chrome
  landing/                  Hero, background effects
  investor/                 Buy modal, position card, claim form
  admin/                    Forms for every admin action
  shared/                   Footer, explorer links, formatters

lib/
  admin/
    session.ts              Verifies Privy token + admin_wallets lookup
    indexer-sync.ts         Client helper that POSTs /api/indexer/sync
    use-admin-tx.ts         Hook wrapping admin signer flow
  db/
    schema.ts               Drizzle schema (tables + enums)
    index.ts                Lazy singleton for postgres-js + drizzle
    queries/                Typed query helpers per domain
  hooks/
    use-is-admin.ts         Admin check against /api/admin/check
    use-investor.ts         Portfolio fetch helper
  indexer/
    connection.ts           RPC factory (server)
    db.ts                   postgres-js singleton for jobs
    decode.ts               Borsh decoders per Anchor account
    discriminators.ts       Anchor discriminator constants
    sync-all.ts             Orchestrator
    sync-projects.ts        Projects mirror
    sync-pools.ts           Pools mirror
    sync-pool-project-links.ts
    sync-investor-positions.ts
    sync-mrv-projects.ts sync-baselines.ts sync-verifications.ts
    sync-auditors.ts
  privy/
    config.ts               Privy provider base config
    signer.ts               useSignAndSend wrapper
    verify.ts               Server-side token verification
  solana/
    pda.ts                  Deterministic PDA derivation
    program.ts              AnchorProvider + Program factory
    idl/                    Symlink/copy of idl/*
    reads.ts                Lightweight read helpers
    balances.ts             SOL / USDC balance helpers
    tx/                     One builder per on-chain instruction
  utils/
    cn.ts format.ts validation.ts

idl/                        exira.json + exira.ts (Anchor IDL, public)
scripts/                    seed-admin, sync-all-cli
public/                     Static assets
tests/
  unit/                     Vitest
  integration/              Mocha (devnet)
  e2e/                      Playwright
deploy/                     Caddyfile + pm2 + systemd templates
docs/                       This folder
```

## Request lifecycle — read

1. Browser requests `/projects/<id>`.
2. Server component in `app/projects/[id]/page.tsx` runs `db.select(...)`
   on Postgres via the Drizzle singleton.
3. Component tree renders and streams to the client. Hydration attaches
   React Query for any client-driven refreshes (e.g. portfolio).

## Request lifecycle — write

1. User clicks "Buy" on a project card; `components/investor/buy-modal.tsx`
   collects the amount and calls a builder in `lib/solana/tx/`.
2. The builder returns a `Transaction`; `lib/privy/signer.ts`'s
   `useSignAndSend` asks Privy to sign and sends to devnet.
3. On confirmation the client POSTs `{ signature, type, projectId, ... }`
   to `/api/investor/transactions` which inserts a row into
   `transactions`. The portfolio immediately reflects the action.
4. Behind the scenes, the next indexer sweep will also see the new
   `InvestorPosition` account and upsert it into `investor_positions`.

## Indexer model

The indexer is account-only: it does not derive state from logs or
signatures. For each Anchor account type it calls
`program.account.<T>.all()`, maps the result through the helpers in
`lib/indexer/decode.ts`, and upserts into Postgres on the corresponding
`onchain_<T>_id` key.

Order of `sync-all.ts`:

1. `syncProjects`
2. `syncPools`
3. `syncPoolProjectLinks`
4. `syncInvestorPositions`
5. `syncMrvProjects` → `syncBaselines` → `syncVerifications`
6. `syncAuditors`

Signatures are not scraped. The per-user transaction history is built by
the client stamping into `transactions` via
`POST /api/investor/transactions` right after confirmation (recent
addition — the pre-existing `syncTransactions`/`indexer_state` path has
been replaced by this write-through model).

`TODO: verify` — confirm whether a background `syncTransactions` job is
still expected (the `indexer_state` table is still in the schema and may
be used by tooling outside this repo).

## Signer path

```
UI                        lib/solana/tx/*       lib/privy/signer.ts        Privy
│──build Transaction──────▶                                                       
│                          tx────────────────▶ useSignAndSend              
│                                              │──signTransaction──────▶   
│                                              │◀─signed tx────────────   
│                                              │──send to RPC──────▶ devnet
│◀─signature──────────────────────────────────                             
│                                                                          
│──POST /api/investor/transactions──▶ Postgres                             
```

Signatures are encoded with `bs58.encode(new Uint8Array(...))` on the
client before they hit the API.

## Admin gate

1. `/admin/*` routes call `requireAdmin()` from `lib/admin/session.ts`.
2. `requireAdmin()` reads the Privy access-token cookie, verifies it via
   `@privy-io/server-auth`, and looks up the resolved pubkey in
   `admin_wallets`.
3. If `PRIVY_APP_SECRET` is missing and `DEV_ADMIN_PUBKEY` is set,
   verification is skipped and `DEV_ADMIN_PUBKEY` is trusted.

Every admin-only route in `app/api/admin/*` is expected to call this
helper.

## Pool model

Pools wrap multiple projects. A `PoolProjectLink` Anchor account anchors
a project to a pool; the UI derives pool-level stats (total raised,
investor count, average APR) from the set of linked projects. Pool
writes (`create_pool`, `add_to_pool`, `buy_pool`, `sweep_pool`) are all
in `lib/solana/tx/` with matching admin UI in `components/admin/`.
