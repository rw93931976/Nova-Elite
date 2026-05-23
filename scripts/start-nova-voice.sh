#!/usr/bin/env bash
# PM2 entrypoint — production LiveKit worker (no `dev` watchfiles).
# Voice agent: src/agent.py (keep in sync with agent-droplet.py at repo root).
set -eu
cd /root/nova
export PYTHONPATH="/root/nova/src:${PYTHONPATH:-}"
exec /root/nova/.venv/bin/python3 src/agent.py start
