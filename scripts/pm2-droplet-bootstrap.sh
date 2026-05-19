#!/usr/bin/env bash
# One-time / repeat safe: PM2 autorestart for Nova voice on the droplet.
set -eu

NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
ECOSYSTEM="${ECOSYSTEM:-$NOVA_ROOT/ecosystem.droplet.cjs}"
NVM_DIR="${NVM_DIR:-/root/.nvm}"

export NVM_DIR
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

PM2="$(command -v pm2 || true)"
if [ -z "$PM2" ] && [ -x /root/.nvm/versions/node/v24.15.0/bin/pm2 ]; then
  PM2=/root/.nvm/versions/node/v24.15.0/bin/pm2
  export PATH="/root/.nvm/versions/node/v24.15.0/bin:$PATH"
fi
if [ -z "$PM2" ]; then
  echo "ERROR: pm2 not found (install via nvm/npm on droplet)"
  exit 1
fi

echo "=== Stopping manual / duplicate voice workers ==="
pkill -f "src/agent.py" 2>/dev/null || true
sleep 2

echo "=== PM2: nova-voice (agent.py start) ==="
cd "$NOVA_ROOT"
if [ ! -f "$ECOSYSTEM" ]; then
  echo "ERROR: missing $ECOSYSTEM"
  exit 1
fi
$PM2 delete nova-voice 2>/dev/null || true
$PM2 delete ecosystem.droplet 2>/dev/null || true
chmod +x "$NOVA_ROOT/scripts/start-nova-voice.sh"
cd "$NOVA_ROOT"
$PM2 start scripts/start-nova-voice.sh \
  --name nova-voice \
  --cwd "$NOVA_ROOT" \
  --interpreter bash \
  --max-restarts 50 \
  --restart-delay 2000 \
  --kill-timeout 15000 \
  --max-memory-restart 800M
$PM2 save

echo "=== PM2 startup on boot (run the command below if printed) ==="
$PM2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== Status ==="
$PM2 list
$PM2 logs nova-voice --lines 15 --nostream 2>/dev/null || true

echo "=== nova-token (systemd — ensure always restart) ==="
if systemctl is-enabled nova-token.service &>/dev/null; then
  systemctl enable nova-token.service
  systemctl restart nova-token.service || true
  systemctl is-active nova-token.service || true
fi

echo "Done. Voice: pm2 logs nova-voice"
