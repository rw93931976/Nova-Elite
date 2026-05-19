#!/usr/bin/env bash
# Phase A: health watchdog (1 min), logrotate, faster PM2 restart delay.
set -eu

NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
export PATH="/root/.nvm/versions/node/v24.15.0/bin:$PATH"

chmod +x "$NOVA_ROOT/scripts/nova-health-watchdog.sh"
chmod +x "$NOVA_ROOT/scripts/nova-prune-orphan-workers.sh" 2>/dev/null || true
mkdir -p "$NOVA_ROOT/logs"

# --- cron: health every 1 minute ---
cat >/etc/cron.d/nova-health-watchdog <<EOF
# Nova Elite — voice/token health (every minute)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin:/root/.nvm/versions/node/v24.15.0/bin
* * * * * root $NOVA_ROOT/scripts/nova-health-watchdog.sh
EOF
chmod 644 /etc/cron.d/nova-health-watchdog
echo "Installed /etc/cron.d/nova-health-watchdog (every 1 min)"

# --- logrotate ---
cat >/etc/logrotate.d/nova-elite <<'EOF'
/root/.pm2/logs/nova-voice-*.log
/root/nova/logs/*.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    size 50M
}
EOF
chmod 644 /etc/logrotate.d/nova-elite
echo "Installed /etc/logrotate.d/nova-elite"

# --- faster PM2 restart delay (seconds, not minutes) ---
if pm2 describe nova-voice >/dev/null 2>&1; then
  pm2 restart nova-voice --restart-delay 2000 --kill-timeout 15000 --update-env 2>/dev/null || true
  pm2 save
  echo "PM2 nova-voice: restart-delay 2s"
fi

# --- token: always restart ---
if [ -f /etc/systemd/system/nova-token.service ]; then
  grep -q 'Restart=always' /etc/systemd/system/nova-token.service || \
    sed -i 's/Restart=on-failure/Restart=always/' /etc/systemd/system/nova-token.service
  systemctl daemon-reload
  systemctl enable nova-token.service 2>/dev/null || true
  systemctl restart nova-token.service
fi

# Run watchdog once now
bash "$NOVA_ROOT/scripts/nova-health-watchdog.sh"
echo "---"
echo "Phase A installed. Incident file: $NOVA_ROOT/logs/LAST_INCIDENT.txt"
echo "Alert history: $NOVA_ROOT/logs/health-alerts.log"
pm2 list 2>/dev/null || true
