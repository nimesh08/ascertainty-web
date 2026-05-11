# Database

The app stores all read-side state in Postgres (Neon). All writes are
Anchor transactions on Solana Devnet; the indexer mirrors the resulting
account state into Postgres.

## Backend

- **Neon Postgres** — serverless Postgres, pooled connection.
- Driver: [`postgres`](https://github.com/porsager/postgres) with
  `prepare: false` (required by Neon's pooler).
- ORM: [Drizzle](https://orm.drizzle.team/) (schema-first, typed
  queries).

Wired in `lib/db/index.ts` via a lazy singleton that only opens the
connection on first use (so `next build` does not eagerly connect to
Neon).

## Schema

Defined in [`lib/db/schema.ts`](../lib/db/schema.ts). High-level tables:

| Table                    | Role                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `admin_wallets`          | Allowlist of pubkeys that can use `/admin`                     |
| `projects`               | MSME projects, mirrored from Anchor `Project` accounts         |
| `pools`                  | Pools of projects, mirrored from Anchor `Pool` accounts        |
| `pool_projects`          | Many-to-many link, mirrored from `PoolProjectLink`             |
| `investor_positions`     | Per-wallet per-project position, mirrored from `InvestorPosition` |
| `mrv_projects`           | Project + baseline + verification registry                     |
| `mrv_baselines`          | Baseline submissions                                           |
| `mrv_verifications`      | Verification submissions                                       |
| `auditors`               | Approved auditor pubkeys                                       |
| `transactions`           | Signature-stamped log of investor and admin actions            |
| `indexer_state`          | Resume cursor for `syncTransactions` (signature pagination)    |

Enums (`projectStatusEnum`, `poolStatusEnum`, `mrvProjectStatusEnum`,
`txTypeEnum`) mirror the on-chain enums exactly.

## Migrations

Drizzle Kit is configured in [`drizzle.config.ts`](../drizzle.config.ts).

```bash
npm run db:generate   # emits SQL to drizzle/ (generate on schema change)
npm run db:push       # apply schema directly (used in dev + prod here)
```

This repo uses `db:push` as the canonical deploy step — the schema is
single-tenant and is small enough that the generate/apply dance is
optional. If you want versioned migrations, `db:generate` creates them
under `drizzle/` and you can apply with `drizzle-kit migrate`.

## Seeding the admin row

```bash
npm run db:seed-admin
```

Runs [`scripts/seed-admin.ts`](../scripts/seed-admin.ts) which inserts
the admin wallet into `admin_wallets` with `ON CONFLICT DO NOTHING`.

> `TODO: verify` — the script currently has a hardcoded pubkey. Edit
> before seeding a fresh deployment.

## Resetting the database

Neon has a "Reset database" button in the console. For a scripted reset
within the same Neon branch:

```sql
-- run in psql or the Neon SQL editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then re-run `npm run db:push` and `npm run db:seed-admin`.

## Sample queries

Verify state after an indexer run:

```sql
-- project count by status
SELECT status, COUNT(*) FROM projects GROUP BY status;

-- most recent investor activity
SELECT tx_type, signature, wallet_pubkey, created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 20;

-- indexer resume cursor
SELECT * FROM indexer_state;
```
