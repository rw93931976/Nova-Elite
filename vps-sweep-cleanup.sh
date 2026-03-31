#!/bin/bash
# vps-sweep-cleanup.sh - Phase 1 Cleanup
# Targets redundant logs and fragmented job artifacts

TARGET_DIR="/home/aims"
echo "[Sweep] Starting cleanup in $TARGET_DIR..."

# 1. Prune logs older than 7 days
find "$TARGET_DIR" -name "*.log" -type f -mtime +7 -delete
echo "[Sweep] Old logs pruned."

# 2. Clear temp files and job artifacts
# Be careful not to delete critical files
find "$TARGET_DIR" -name "*.tmp" -type f -delete
find "$TARGET_DIR" -name "job-*.wav" -type f -mtime +1 -delete
find "$TARGET_DIR" -name "swarm_debug_*.log" -type f -delete
echo "[Sweep] Temp files and old job waves cleared."

# 3. Clean PM2 logs (optional but recommended)
pm2 flush

echo "[Sweep] Cleanup complete."
