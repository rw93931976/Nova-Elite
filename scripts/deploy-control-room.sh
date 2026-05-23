#!/usr/bin/env bash
# Build Control Room PWA and deploy to droplet. Fixes assets/ perms (scp can leave 700 → blank page).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${NOVA_SSH_HOST:-nova-cursor}"
WEB_ROOT="${NOVA_WEB_ROOT:-/var/www/nova}"

cd "$ROOT"
npm run build

scp -r dist/* "${HOST}:${WEB_ROOT}/"
ssh "$HOST" "chmod 755 ${WEB_ROOT}/assets 2>/dev/null || true; chmod -R a+rX ${WEB_ROOT}/assets 2>/dev/null || true"
# Strip CRLF from shell scripts after any Windows scp (prevents PM2 silent voice failure).
ssh "$HOST" 'sed -i "s/\r$//" /root/nova/scripts/*.sh /root/nova/pm2-droplet-bootstrap.sh 2>/dev/null || true'

echo "Deployed to ${HOST}:${WEB_ROOT}"
