#!/usr/bin/env bash
# Kill orphaned LiveKit agent multiprocessing children (keep current worker tree).
# Safe to run while nova-voice is online under PM2. Schedule: weekly cron on droplet.
set -eu

LOG_DIR="${LOG_DIR:-/root/nova/logs}"
LOG_FILE="${LOG_FILE:-$LOG_DIR/prune-orphans.log}"
mkdir -p "$LOG_DIR"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

# Resolve keeper root PIDs: PM2 nova-voice tree (bash wrapper + python worker + descendants).
keeper_pids() {
  local pids=""
  if [ -x /root/.nvm/versions/node/v24.15.0/bin/pm2 ]; then
    export PATH="/root/.nvm/versions/node/v24.15.0/bin:$PATH"
    local pm2_pid
    pm2_pid=$(pm2 pid nova-voice 2>/dev/null || true)
    if [ -n "$pm2_pid" ] && [ "$pm2_pid" -gt 0 ] 2>/dev/null; then
      pids="$pm2_pid"
    fi
  fi
  for pid in $(pgrep -f "start-nova-voice.sh" 2>/dev/null || true); do
    pids="$pids $pid"
  done
  for pid in $(pgrep -f "src/agent.py (start|dev)" 2>/dev/null || true); do
    pids="$pids $pid"
  done
  echo "$pids" | tr ' ' '\n' | sort -u | grep -E '^[0-9]+$' || true
}

is_descendant_of() {
  local pid=$1
  local root=$2
  local p=$pid
  while [ -n "$p" ] && [ "$p" -gt 1 ]; do
    if [ "$p" = "$root" ]; then
      return 0
    fi
    p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
  done
  return 1
}

is_kept() {
  local pid=$1
  shift
  local root
  for root in "$@"; do
    [ -z "$root" ] && continue
    if [ "$pid" = "$root" ] || is_descendant_of "$pid" "$root"; then
      return 0
    fi
  done
  return 1
}

mapfile -t KEEPERS < <(keeper_pids)
if [ "${#KEEPERS[@]}" -eq 0 ]; then
  log "No active nova-voice worker found; skipping prune."
  exit 0
fi

log "Keeper PIDs: ${KEEPERS[*]}"

killed=0
orphan_pattern='multiprocessing\.(spawn_main|forkserver|resource_tracker)|from multiprocessing\.(spawn|forkserver|resource_tracker)'

prune_pass() {
  local sig=$1
  for pid in $(pgrep -f "$orphan_pattern" 2>/dev/null || true); do
  if is_kept "$pid" "${KEEPERS[@]}"; then
      continue
    fi
    kill "-$sig" "$pid" 2>/dev/null || true
    killed=$((killed + 1))
  done
}

prune_pass TERM
sleep 2
prune_pass KILL

log "Pruned ~$killed orphaned multiprocessing PIDs. Keepers: ${KEEPERS[*]}."
free -h 2>/dev/null | head -2 | tee -a "$LOG_FILE" || true
