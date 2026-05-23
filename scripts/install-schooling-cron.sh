#!/bin/bash
# Install SSU schooling cron: 4 runs/day America/Chicago (one subject per run).
set -euo pipefail

NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
NODE_BIN="${NODE_BIN:-/root/.nvm/versions/node/v24.15.0/bin/node}"
CRON_FILE="/etc/cron.d/nova-schooling"

cat >"$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
CRON_TZ=America/Chicago

# 6 AM — SSU business
0 6 * * * root cd ${NOVA_ROOT} && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a && export NOVA_AUTONOMOUS_SCHOOLING=1 SCHOOLING_SLOT=business && ${NODE_BIN} scripts/autonomous_schooling.cjs >> ${NOVA_ROOT}/nova-data/schooling-cron.log 2>&1

# Noon — SSU business (EQ every 6th business session, handled in script)
0 12 * * * root cd ${NOVA_ROOT} && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a && export NOVA_AUTONOMOUS_SCHOOLING=1 SCHOOLING_SLOT=business && ${NODE_BIN} scripts/autonomous_schooling.cjs >> ${NOVA_ROOT}/nova-data/schooling-cron.log 2>&1

# 3 PM — AEO/SEO (every other day); EQ study on AEO off-days
0 15 * * * root cd ${NOVA_ROOT} && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a && export NOVA_AUTONOMOUS_SCHOOLING=1 SCHOOLING_SLOT=search && ${NODE_BIN} scripts/autonomous_schooling.cjs >> ${NOVA_ROOT}/nova-data/schooling-cron.log 2>&1

# 6 PM — SSU business
0 18 * * * root cd ${NOVA_ROOT} && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a && export NOVA_AUTONOMOUS_SCHOOLING=1 SCHOOLING_SLOT=business && ${NODE_BIN} scripts/autonomous_schooling.cjs >> ${NOVA_ROOT}/nova-data/schooling-cron.log 2>&1
EOF

chmod 644 "$CRON_FILE"
echo "Installed ${CRON_FILE} (6:00 · 12:00 · 15:00 · 18:00 America/Chicago)"
