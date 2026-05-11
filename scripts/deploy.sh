#!/usr/bin/env bash
set -euo pipefail

LOCK=/tmp/exira-web-v2.deploy.lock
APP_DIR=/home/ubuntu/exira-web-v2
LOG=/tmp/exira-web-v2-deploy.log

# Single-instance
exec 9>"$LOCK"
flock -n 9 || { echo "another deploy in progress"; exit 1; }

{
  echo "=== $(date -u +%FT%TZ) deploy start ==="
  cd "$APP_DIR"

  echo "--> git fetch"
  git fetch --prune origin

  echo "--> git reset --hard origin/main"
  git reset --hard origin/main

  echo "--> npm ci (legacy-peer-deps)"
  npm ci --legacy-peer-deps

  echo "--> next build"
  NODE_ENV=production npm run build

  echo "--> pm2 restart"
  pm2 restart exira-web-v2 --update-env
  pm2 save

  echo "--> smoke-test localhost:3100"
  curl -sS -o /dev/null -w "localhost HTTP %{http_code} time=%{time_total}s\n" --max-time 30 http://localhost:3100/ || true

  echo "=== $(date -u +%FT%TZ) deploy ok ==="
} 2>&1 | tee -a "$LOG"
