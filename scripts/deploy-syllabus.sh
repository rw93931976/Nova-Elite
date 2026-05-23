#!/usr/bin/env bash
# Sync syllabus + schooling scripts to droplet and push active rotation to DO Spaces.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${NOVA_SSH_HOST:-nova-cursor}"
NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
PY="${NOVA_PYTHON:-${NOVA_ROOT}/.venv/bin/python3}"

cd "$ROOT"

echo "=== Syllabus files ==="
ssh "$HOST" "mkdir -p ${NOVA_ROOT}/nova-data/library"
scp "$ROOT/nova-data/library/SSU_Business_Courses.md" "${HOST}:${NOVA_ROOT}/nova-data/library/"
scp "$ROOT/complete_syllabus.md" "${HOST}:${NOVA_ROOT}/"
scp "$ROOT/scripts/autonomous_schooling.cjs" "${HOST}:${NOVA_ROOT}/scripts/"
scp "$ROOT/scripts/spaces_schooling.py" "${HOST}:${NOVA_ROOT}/scripts/"

echo "=== Push active rotation to DO Spaces ==="
ssh "$HOST" "cd ${NOVA_ROOT} && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a && ${PY} scripts/spaces_schooling.py push nova-data/library/SSU_Business_Courses.md SSU_Business_Courses.md"

echo "=== Verify subject count ==="
ssh "$HOST" "cd ${NOVA_ROOT} && set -a && source .env 2>/dev/null; source .env.local 2>/dev/null; set +a && ${PY} scripts/spaces_schooling.py subjects business | wc -l"

echo "Done. Next business schooling run uses the updated rotation."
