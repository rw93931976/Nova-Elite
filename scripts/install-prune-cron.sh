#!/usr/bin/env bash
# Install weekly cron for nova-prune-orphan-workers.sh (root).
set -eu

SCRIPT="/root/nova/scripts/nova-prune-orphan-workers.sh"
CRON_LINE="0 4 * * 0 root $SCRIPT >> /root/nova/logs/prune-orphans.log 2>&1"
CRON_FILE="/etc/cron.d/nova-prune-orphans"

chmod +x "$SCRIPT"
mkdir -p /root/nova/logs

cat > "$CRON_FILE" <<EOF
# Nova Elite — prune stale LiveKit multiprocessing children (weekly, Sunday 04:00 UTC)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
$CRON_LINE
EOF

chmod 644 "$CRON_FILE"
echo "Installed $CRON_FILE"
cat "$CRON_FILE"
