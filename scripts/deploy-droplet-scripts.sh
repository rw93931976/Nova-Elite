#!/usr/bin/env bash
# Sync voice runtime + shell scripts to nova-cursor. Strips CRLF after Windows scp.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${NOVA_SSH_HOST:-nova-cursor}"
NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
RESTART="${DEPLOY_RESTART:-0}"

cd "$ROOT"

echo "=== Agent + Python runtime ==="
scp "$ROOT/agent-droplet.py" "${HOST}:${NOVA_ROOT}/src/agent.py"
scp "$ROOT/agent-droplet.py" "${HOST}:${NOVA_ROOT}/agent-droplet.py"
for py in memory.py archive_query.py archive_upload.py; do
  if [ -f "$ROOT/$py" ]; then
    scp "$ROOT/$py" "${HOST}:${NOVA_ROOT}/src/$py"
  elif [ -f "$ROOT/src/$py" ]; then
    scp "$ROOT/src/$py" "${HOST}:${NOVA_ROOT}/src/$py"
  fi
done

echo "=== Shell scripts ==="
scp "$ROOT"/scripts/*.sh "${HOST}:${NOVA_ROOT}/scripts/"
scp "$ROOT/scripts/pm2-droplet-bootstrap.sh" "${HOST}:${NOVA_ROOT}/pm2-droplet-bootstrap.sh"

echo "=== CRLF guard ==="
ssh "$HOST" "sed -i 's/\r$//' ${NOVA_ROOT}/scripts/*.sh ${NOVA_ROOT}/pm2-droplet-bootstrap.sh 2>/dev/null || true"

if [ "$RESTART" = "1" ] || [ "${1:-}" = "--restart" ]; then
  echo "=== PM2 restart nova-voice ==="
  ssh "$HOST" 'export PATH="/root/.nvm/versions/node/v24.15.0/bin:$PATH"; pm2 restart nova-voice --update-env'
fi

echo "Deployed runtime to ${HOST}:${NOVA_ROOT}"
