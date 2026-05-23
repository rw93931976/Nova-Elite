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
ALERT_STATE="${ALERT_STATE:-$LOG_DIR/watchdog-alert-state}"
VOICE_OUT="${VOICE_OUT:-/root/.pm2/logs/nova-voice-out.log}"
VOICE_ERR="${VOICE_ERR:-/root/.pm2/logs/nova-voice-error.log}"
TOKEN_URL="${TOKEN_URL:-http://127.0.0.1:8787/api/token}"
BOOT_GRACE_SEC="${BOOT_GRACE_SEC:-180}"
LOG_TAIL_LINES="${LOG_TAIL_LINES:-800}"
POST_RESTART_QUIET_SEC="${POST_RESTART_QUIET_SEC:-240}"
PUSHOVER_COOLDOWN_SEC="${PUSHOVER_COOLDOWN_SEC:-900}"
PUSHOVER_STATE="${PUSHOVER_STATE:-$LOG_DIR/pushover-cooldown}"
CARTESIA_QUOTA_STATE="${CARTESIA_QUOTA_STATE:-$LOG_DIR/watchdog-cartesia-quota-state}"
CARTESIA_LOG_LINES="${CARTESIA_LOG_LINES:-60}"

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
  local priority=${3:-1}
  local title=${4:-"Nova voice alert"}
  [ -n "${PUSHOVER_TOKEN:-}" ] && [ -n "${PUSHOVER_USER:-}" ] || return 0
  local key
  key=$(printf '%s' "$reason" | md5sum 2>/dev/null | awk '{print $1}')
  key=${key}:$priority
  local now last=0
  now=$(date +%s)
  if [ "$priority" -gt 0 ] && [ -f "$PUSHOVER_STATE" ]; then
    last=$(grep -m1 "^${key}=" "$PUSHOVER_STATE" 2>/dev/null | cut -d= -f2 || echo 0)
    if [ $((now - last)) -lt "$PUSHOVER_COOLDOWN_SEC" ]; then
      return 0
    fi
  fi
  local msg="Nova Elite (droplet): ${reason}"
  [ -n "$action" ] && msg="${msg} Auto-fix: ${action}."
  local curl_args=(
    -sfS -X POST "https://api.pushover.net/1/messages.json"
    --data-urlencode "token=${PUSHOVER_TOKEN}"
    --data-urlencode "user=${PUSHOVER_USER}"
    --data-urlencode "title=${title}"
    --data-urlencode "message=${msg}"
    --data-urlencode "priority=${priority}"
  )
  [ -n "${PUSHOVER_DEVICE:-}" ] && curl_args+=(--data-urlencode "device=${PUSHOVER_DEVICE}")
  if curl "${curl_args[@]}" >/dev/null; then
    if [ "$priority" -gt 0 ]; then
      grep -v "^${key}=" "$PUSHOVER_STATE" 2>/dev/null >"${PUSHOVER_STATE}.tmp" || true
      mv "${PUSHOVER_STATE}.tmp" "$PUSHOVER_STATE" 2>/dev/null || true
      echo "${key}=${now}" >>"$PUSHOVER_STATE"
    fi
    log "pushover sent (${title}): $reason"
  else
    log "pushover failed: $reason"
  fi
}

alert_state_get() {
  [ -f "$ALERT_STATE" ] && cat "$ALERT_STATE" 2>/dev/null || echo "ok"
}

alert_state_set() {
  echo "$1" >"$ALERT_STATE"
}

