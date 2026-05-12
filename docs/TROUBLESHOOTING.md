# Troubleshooting

Common runtime issues, ordered by how often they come up.

## Privy modal: Phantom not detected / universal-link download

**Symptom**: clicking "Connect wallet" in mobile Safari offers to
download Phantom instead of opening the installed app.

**Cause**: the Solana connectors need to be constructed with
`shouldAutoConnect: false` (which is already done in
`app/providers.tsx`). If you see this on desktop, the browser is in
private mode and blocking extension detection.

**Fix**: open in a normal window. On mobile, make sure the Phantom
deeplink is reachable (open `https://phantom.app` from the same
browser once).

## Console warning: `No RPC configuration for solana:mainnet`

**Symptom**: Privy logs this on every request.

**Cause**: the Privy provider is configured with both `solana:devnet`
and `solana:mainnet`, but the dashboard only has Devnet enabled. Privy
looks up balances for every chain it knows about.

**Fix**: either enable Mainnet-beta in the Privy dashboard (Settings
→ Chains) or remove the `solana:mainnet` entry from `solanaRpcs` in
`app/providers.tsx`. Setting `NEXT_PUBLIC_SOLANA_MAINNET_RPC` alone is
not enough — the dashboard side also needs to match.

## Portfolio positions stuck after a buy

**Symptom**: user successfully buys, sees the toast, but `/portfolio`
still shows the old position count until a manual refresh.

**Cause**: the `use-investor` hook's effect dependency array referenced
an object that was re-created every render, which either looped or
cached the old result. The stamping path via
`POST /api/investor/transactions` is meant to update the portfolio
immediately; if the effect deps are unstable the refetch gets skipped.

**Fix**: confirm `lib/hooks/use-investor.ts` only depends on primitive
identifiers (pubkey string, project id). If positions still lag, trigger
`POST /api/indexer/sync` from `/admin` to force a full Postgres
refresh.

## TLS warning on a preview / staging box

**Symptom**: browser shows "Your connection is not private" /
`NET::ERR_CERT_COMMON_NAME_INVALID` when opening a preview build by IP
or by a hostname that doesn't match the cert.

**Cause**: Caddy's ACME shortlived profile issues a certificate for the
configured server name. Hitting the box via a different name or via a
bare IP doesn't match.

**Fix**: configure a real DNS name in `/etc/caddy/Caddyfile`
(e.g. `preview.ascertainty.com`), point it at the box, and reload Caddy.
A Let's Encrypt cert is auto-provisioned and the warning disappears.

## `bigint-buffer` native binding noise at boot

**Symptom**: warning lines like
`bigint-buffer: binding not found, falling back to JS implementation`.

**Cause**: `@solana/spl-token` depends on `bigint-buffer` which ships
a native addon; the addon fails to build on some Node versions and
falls back to pure JS. The pure-JS path is slower but functionally
correct.

**Fix**: ignore the warning. If you want it gone, use a Node version
that matches the prebuilt binaries (Node 20 LTS works for current
versions) or `npm rebuild bigint-buffer`.

## `npm install` fails with peer-dependency conflicts

**Symptom**: `npm error ERESOLVE could not resolve` about
`react@18` vs `react@19`, or similar.

**Fix**: always install with `--legacy-peer-deps`. Several Solana and
Privy transitive deps have stale peer ranges. The lockfile here was
created with that flag.

## Neon connection dropped during `npm run build`

**Symptom**: build fails with `CONNECT_TIMEOUT` or
`SASL_SIGNATURE_MISMATCH`.

**Cause**: Neon's pooled endpoint cools down on idle and a
DB-dependent server component tries to query during SSG.

**Fix**:

1. Confirm `DATABASE_URL` uses the pooled host
   (`ep-....neon.tech`, not `ep-....neon.tech:5432` direct).
2. Make sure the `db` singleton in `lib/db/index.ts` is lazy
   (it is — it only connects on first call).
3. If a page uses `force-static` with a DB query, switch to
   `force-dynamic` or wrap the DB call in `cache()` and handle
   errors.

## Schema drift between local dev and production

**Symptom**: production API returns `column "x" does not exist`.

**Cause**: `lib/db/schema.ts` changed locally and `db:push` was not run
on the production Neon branch.

**Fix**:

```bash
# from a box with prod DATABASE_URL in the shell environment
DATABASE_URL="postgresql://..." npm run db:push
```

Neon branches are cheap — if you need to test a migration safely,
branch the production DB, point staging at the branch, run
`db:push`, verify, then promote.

## Indexer skips new projects

**Symptom**: on-chain project exists but `/projects` doesn't show it.

**Cause**: the indexer sync hasn't run since the project was created.

**Fix**:

```bash
npx tsx scripts/sync-all-cli.ts
```

or hit `POST /api/indexer/sync` from the admin dashboard.

## Admin check failing on a wallet that should be admin

**Symptom**: user is `ADMIN_WALLET` but `/admin` redirects or API
returns 401.

**Fix checklist**:

1. `SELECT * FROM admin_wallets;` — is the pubkey there? Run
   `npm run db:seed-admin`.
2. Privy access-token cookie present? DevTools → Application → Cookies.
   If not, log out/in.
3. `PRIVY_APP_SECRET` set on the server? `requireAdmin()` fails closed
   without it (unless `DEV_ADMIN_PUBKEY` is set).
4. `lib/admin/session.ts` compares with `===` on base58 — the pubkey
   is case-sensitive.
