#!/usr/bin/env bash
# PM2 entrypoint — production LiveKit worker (no `dev` watchfiles).
set -eu
cd /root/nova
exec /root/nova/.venv/bin/python3 src/agent.py start