notify_recovery_if_needed() {
  local prev
  prev=$(alert_state_get)
  [ "$prev" = "alerting" ] || return 0
  load_pushover_env
  pushover_notify "Nova voice is back online (PM2 + token + LiveKit registration OK)." "" 0 "Nova voice recovered"
  alert_state_set "ok"
  log "recovery pushover sent"
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
  pushover_notify "$reason" "$action" 1 "Nova voice offline"
  alert_state_set "alerting"
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

pm2_restart_count() {
  pm2 jlist 2>/dev/null | python3 -c "
import json, sys
try:
    for p in json.load(sys.stdin):
        if p.get('name') == 'nova-voice':
            print((p.get('pm2_env') or {}).get('restart_time') or 0)
            break
except Exception:
    pass
" 2>/dev/null || echo "0"
}

voice_worker_broken_in_logs() {
  for f in "$VOICE_ERR" "$VOICE_OUT"; do
    [ -f "$f" ] || continue
    if tail -n 40 "$f" 2>/dev/null | grep -qE 'ModuleNotFoundError|SyntaxError|IndentationError|ImportError'; then
      if tail -n 40 "$f" 2>/dev/null | grep -qE 'agent\.py|nova-voice|livekit'; then
        return 0
      fi
    fi
  done
  return 1
}

# Exit 0 = registration seen in recent logs; exit 1 = missing.
recent_registration() {
  for f in "$VOICE_OUT" "$VOICE_ERR"; do
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
  bash "$NOVA_ROOT/scripts/nova-prune-orphan-workers.sh" 2>/dev/null || true
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

# Cartesia model-credits exhausted (402) — worker can look healthy while TTS is silent.
cartesia_quota_in_logs() {
  for f in "$VOICE_OUT" "$VOICE_ERR"; do
    [ -f "$f" ] || continue
    if tail -n "$CARTESIA_LOG_LINES" "$f" 2>/dev/null | grep -qE 'quota_exceeded|Model credits limit reached|status_code=402'; then
      if tail -n "$CARTESIA_LOG_LINES" "$f" 2>/dev/null | grep -qE 'cartesia|Cartesia|api\.cartesia\.ai'; then
        return 0
      fi
    fi
  done
  return 1
}

check_cartesia_quota() {
  if cartesia_quota_in_logs; then
    if [ "$(cat "$CARTESIA_QUOTA_STATE" 2>/dev/null)" = "alerting" ]; then
      return 0
    fi
    log "ALERT: Cartesia TTS quota/credits exhausted (402)"
    load_pushover_env
    pushover_notify \
      "Cartesia MODEL credits exhausted (402). Voice may connect but stay silent. Refill Sonic credits in Playground — Voice Agent prepaid does not apply. Or set NOVA_TTS=openai on droplet." \
      "" \
      2 \
      "Nova Cartesia credits"
    echo "alerting" >"$CARTESIA_QUOTA_STATE"
    return 0
  fi
  if [ -f "$CARTESIA_QUOTA_STATE" ] && [ "$(cat "$CARTESIA_QUOTA_STATE" 2>/dev/null)" = "alerting" ]; then
    load_pushover_env
    pushover_notify "Cartesia TTS errors cleared in recent logs (credits may be OK again)." "" 0 "Nova Cartesia recovered"
    echo "ok" >"$CARTESIA_QUOTA_STATE"
    log "Cartesia quota recovery pushover sent"
  fi
  return 1
}

# --- checks ---
actions=0
check_cartesia_quota || true

if in_post_restart_quiet; then
  if pm2_ok && token_ok && recent_registration; then
    notify_recovery_if_needed
  fi
  log "skip alert checks (post-restart quiet ${POST_RESTART_QUIET_SEC}s)"
  exit 0
fi

if voice_worker_broken_in_logs; then
  alert "voice worker import/crash in logs (agent failed to start)" "pm2 restart nova-voice; check nova-voice-error.log"
  restart_voice
  actions=$((actions + 1))
elif ! pm2_ok; then
  alert "nova-voice not online in PM2" "pm2 restart nova-voice"
  restart_voice
  actions=$((actions + 1))
else
  uptime_sec=$(pm2_uptime_sec)
  uptime_sec=${uptime_sec:-0}
  restarts=$(pm2_restart_count)
  restarts=${restarts:-0}
  if [ "$uptime_sec" -lt 90 ] && [ "$restarts" -gt 15 ] && ! in_post_restart_quiet; then
    alert "nova-voice crash loop (${restarts} PM2 restarts, uptime ${uptime_sec}s)" "pm2 restart nova-voice; check error log"
    restart_voice
    actions=$((actions + 1))
  fi
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
  if pm2_ok && token_ok && recent_registration; then
    notify_recovery_if_needed
  fi
else
  log "remediated ${actions} issue(s)"
fi
