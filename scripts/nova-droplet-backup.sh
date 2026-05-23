#!/usr/bin/env bash
# Nova droplet backup — read-only archive, manifest, checksum, 7-day rotation.
# Safe to run while the voice worker is live (no restarts).

set -euo pipefail

BACKUP_ROOT="/root/backups"
RETENTION_DAYS=7
HOSTNAME_SHORT="$(hostname -s 2>/dev/null || echo nova-cursor)"
TZ_LABEL="$(date +%Z 2>/dev/null || true)"
DATE="$(date +%Y-%m-%d)"
TIME_LABEL="$(date +%H%M)"
BASENAME="nova-droplet-${DATE}-${TIME_LABEL}"
ARCHIVE="${BACKUP_ROOT}/${BASENAME}.tar.gz"
MANIFEST="${BACKUP_ROOT}/${BASENAME}.manifest.txt"
CHECKSUM="${BACKUP_ROOT}/${BASENAME}.sha256"
INDEX="${BACKUP_ROOT}/INDEX.txt"
LOG="${BACKUP_ROOT}/backup.log"

mkdir -p "${BACKUP_ROOT}"

log() { echo "[$(date -Iseconds)] $*" | tee -a "${LOG}"; }

# Optional paths — omit if missing so tar does not abort the whole backup.
backup_paths() {
  echo root/nova
  echo root/nova-token-server.py
  [ -d /var/www/nova ] && echo var/www/nova
  [ -f /etc/nginx/sites-available/nova ] && echo etc/nginx/sites-available/nova
  [ -f /etc/systemd/system/nova-token.service ] && echo etc/systemd/system/nova-token.service
}

log "START backup ${BASENAME} (${TZ_LABEL})"

mapfile -t TAR_PATHS < <(backup_paths)

tar -czf "${ARCHIVE}" \
  --exclude=".venv" \
  --exclude="__pycache__" \
  --exclude="*.pyc" \
  --exclude="agent_starter_python.egg-info" \
  -C / \
  "${TAR_PATHS[@]}" \
  2>>"${LOG}"

BYTES="$(stat -c%s "${ARCHIVE}")"
sha256sum "${ARCHIVE}" > "${CHECKSUM}"
SUM="$(awk '{print $1}' "${CHECKSUM}")"

{
  echo "Nova droplet backup manifest"
  echo "=========================="
  echo "created_utc:    $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "created_local:  $(date -Iseconds)"
  echo "hostname:       ${HOSTNAME_SHORT}"
  echo "archive:        ${ARCHIVE}"
  echo "basename:       ${BASENAME}"
  echo "size_bytes:     ${BYTES}"
  echo "sha256:         ${SUM}"
  echo ""
  echo "Included paths (tar root /):"
  printf '  %s\n' "${TAR_PATHS[@]}"
  echo "  (root/nova excludes .venv)"
  echo ""
  echo "Restore (on a clean host, reference only):"
  echo "  tar -xzf ${BASENAME}.tar.gz -C /"
  echo "  cd /root/nova && uv sync"
  echo "  systemctl enable --now nova-token"
  echo ""
  echo "Off-server copy:"
  echo "  scp root@${HOSTNAME_SHORT}:${ARCHIVE} ."
  echo "  scp root@${HOSTNAME_SHORT}:${MANIFEST} ."
  echo "  scp root@${HOSTNAME_SHORT}:${CHECKSUM} ."
  echo ""
  echo "Archive contents:"
  mapfile -t _ARCHIVE_LIST < <(tar -tzf "${ARCHIVE}" 2>/dev/null || true)
  COUNT="${#_ARCHIVE_LIST[@]}"
  for _line in "${_ARCHIVE_LIST[@]:0:200}"; do
    echo "${_line}"
  done
  if [ "${COUNT}" -gt 200 ]; then
    echo "... (${COUNT} paths total, listing truncated)"
  fi
} > "${MANIFEST}"

DELETED=0
# set -e + empty find: while read -d '' exits 1 at EOF and aborts before DONE/INDEX.
while IFS= read -r -d '' f || [ -n "${f:-}" ]; do
  [ -z "${f:-}" ] && continue
  rm -f "$f"
  DELETED=$((DELETED + 1))
done < <(find "${BACKUP_ROOT}" -maxdepth 1 -type f \
  \( -name 'nova-droplet-*.tar.gz' -o -name 'nova-droplet-*.manifest.txt' -o -name 'nova-droplet-*.sha256' \) \
  -mtime +"${RETENTION_DAYS}" -print0 2>/dev/null || true)

{
  echo "# Nova droplet backups — ${BACKUP_ROOT}"
  echo "# updated: $(date -Iseconds)"
  echo "# retention_days: ${RETENTION_DAYS}"
  echo "# schedule: 12:00 and 22:00 server local time"
  echo ""
  ls -1t "${BACKUP_ROOT}"/nova-droplet-*.tar.gz 2>/dev/null | while read -r arc; do
    base="${arc%.tar.gz}"
    base="${base##*/}"
    sumf="${BACKUP_ROOT}/${base}.sha256"
    sz="$(stat -c%s "${arc}" 2>/dev/null || echo 0)"
    hash="$(awk '{print $1}' "${sumf}" 2>/dev/null || echo missing)"
    echo "${base}|${sz}|${hash}|${arc}"
  done
} > "${INDEX}"

log "DONE ${BASENAME} size=${BYTES} sha256=${SUM:0:16}... pruned_old=${DELETED}"

# Offsite copy to DO Spaces (set NOVA_BACKUP_OFFSITE=0 to disable).
if [[ "${NOVA_BACKUP_OFFSITE:-1}" == "1" ]]; then
  PY="${NOVA_PYTHON:-/root/nova/.venv/bin/python3}"
  PUSH="${BACKUP_ROOT%/backups}/nova/scripts/push_backup_to_spaces.py"
  if [[ ! -f "$PUSH" ]]; then
    PUSH="/root/nova/scripts/push_backup_to_spaces.py"
  fi
  if [[ -x "$PY" && -f "$PUSH" ]]; then
    if ( cd /root/nova && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a
         "$PY" "$PUSH" "$ARCHIVE" "$MANIFEST" "$CHECKSUM" ); then
      log "OFFSITE ${BASENAME} pushed to DO Spaces"
    else
      log "WARN offsite push failed for ${BASENAME} (local backup still OK)"
    fi
  else
    log "WARN offsite push skipped (python or push_backup_to_spaces.py missing)"
  fi
fi
