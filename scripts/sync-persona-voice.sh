#!/usr/bin/env bash
# Keep tracked persona in sync with the live slice the voice worker reads.
set -eu
NOVA_ROOT="${NOVA_ROOT:-/root/nova}"
SRC="${1:-$NOVA_ROOT/persona/Nova-Persona-Voice.md}"
DEST="${NOVA_ROOT}/nova-data/library/live/Nova-Persona-Voice.md"
if [ ! -f "$SRC" ]; then
  echo "ERROR: missing $SRC"
  exit 1
fi
mkdir -p "$(dirname "$DEST")"
cp "$SRC" "$DEST"
echo "Synced $(wc -c <"$SRC") bytes -> $DEST"
md5sum "$SRC" "$DEST"
