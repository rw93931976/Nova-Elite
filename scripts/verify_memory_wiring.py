#!/usr/bin/env python3
"""Verify live references and memory wiring before deploy."""

from __future__ import annotations

import os
import sys

# Enable all memory layers for the dry-run load
os.environ.setdefault("NOVA_LIVE_REFERENCES", "1")
os.environ.setdefault("NOVA_STUDY_INDEX", "1")
os.environ.setdefault("NOVA_SCHEDULING", "1")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from memory import load_memory_context, memory_wiring_status  # noqa: E402


def main() -> int:
    status = memory_wiring_status()
    print("=== Nova memory wiring ===")
    for key, val in status.items():
        print(f"  {key}: {val}")

    ctx = load_memory_context()
    print(f"\n=== load_memory_context ({len(ctx)} chars) ===")
    if ctx:
        preview = ctx[:1200].encode("ascii", errors="replace").decode("ascii")
        print(preview)
        if len(ctx) > 1200:
            print("... [truncated]")
    else:
        print("(empty — check flags and Supabase)")

    if status["references_missing"]:
        print("\nFAIL: missing live references:", status["references_missing"])
        return 1
    if not status["live_dir_exists"]:
        print("\nFAIL: live ref directory missing")
        return 1
    print("\nOK: live references on disk; voice can load when env flags are set on worker.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
