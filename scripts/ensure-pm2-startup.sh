#!/usr/bin/env bash
# Persist PM2 process list and enable boot-time restart for nova-voice.
set -euo pipefail

export PATH="/root/.nvm/versions/node/v24.15.0/bin:${PATH}"

PM2="${PM2_BIN:-pm2}"

if ! command -v "$PM2" >/dev/null 2>&1; then
  echo "pm2 not found in PATH" >&2
  exit 1
fi

echo "Saving PM2 process list..."
"$PM2" save

if systemctl is-enabled pm2-root >/dev/null 2>&1; then
  echo "pm2-root systemd unit already enabled."
  exit 0
fi

echo "Installing PM2 startup (systemd)..."
STARTUP=$("$PM2" startup systemd -u root --hp /root 2>&1 | grep -E '^sudo ' || true)
if [[ -n "$STARTUP" ]]; then
  eval "${STARTUP#sudo }"
fi

"$PM2" save
echo "PM2 startup configured. nova-voice should return after reboot."
