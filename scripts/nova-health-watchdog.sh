#!/usr/bin/env bash
# Fast health check: PM2 voice worker, LiveKit registration, token service.
# Cron: every 1 minute. Remediates in seconds via pm2/systemctl restart.
set -eu

export PATH="/root/.nvm/versions/node/v24.15.0/bin:/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin"

NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
LOG_DIR="${LOG_DIR:-$NOVA_ROOT/logs}"
WATCHDOG_LOG="${WATCHDOG_LOG:-$LOG_DIR/health-watchdog.log}"
ALERT_LOG="${ALERT_LOG:-$LOG_DIR/health-alerts.log}"
INCIDENT_FILE="${INCIDENT_FILE:-$LOG_DIR/LAST_INCIDENT.txt}"
VOICE_OUT="${VOICE_OUT:-/root/.pm2/logs/nova-voice-out.log}"
VOICE_ERR="${VOICE_ERR:-/root/.pm2/logs/nova-voice-error.log}"
TOKEN_URL="${TOKEN_URL:-http://127.0.0.1:8787/api/token}"
BOOT_GRACE_SEC="${BOOT_GRACE_SEC:-180}"
LOG_TAIL_LINES="${LOG_TAIL_LINES:-800}"
POST_RESTART_QUIET_SEC="${POST_RESTART_QUIET_SEC:-240}"
PUSHOVER_COOLDOWN_SEC="${PUSHOVER_COOLDOWN_SEC:-900}"
PUSHOVER_STATE="${PUSHOVER_STATE:-$LOG_DIR/pushover-cooldown}"

mkdir -p "$LOG_DIR"

load_pushover_env() {
  local env_file="${NOVA_ENV:-$NOVA_ROOT/.env.local}"
  [ -f "$env_file" ] || return 0
  while IFS= read -r line; do
    line="${line%%#*}"
    line="${line//$'\r'/}"
    case "$line" in
      PUSHOVER_TOKEN=*|PUSHOVER_USER=*|PUSHOVER_DEVICE=*)
        export "$line"
        ;;
    esac
  done <"$env_file"
}

pushover_notify() {
  local reason=$1
  local action=$2
  [ -n "${PUSHOVER_TOKEN:-}" ] && [ -n "${PUSHOVER_USER:-}" ] || return 0
  local key
  key=$(printf '%s' "$reason" | md5sum 2>/dev/null | awk '{print $1}')
  key=${key:-$reason}
  local now last=0
  now=$(date +%s)
  if [ -f "$PUSHOVER_STATE" ]; then
    last=$(grep -m1 "^${key}=" "$PUSHOVER_STATE" 2>/dev/null | cut -d= -f2 || echo 0)
  fi
  if [ $((now - last)) -lt "$PUSHOVER_COOLDOWN_SEC" ]; then
    return 0
  fi
  local msg="Nova Elite (droplet): ${reason}. Auto-fix: ${action}."
  local curl_args=(
    -sfS -X POST "https://api.pushover.net/1/messages.json"
    --data-urlencode "token=${PUSHOVER_TOKEN}"
    --data-urlencode "user=${PUSHOVER_USER}"
    --data-urlencode "title=Nova voice alert"
    --data-urlencode "message=${msg}"
    --data-urlencode "priority=1"
  )
  [ -n "${PUSHOVER_DEVICE:-}" ] && curl_args+=(--data-urlencode "device=${PUSHOVER_DEVICE}")
  if curl "${curl_args[@]}" >/dev/null; then
    grep -v "^${key}=" "$PUSHOVER_STATE" 2>/dev/null >"${PUSHOVER_STATE}.tmp" || true
    mv "${PUSHOVER_STATE}.tmp" "$PUSHOVER_STATE" 2>/dev/null || true
    echo "${key}=${now}" >>"$PUSHOVER_STATE"
    log "pushover sent: $reason"
  else
    log "pushover failed: $reason"
  fi
}

log() {
  echo "[$(date -Iseconds)] $*" >>"$WATCHDOG_LOG"
}

