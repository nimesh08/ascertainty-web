# Deployment

This is the runbook for the reference production box
(EC2 @ `13.201.222.240`). Adapt as needed for other hosts.

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
  A shortlived-profile ACME cert is issued for the bare IP — the default
  for quick preview deployments. Swap for a real domain + Let's Encrypt
  when DNS is ready.
- **pm2** supervises the Next.js `npm run start` process. Restart on
  failure, start on boot via `pm2 startup`.
- **systemd** is a fallback alternative to pm2; see
  [`deploy/exira-web-v2.service`](../deploy/exira-web-v2.service) and
  [`deploy/README.md`](../deploy/README.md).

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
gh repo clone nimesh08/exira-web /home/ubuntu/exira-web
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
cp deploy/ecosystem.config.js .
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed instructions

# 6. Caddy
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
$EDITOR /etc/caddy/Caddyfile   # replace <DOMAIN_OR_IP>
sudo systemctl reload caddy
```

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
  https://13.201.222.240/api/indexer/sync
```

### Caddy cert renewal

Caddy auto-renews. Status:

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -n 100
```

## Scaling notes

- Next.js runs single-process by default. To scale, bump
  `instances` in `deploy/ecosystem.config.js` to `"max"` (pm2 cluster
  mode). Make sure the app is stateless (it is — all state lives in
  Postgres and on-chain).
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
