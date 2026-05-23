#!/usr/bin/env python3
"""
Nova health monitor — separate from the live voice worker.
Cloud providers (LiveKit, OpenAI, Deepgram, Cartesia) + DigitalOcean droplet path
(worker, browser session, host health). Pushover alerts on status change only.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import httpx
import jwt

ROOT = Path("/root/nova")
ENV_LOCAL = ROOT / ".env.local"
ENV_PUSHOVER = ROOT / ".env.pushover"
STATE_FILE = Path("/root/backups/provider-monitor-state.json")
LOG_FILE = Path("/root/backups/provider-monitor.log")
PM2_BIN = os.environ.get("PM2_BIN", "/root/.nvm/versions/node/v24.15.0/bin/pm2")

CHECK_TIMEOUT = 20.0
PUBLIC_HOST = os.environ.get("NOVA_PUBLIC_HOST", "nova.mysimpleaihelp.com")

# Deepgram: suppress Pushover on single blips (503 ~minutes). Worker/token alerts stay on 1-min watchdog.
DEEPGRAM_ALERT_MIN_FAILURES = 2
DEEPGRAM_ALERT_WINDOW_SEC = 900  # 15 min; at 5-min cron ≈ 10 min sustained fail
VOICE_RESTART_SPIKE_HOUR = 5  # Pushover if this many PM2 restarts within 1 hour
VOICE_RESTART_SPIKE_STEP = 3  # Pushover if +3 restarts since last monitor run

# Cloud APIs
CLOUD_PROVIDERS = ("livekit", "openai", "deepgram", "cartesia")
# Droplet / DigitalOcean worker stack (alert on change like providers)
DROPLET_CHECKS = ("nova_worker", "browser_path", "droplet_health")
MONITORED = CLOUD_PROVIDERS + DROPLET_CHECKS


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str
    code: str  # pass | auth | billing | rate_limit | network | config


def log(msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%dT%H:%M:%S%z')}] {msg}"
    print(line)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def classify_http(status: int, body: str) -> tuple[bool, str, str]:
    bl = body.lower()
    if status == 200:
        return True, "ok", "pass"
    if status in (401, 403):
        if any(x in bl for x in ("billing", "quota", "credit", "payment", "insufficient")):
            return False, f"HTTP {status} billing/auth", "billing"
        return False, f"HTTP {status} auth", "auth"
    if status == 429:
        return False, f"HTTP {status} rate limited", "rate_limit"
    if status >= 500:
        return False, f"HTTP {status} provider error", "network"
    return False, f"HTTP {status}", "network"


def check_openai(api_key: str | None) -> CheckResult:
    if not api_key:
        return CheckResult("openai", False, "OPENAI_API_KEY missing", "config")
    try:
        r = httpx.get(
            "https://api.openai.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=CHECK_TIMEOUT,
        )
        ok, detail, code = classify_http(r.status_code, r.text)
        return CheckResult("openai", ok, detail, code)
    except Exception as e:
        return CheckResult("openai", False, str(e)[:120], "network")


def check_deepgram(api_key: str | None) -> CheckResult:
    if not api_key:
        return CheckResult("deepgram", False, "DEEPGRAM_API_KEY missing", "config")
    try:
        r = httpx.get(
            "https://api.deepgram.com/v1/projects",
            headers={"Authorization": f"Token {api_key}"},
            timeout=CHECK_TIMEOUT,
        )
        ok, detail, code = classify_http(r.status_code, r.text)
        return CheckResult("deepgram", ok, detail, code)
    except Exception as e:
        return CheckResult("deepgram", False, str(e)[:120], "network")


def check_cartesia(api_key: str | None) -> CheckResult:
    if not api_key:
        return CheckResult("cartesia", False, "CARTESIA_API_KEY missing", "config")
    try:
        r = httpx.get(
            "https://api.cartesia.ai/voices",
            headers={
                "X-API-Key": api_key,
                "Cartesia-Version": "2024-06-10",
            },
            params={"limit": 1},
            timeout=CHECK_TIMEOUT,
        )
        ok, detail, code = classify_http(r.status_code, r.text)
        return CheckResult("cartesia", ok, detail, code)
    except Exception as e:
        return CheckResult("cartesia", False, str(e)[:120], "network")


def livekit_http_base(url: str) -> str:
    u = urlparse(url)
    host = u.netloc or u.path
    return f"https://{host}"


def check_livekit(url: str | None, api_key: str | None, api_secret: str | None) -> CheckResult:
    if not url or not api_key or not api_secret:
        return CheckResult("livekit", False, "LIVEKIT_URL/KEY/SECRET missing", "config")
    try:
        base = livekit_http_base(url)
        now = int(time.time())
        token = jwt.encode(
            {
                "iss": api_key,
                "exp": now + 60,
                "nbf": now - 5,
                "video": {"roomList": True, "roomCreate": True},
            },
            api_secret,
            algorithm="HS256",
        )
        r = httpx.post(
            f"{base}/twirp/livekit.RoomService/ListRooms",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={},
            timeout=CHECK_TIMEOUT,
        )
        ok, detail, code = classify_http(r.status_code, r.text)
        if ok:
            return CheckResult("livekit", True, "ListRooms ok", "pass")
        return CheckResult("livekit", ok, detail, code)
    except Exception as e:
        return CheckResult("livekit", False, str(e)[:120], "network")


def _read_pm2_pid_file(name: str) -> int | None:
    """bash+exec workers often have pid=null in jlist; pid file is reliable."""
    try:
        matches = sorted(Path("/root/.pm2/pids").glob(f"{name}-*.pid"))
        if not matches:
            return None
        raw = matches[-1].read_text(encoding="utf-8").strip()
        pid = int(raw)
        return pid if pid > 0 else None
    except (OSError, ValueError):
        return None


def get_nova_voice_pm2_stats() -> tuple[str, int]:
    """Return (status, restart_count) for nova-voice from PM2."""
    pm2_env = {
        **os.environ,
        "PATH": f"/root/.nvm/versions/node/v24.15.0/bin:{os.environ.get('PATH', '')}",
    }
    try:
        out = subprocess.run(
            [PM2_BIN, "jlist"],
            capture_output=True,
            text=True,
            timeout=10,
            env=pm2_env,
        )
        if out.returncode != 0:
            return "unknown", 0
        for proc in json.loads(out.stdout):
            if proc.get("name") != "nova-voice":
                continue
            env = proc.get("pm2_env") or {}
            status = env.get("status") or "unknown"
            restarts = int(env.get("restart_time") or 0)
            return str(status), restarts
        return "missing", 0
    except Exception:
        return "error", 0


def check_nova_worker() -> CheckResult:
    """Production voice worker: PM2 nova-voice (src/agent.py start), not dev mode."""
    pm2_env = {
        **os.environ,
        "PATH": f"/root/.nvm/versions/node/v24.15.0/bin:{os.environ.get('PATH', '')}",
    }
    try:
        out = subprocess.run(
            [PM2_BIN, "jlist"],
            capture_output=True,
            text=True,
            timeout=10,
            env=pm2_env,
        )
        if out.returncode != 0:
            return CheckResult("nova_worker", False, "pm2 jlist failed", "config")
        for proc in json.loads(out.stdout):
            if proc.get("name") != "nova-voice":
                continue
            env = proc.get("pm2_env") or {}
            status = env.get("status")
            pid = proc.get("pid") or _read_pm2_pid_file("nova-voice")
            if status == "online":
                detail = f"pm2 online pid {pid} restarts={env.get('restart_time', 0)}" if pid else f"pm2 online restarts={env.get('restart_time', 0)}"
                return CheckResult("nova_worker", True, detail, "pass")
            if status in ("launching", "stopping"):
                return CheckResult("nova_worker", True, f"pm2 {status}", "pass")
            return CheckResult("nova_worker", False, f"pm2 status {status or 'unknown'}", "config")
        return CheckResult("nova_worker", False, "nova-voice not in PM2", "config")
    except Exception as e:
        return CheckResult("nova_worker", False, str(e)[:80], "network")


def check_browser_path(host: str) -> CheckResult:
    """Browser join path: static UI + token API through nginx (same as Chrome)."""
    if not Path("/var/www/nova/index.html").is_file():
        return CheckResult("browser_path", False, "index.html missing", "config")
    try:
        with httpx.Client(timeout=CHECK_TIMEOUT, follow_redirects=True) as client:
            r_index = client.get(f"https://{host}/")
            if r_index.status_code != 200:
                return CheckResult(
                    "browser_path",
                    False,
                    f"UI HTTP {r_index.status_code}",
                    "network",
                )
            r_token = client.get(f"https://{host}/api/token")
            if r_token.status_code != 200:
                return CheckResult(
                    "browser_path",
                    False,
                    f"token HTTP {r_token.status_code}",
                    "network",
                )
            data = r_token.json()
            if not data.get("token") or not data.get("room"):
                return CheckResult(
                    "browser_path",
                    False,
                    "token JSON missing token/room",
                    "config",
                )
        return CheckResult("browser_path", True, f"UI+token ok ({host})", "pass")
    except Exception as e:
        return CheckResult("browser_path", False, str(e)[:120], "network")


def _mem_available_mb() -> int:
    try:
        text = Path("/proc/meminfo").read_text(encoding="utf-8")
        for line in text.splitlines():
            if line.startswith("MemAvailable:"):
                return int(line.split()[1]) // 1024
    except OSError:
        pass
    return 0


def _service_active(unit: str) -> bool:
    try:
        out = subprocess.run(
            ["systemctl", "is-active", unit],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return out.stdout.strip() == "active"
    except Exception:
        return False


def check_droplet_health() -> CheckResult:
    """Host health: disk, memory, load, critical services."""
    issues: list[str] = []
    try:
        usage = shutil.disk_usage("/")
        pct = (usage.used / usage.total) * 100 if usage.total else 100
        if pct > 90:
            issues.append(f"disk {pct:.0f}% full")
    except OSError as e:
        issues.append(f"disk check: {e}")

    avail_mb = _mem_available_mb()
    if avail_mb and avail_mb < 200:
        issues.append(f"low memory {avail_mb}MB free")

    try:
        load1 = os.getloadavg()[0]
        cpus = os.cpu_count() or 1
        if load1 > cpus * 2.5:
            issues.append(f"high load {load1:.1f}")
    except OSError:
        pass

    for unit in ("nova-token", "nginx"):
        if not _service_active(unit):
            issues.append(f"{unit} not active")

    if issues:
        return CheckResult("droplet_health", False, "; ".join(issues), "network")
    detail = f"ok disk/mem/load services (avail {avail_mb}MB)"
    return CheckResult("droplet_health", True, detail, "pass")


def run_checks(env: dict[str, str]) -> list[CheckResult]:
    host = env.get("NOVA_PUBLIC_HOST") or PUBLIC_HOST
    return [
        check_livekit(
            env.get("LIVEKIT_URL"),
            env.get("LIVEKIT_API_KEY"),
            env.get("LIVEKIT_API_SECRET"),
        ),
        check_openai(env.get("OPENAI_API_KEY")),
        check_deepgram(env.get("DEEPGRAM_API_KEY")),
        check_cartesia(env.get("CARTESIA_API_KEY")),
        check_nova_worker(),
        check_browser_path(host),
        check_droplet_health(),
    ]


def track_voice_restart_spike(state: dict) -> str | None:
    """Alert when nova-voice PM2 restarts spike (crash loop early warning)."""
    status, restarts = get_nova_voice_pm2_stats()
    if status in ("missing", "error", "unknown"):
        return None

    prev = int(state.get("nova_voice_restart_count", restarts))
    now = time.time()
    history: list[float] = [t for t in state.get("nova_voice_restart_ts", []) if now - t <= 3600]

    if restarts > prev:
        for _ in range(restarts - prev):
            history.append(now)
        if restarts - prev >= VOICE_RESTART_SPIKE_STEP:
            state["nova_voice_restart_ts"] = history
            state["nova_voice_restart_count"] = restarts
            return (
                f"nova-voice PM2 restarts jumped +{restarts - prev} "
                f"(total={restarts}, status={status})"
            )

    state["nova_voice_restart_ts"] = history
    state["nova_voice_restart_count"] = restarts

    if len(history) >= VOICE_RESTART_SPIKE_HOUR:
        return f"nova-voice restart spike: {len(history)} PM2 restarts in the last hour (total={restarts})"
    return None


def format_report(results: list[CheckResult]) -> str:
    lines = []
    for r in results:
        status = "PASS" if r.ok else "FAIL"
        lines.append(f"{r.name.upper()}: {status} ({r.detail})")
    return "\n".join(lines)


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def send_pushover(
    user_key: str,
    api_token: str,
    title: str,
    message: str,
    *,
    priority: int = 1,
) -> None:
    httpx.post(
        "https://api.pushover.net/1/messages.json",
        data={
            "token": api_token,
            "user": user_key,
            "title": title[:250],
            "message": message[:1024],
            "priority": str(priority),
            "sound": "siren" if priority > 0 else "pushover",
        },
        timeout=15.0,
    ).raise_for_status()


def should_alert(prev: dict | None, cur: CheckResult) -> bool:
    if not prev:
        return not cur.ok
    return prev.get("ok") != cur.ok or (not cur.ok and prev.get("code") != cur.code)


def _failure_ts_key(provider: str) -> str:
    return f"{provider}_failure_ts"


def _alerting_key(provider: str) -> str:
    return f"{provider}_alerting"


def record_failure(state: dict, provider: str, window_sec: int) -> list[float]:
    now = time.time()
    key = _failure_ts_key(provider)
    history = [t for t in state.get(key, []) if now - t <= window_sec]
    history.append(now)
    state[key] = history
    return history


def clear_failure_tracking(state: dict, provider: str) -> None:
    state.pop(_failure_ts_key(provider), None)
    state.pop(_alerting_key(provider), None)


def should_alert_with_retry(
    cur: CheckResult,
    state: dict,
    *,
    min_failures: int,
    window_sec: int,
) -> bool:
    """Alert only after sustained failures; skip repeat alerts for same incident."""
    if cur.ok:
        return False
    history = record_failure(state, cur.name, window_sec)
    if len(history) < min_failures:
        log(
            f"{cur.name}: failure {len(history)}/{min_failures} "
            f"within {window_sec}s — Pushover suppressed"
        )
        return False
    if state.get(_alerting_key(cur.name)):
        return False
    state[_alerting_key(cur.name)] = True
    return True


def process_check_alert(
    r: CheckResult,
    prev: dict | None,
    state: dict,
    alerts: list[str],
    recoveries: list[str],
) -> None:
    if r.name in DEEPGRAM_RETRY_PROVIDERS:
        if r.ok:
            if state.get(_alerting_key(r.name)) and prev and not prev.get("ok"):
                recoveries.append(f"{r.name.upper()} recovered ({r.detail})")
            clear_failure_tracking(state, r.name)
        elif should_alert_with_retry(
            r,
            state,
            min_failures=DEEPGRAM_ALERT_MIN_FAILURES,
            window_sec=DEEPGRAM_ALERT_WINDOW_SEC,
        ):
            alerts.append(f"{r.name.upper()} FAIL: {r.detail} [{r.code}]")
        return

    if should_alert(prev, r):
        if r.ok:
            recoveries.append(f"{r.name.upper()} recovered ({r.detail})")
        else:
            alerts.append(f"{r.name.upper()} FAIL: {r.detail} [{r.code}]")


def main() -> int:
    dry = "--dry-run" in sys.argv or os.environ.get("NO_PUSHOVER") == "1"
    health_only = "--health" in sys.argv

    env = load_env(ENV_LOCAL)
    push = load_env(ENV_PUSHOVER)
    user_key = push.get("PUSHOVER_USER_KEY") or os.environ.get("PUSHOVER_USER_KEY")
    api_token = push.get("PUSHOVER_API_TOKEN") or os.environ.get("PUSHOVER_API_TOKEN")

    results = run_checks(env)
    report = format_report(results)
    log(report.replace("\n", " | "))

    if health_only or dry:
        print(report)
        return 0 if all(r.ok for r in results) else 1

    state = load_state()
    alerts: list[str] = []
    recoveries: list[str] = []

    for r in results:
        if r.name not in MONITORED:
            continue
        prev = state.get(r.name)
        process_check_alert(r, prev, state, alerts, recoveries)
        state[r.name] = {"ok": r.ok, "code": r.code, "detail": r.detail, "ts": time.time()}

    restart_alert = track_voice_restart_spike(state)
    if restart_alert and not state.get("nova_voice_restart_alerting"):
        alerts.append(restart_alert)
        state["nova_voice_restart_alerting"] = True
    elif not restart_alert:
        if state.get("nova_voice_restart_alerting"):
            recoveries.append("nova-voice restart rate normalized")
        state["nova_voice_restart_alerting"] = False

    # Migrate legacy state key
    if "droplet_worker" in state and "nova_worker" not in state:
        state["nova_worker"] = state.pop("droplet_worker")

    save_state(state)

    if not api_token or not user_key:
        log("Pushover not configured (.env.pushover); skipping alerts")
        print(report)
        return 0 if all(r.ok for r in results) else 1

    if alerts:
        send_pushover(
            user_key,
            api_token,
            "Nova: health FAIL",
            "Nova health alert\n\n" + "\n".join(alerts),
            priority=1,
        )
        log(f"Pushover alert sent: {len(alerts)} issue(s)")
    elif recoveries:
        send_pushover(
            user_key,
            api_token,
            "Nova: health OK",
            "Recovered:\n" + "\n".join(recoveries),
            priority=0,
        )
        log(f"Pushover recovery sent: {len(recoveries)} item(s)")

    print(report)
    return 0 if all(r.ok for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