alert() {
  local reason=$1
  local action=$2
  log "ALERT: $reason | action: $action"
  {
    echo "time=$(date -Iseconds)"
    echo "reason=$reason"
    echo "action=$action"
  } >"$INCIDENT_FILE"
  echo "[$(date -Iseconds)] $reason | $action" >>"$ALERT_LOG"
  load_pushover_env
  pushover_notify "$reason" "$action"
}

pm2_ok() {
  command -v pm2 >/dev/null 2>&1 || return 1
  pm2 jlist 2>/dev/null | python3 -c "
import json, sys
try:
    for p in json.load(sys.stdin):
        if p.get('name') == 'nova-voice':
            sys.exit(0 if (p.get('pm2_env') or {}).get('status') == 'online' else 1)
except Exception:
    pass
sys.exit(1)
" 2>/dev/null
}

pm2_uptime_sec() {
  pm2 jlist 2>/dev/null | python3 -c "
import json, sys, time
try:
    data = json.load(sys.stdin)
    for p in data:
        if p.get('name') != 'nova-voice':
            continue
        started = (p.get('pm2_env') or {}).get('pm_uptime') or 0
        if started:
            print(max(0, int((time.time() * 1000 - started) // 1000)))
        break
except Exception:
    pass
" 2>/dev/null || echo "0"
}

# Exit 0 = registration seen in recent logs; exit 1 = missing.
recent_registration() {
  for f in "$VOICE_OUT" "$VOICE_ERR" "$NOVA_ROOT/logs/agent-worker.log"; do
    [ -f "$f" ] || continue
    if tail -n "$LOG_TAIL_LINES" "$f" 2>/dev/null | grep -q 'registered worker'; then
      return 0
    fi
  done
  return 1
}

token_ok() {
  systemctl is-active --quiet nova-token.service 2>/dev/null || return 1
  # Port listening without minting a token every minute
  ss -tln 2>/dev/null | grep -q ':8787 ' || return 1
  return 0
}

restart_voice() {
  date +%s >"$LOG_DIR/watchdog-last-voice-restart"
  pm2 restart nova-voice --update-env 2>/dev/null || pm2 start "$NOVA_ROOT/scripts/start-nova-voice.sh" \
    --name nova-voice --cwd "$NOVA_ROOT" --interpreter bash
  pm2 save 2>/dev/null || true
}

in_post_restart_quiet() {
  local stamp now age
  [ -f "$LOG_DIR/watchdog-last-voice-restart" ] || return 1
  stamp=$(cat "$LOG_DIR/watchdog-last-voice-restart" 2>/dev/null || echo 0)
  now=$(date +%s)
  age=$((now - stamp))
  [ "$age" -lt "$POST_RESTART_QUIET_SEC" ]
}

fix_token() {
  systemctl restart nova-token.service 2>/dev/null || true
}

# --- checks ---
actions=0

if ! pm2_ok; then
  alert "nova-voice not online in PM2" "pm2 restart nova-voice"
  restart_voice
  actions=$((actions + 1))
else
  uptime_sec=$(pm2_uptime_sec)
  uptime_sec=${uptime_sec:-0}
  reg_ok=0
  recent_registration && reg_ok=1
  if [ "$uptime_sec" -gt "$BOOT_GRACE_SEC" ] && [ "$reg_ok" -eq 0 ] && ! in_post_restart_quiet; then
    alert "no registered worker in last ${LOG_TAIL_LINES} log lines (uptime ${uptime_sec}s)" "pm2 restart nova-voice"
    restart_voice
    actions=$((actions + 1))
  fi
fi

if ! token_ok; then
  alert "nova-token down or port 8787 not listening" "systemctl restart nova-token"
  fix_token
  actions=$((actions + 1))
fi

if [ "$actions" -eq 0 ]; then
  reg_note=missing
  recent_registration && reg_note=seen
  log "ok pm2=online token=up registration=${reg_note}"
else
  log "remediated ${actions} issue(s)"
fi
