# Deployment

This is the runbook for the production deployment at
[ascertainty.com](https://ascertainty.com/) (Next.js on EC2 behind Caddy +
pm2). Adapt as needed for other hosts.

## Topology

```
public internet ─┐
                 │   :443 TLS
                 ▼
             Caddy (ACME)
                 │   reverse_proxy
                 ▼
             Next.js (pm2)  ── :3100
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
 Neon Postgres          Solana Devnet
                        (Helius RPC)
```

- **Caddy** terminates TLS and reverse-proxies to Next.js on port 3100.
  ACME issues a Let's Encrypt cert against the configured hostname; cert
  renewal is automatic.
- **pm2** supervises the Next.js `npm run start` process. Restart on
  failure, start on boot via `pm2 startup`.
- **systemd** is a fallback alternative to pm2 (out of scope for this
  runbook).

## Host prep (one-time)

```bash
# Node + npm (nvm or package manager; Node 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Caddy
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy

# pm2
sudo npm install -g pm2
```

Open ports 443 (and optionally 80 for Caddy's HTTP→HTTPS redirect) in
the security group / firewall. Do NOT expose port 3100 to the public
internet.

## Deploy the app

```bash
# 1. Clone + install
gh repo clone nimesh08/ascertainty-web /home/ubuntu/exira-web
cd /home/ubuntu/exira-web
npm install --legacy-peer-deps

# 2. Env
cp .env.example .env.local
$EDITOR .env.local  # fill in real values

# 3. Schema + seed
npm run db:push
npm run db:seed-admin

# 4. Build
npm run build

# 5. Start under pm2
#    ecosystem.config.js lives on the box (not committed to the repo).
#    Minimum config: pm2 start npm --name ascertainty-web -- run start
pm2 start npm --name ascertainty-web -- run start
pm2 save
pm2 startup   # follow the printed instructions

# 6. Caddy (paste the reverse-proxy block into /etc/caddy/Caddyfile;
#    point it at 127.0.0.1:3100 and your hostname)
sudo $EDITOR /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## v0.1 portal MVP — one-time setup

The PINN-backed pages (`/auditor/intake`, `/lender/[deal_id]`,
`/lender/[deal_id]/soft-commit`) need three pieces beyond the Next.js bundle:

### 1. GitHub secrets + vars (Settings → Secrets and variables → Actions)

Add:
- **Secret** `DATABASE_URL` — Neon production URL (used by the new
  `db-migrate` CI job to apply schema changes via `drizzle-kit push`).
- **Variable** `INFERENCE_BASE_URL` — public URL of the inference service,
  e.g. `https://inference.ascertainty.com` (defaults to `http://127.0.0.1:8000`
  if unset, which works when inference runs as an EC2 sidecar).
- **Variable** `INFERENCE_TIMEOUT_MS` — optional, defaults to 10000.

### 2. Inference sidecar on the EC2 (one-time, not in CI)

The PINN inference service lives in the `exira-pinn` repo (currently not
in git; copy via rsync). On the EC2:

```bash
# From your laptop, push the directory once:
rsync -avz --exclude .private --exclude .venv --exclude __pycache__ \
  /path/to/exira-pinn/ deploy@<EC2>:/opt/exira-pinn/

# On the EC2:
ssh deploy@<EC2>
cd /opt/exira-pinn/deploy
bash install.sh        # venv, requirements.txt, systemd unit, smoke test

# Add the Caddy block for inference.ascertainty.com (see deploy/Caddyfile.snippet)
sudo $EDITOR /etc/caddy/Caddyfile
sudo systemctl reload caddy

# DNS: A record inference.ascertainty.com → EC2 elastic IP
# Verify externally:
curl -fsS https://inference.ascertainty.com/v1/health | jq .checkpoints
```

After every PINN retrain or `inference.py` change, re-rsync the exira-pinn
directory and run `bash /opt/exira-pinn/deploy/update-inference.sh`.

### 3. One-line patch to `run-deploy` on the EC2

The CI workflow writes a runtime env file at `$HOME/exira-web-runtime.env`
before invoking `run-deploy`. The script must source it and pass
`--update-env` to pm2 so the Node process picks up `INFERENCE_BASE_URL`:

```bash
# Add near the top of ~/run-deploy on the EC2 host:
set -a
. "$HOME/exira-web-runtime.env" 2>/dev/null || true
set +a

# And change the pm2 line to:
pm2 restart exira-web-v2 --update-env
```

Without `--update-env`, pm2 keeps the old environment and the
`INFERENCE_BASE_URL` change won't take effect on restarts.

### 4. Seed your wallet as an auditor (one-time)

`/auditor/intake` checks the `auditors` table; the admin fallback covers
shadow-dogfooding. Either:

```bash
# Easier — admin wallets are accepted as auditors during shadow mode:
DATABASE_URL=<neon-prod> npm run db:seed-admin -- --wallet <your-Solana-pubkey>

# Or insert a real auditor row:
psql "$DATABASE_URL" <<SQL
INSERT INTO auditors (wallet_pubkey, name, certification, is_active)
VALUES ('<wallet>', 'Your Name', 'CEA-XXXXX', true);
SQL
```

### Smoke-test the v0.1 loop

1. Log in on `https://ascertainty.com/` with the seeded wallet.
2. Visit `/auditor/intake`. Fill 5 fields: rated kW, hours/day, days/yr, leakage %, sector.
3. Confidence band should populate live (proves inference URL + env + DNS).
4. Click "Save & open lender preview" → redirects to `/lender/<deal-id>` with deal-level summary.
5. Click "Sign soft commitment" → records to `soft_commitments` table.

Failure modes:
- Band never appears; network tab shows 502 on `/api/inference-preview` → inference service down or `INFERENCE_BASE_URL` wrong.
- Save 500s with `relation "underwriting_results" does not exist` → DB migrate didn't run; check the `db-migrate` job log.
- 401 on intake → wallet not in `admin_wallets` or `auditors`.

## Common operations

### Restart the web process

```bash
pm2 restart exira-web-v2
pm2 status
```

### Tail logs

```bash
pm2 logs exira-web-v2
pm2 logs exira-web-v2 --lines 500 --err
```

Log files also live at `~/.pm2/logs/exira-web-v2-{out,error}.log`.

### Redeploy a new version

```bash
cd /home/ubuntu/exira-web
git pull
npm install --legacy-peer-deps
npm run build
pm2 restart exira-web-v2
```

No DB-side migration step is required unless `lib/db/schema.ts`
changed, in which case re-run `npm run db:push` before
`pm2 restart`.

### Run the indexer manually

```bash
cd /home/ubuntu/exira-web
npx tsx scripts/sync-all-cli.ts
```

Or hit the HTTP endpoint:

```bash
curl -X POST -H "x-indexer-key: $INDEXER_SECRET" \
  https://ascertainty.com/api/indexer/sync
```

### Caddy cert renewal

Caddy auto-renews. Status:

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -n 100
```

## Scaling notes

- Next.js runs single-process by default. To scale, restart pm2 in
  cluster mode (`pm2 start npm --name ascertainty-web -i max -- run start`).
  The app is stateless — all state lives in Postgres and on-chain.
- The indexer is safe to run alongside HTTP traffic; if you want a
  dedicated indexer process, run `scripts/sync-all-cli.ts` on a timer
  (cron / systemd timer) on a second box.

## Rollback

pm2 keeps the last-built artifact in `.next/`. To rollback:

```bash
cd /home/ubuntu/exira-web
git checkout <previous-sha>
npm install --legacy-peer-deps
npm run build
pm2 restart exira-web-v2
```
