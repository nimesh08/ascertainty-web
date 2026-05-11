# `deploy/` — reference infra templates

These files document the production setup on the reference EC2 box
(`13.201.222.240`). They are templates: replace the placeholder values
(`<DOMAIN_OR_IP>`, `<ADMIN_EMAIL>`, paths) before using.

## Files

| File                    | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `Caddyfile.example`     | Reverse proxy + TLS                                 |
| `ecosystem.config.js`   | pm2 process supervision (recommended)               |
| `exira-web-v2.service`  | systemd unit (alternative to pm2)                   |

## pm2 vs systemd

**Use pm2** (recommended) — it's what the reference box runs. pm2 gives
you log tailing (`pm2 logs`), process listings (`pm2 status`), easy
restart (`pm2 restart exira-web-v2`), and cluster-mode scaling
(`instances: "max"`). It also starts on boot via `pm2 startup && pm2
save`.

**Use systemd** if you already have a systemd-managed fleet and prefer
to stay uniform, or if you don't want pm2's extra dependency. The unit
file does the same thing: `npm run start -- --port 3100`, restart on
failure.

Do not run both at once. They'll fight over port 3100.

## Installing

### Caddy

```bash
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
sudo $EDITOR /etc/caddy/Caddyfile   # replace <DOMAIN_OR_IP> and <ADMIN_EMAIL>
sudo systemctl reload caddy
```

### pm2

```bash
cp deploy/ecosystem.config.js .
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### systemd (alternative)

```bash
sudo cp deploy/exira-web-v2.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now exira-web-v2
sudo systemctl status exira-web-v2
```

## Firewall

Only these ports should be open publicly:

- **443** — HTTPS (Caddy)
- **80** — optional, for HTTP→HTTPS redirect
- **22** — SSH (source-restricted to your IP)

Port **3100** must stay private. Caddy talks to it over `127.0.0.1`.
