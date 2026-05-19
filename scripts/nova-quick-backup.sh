#!/usr/bin/env bash
# Quick snapshot: voice runtime, persona, scripts, env (droplet or local NOVA_ROOT).
set -eu
NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
TS="${TS:-$(date -u +%Y%m%dT%H%M%SZ)}"
OUT_DIR="${NOVA_ROOT}/backups"
ARCHIVE="${OUT_DIR}/nova-voice-${TS}.tar.gz"
mkdir -p "$OUT_DIR"
cd "$NOVA_ROOT"
tar -czf "$ARCHIVE" \
  --ignore-failed-read \
  src/agent.py \
  src/memory.py \
  persona/ \
  nova-data/library/live/ \
  scripts/start-nova-voice.sh \
  scripts/pm2-droplet-bootstrap.sh \
  scripts/nova-health-watchdog.sh \
  scripts/install-phase-a-reliability.sh \
  scripts/nova-prune-orphan-workers.sh \
  scripts/sync-persona-voice.sh \
  ecosystem.droplet.cjs \
  .env.local \
  logs/voice-phrasing-state.json \
  logs/health-watchdog.log \
  logs/health-alerts.log \
  logs/LAST_INCIDENT.txt \
  2>/dev/null || true
echo "BACKUP_ARCHIVE=$ARCHIVE"
ls -lh "$ARCHIVE"
md5sum "$ARCHIVE"
