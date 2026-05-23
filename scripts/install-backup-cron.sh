#!/usr/bin/env bash
# Droplet backups: noon + 10 PM America/Chicago.
set -euo pipefail

BACKUP_SCRIPT="${NOVA_ROOT:-/root/nova}/scripts/nova-droplet-backup.sh"
CRON_FILE="/etc/cron.d/nova-droplet-backup"

cat >"$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
CRON_TZ=America/Chicago

0 12 * * * root ${BACKUP_SCRIPT} >> /root/backups/backup-cron.log 2>&1
0 22 * * * root ${BACKUP_SCRIPT} >> /root/backups/backup-cron.log 2>&1
EOF

chmod 644 "$CRON_FILE"
# Remove legacy UTC entries from root crontab if present.
( crontab -l 2>/dev/null | grep -v 'nova-droplet-backup.sh' || true ) | crontab - 2>/dev/null || true
echo "Installed ${CRON_FILE} (12:00 + 22:00 America/Chicago)"
