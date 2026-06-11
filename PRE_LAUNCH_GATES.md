# Pre-launch gates (Ray — do not ship without these)

**Last updated:** 2026-05-23

## 1. Rename (required)

- **Voice partner:** **Kate** (locked May 2026) — not “Nova” / not “Nova Elite” (Amazon Nova AI trademark).
- **Company / DBA:** TBD — vertical-neutral name under **Sierra Entertainment LLC**. **System Scale is out** (conflict with System Scale Corp / industrial scales). `getsystemscale.com` retire when new domain chosen.
- Internal codename `nova-elite` in repo can stay until full rename pass.

## 2. Voice / infra (before selling)

- Droplet voice stable (currently Deepgram Aura-1, `NOVA_TTS=deepgram`).
- Watchdog + Pushover when worker down / import crash / Cartesia 402.
- **Break-glass (Deepgram down):** SSH or Chrome Remote Desktop → desktop → SSH to droplet → set `NOVA_TTS=openai` in `/root/nova/.env.local` → `pm2 restart nova-voice`. On the road: use **Chrome Remote Desktop** to reach the home PC, then operate droplet from there (phone alone is not enough for env edits).
- PM2 boot persistence: `scripts/ensure-pm2-startup.sh` on droplet (survives reboot).

## 3. Trials (before receptionist)

- Book + artwork = **sandbox social** proof (Pinterest + Instagram; LinkedIn/X paused), not phone receptionist yet.
- Receptionist + triple seamless failover = **later phase**.
- **Sandbox mode:** stay off (`KATE_SANDBOX_MODE` unset) until Kate is solid in live voice sessions.

## 4. Per client (when live)

- One short AI disclosure at call start — wording from **client’s** script; never repeated unless asked.

## 5. Open decisions

- **Territory exclusivity** (ZIP / radius) — TBD; not required for nationwide remote DFW offer.
- **Study cadence** — **4×/day** (6 AM · 12 PM · 3 PM · 6 PM Chicago): business · business · AEO or EQ · business. Running on droplet cron.
- **Commercial name brainstorm** — Ray + advisors; pick before site/contracts/traction.

## 6. Ladder / autonomy

- Follows **reliability**, not calendar or hype.
- **L7→8:** spawn/sandbox training → client-deployable mesh. **L8→9:** retail product done → Kate’s own autonomy path.

## 7. Operations — keep it running (May 2026)

### Backups

- **Local:** `/root/backups/` — noon + 10 PM Chicago (`/etc/cron.d/nova-droplet-backup`), 7-day rotation.
- **Offsite:** each backup auto-pushes to DO Spaces `backups/droplet/` when `NOVA_BACKUP_OFFSITE=1` (default). Local copy still kept if Spaces push fails.

### Deploy ritual (any droplet change)

1. Confirm latest backup ran (or run `scripts/nova-droplet-backup.sh` manually).
2. Deploy code / PWA.
3. One voice test call (connect, hear Kate, disconnect clean).
4. Next morning: glance at `schooling-cron.log` and `provider-monitor.log`.

### Monitoring

- **Every minute:** `nova-health-watchdog.sh` (voice/token/import crash).
- **Every 5 min:** `nova-provider-monitor.py` (LiveKit, Deepgram, worker, UI path, disk).
- **Voice restart spike:** Pushover if PM2 `nova-voice` restarts jump +3 in one check or ≥5 in one hour.

### Kate validation (your gate — not automated)

After memory/schooling changes, one real conversation should show:

- Remembers context from prior talks in the session.
- Partner tone + humor calibration (not stiff assistant).
- Accurate on what she studied (can reference schooling topics without inventing runs).

### Road ops

- **Chrome Remote Desktop** → home PC → Cursor + SSH to droplet. That is the supported path when traveling; break-glass and deploy steps assume desktop access, not phone-only.

### Repo insurance

- Commit and push meaningful local changes regularly so the laptop is not a single point of failure.

