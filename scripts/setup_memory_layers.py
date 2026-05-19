#!/usr/bin/env python3
"""Seed active retained memory + knowledge_registry breadcrumbs in Supabase."""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _load_env_files() -> None:
    for name in (".env", "nova_env_soul.env", "vps.env"):
        path = ROOT / name
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            if key and key not in os.environ:
                os.environ[key] = val.strip().strip('"').strip("'")


_load_env_files()

from memory import (  # noqa: E402
    DEFAULT_USER_ID,
    _client_configured,
    _clip,
    _headers,
    _rest,
    _supabase_url,
)

NOVA_DATA = Path(
    os.getenv("NOVA_DATA_ROOT", r"C:\Users\Ray\.gemini\antigravity\Nova-Elite\nova-data")
).resolve()

SKIP_ALWAYS_LOAD = ("business", "emotion")
REGISTRY_CATEGORY = "knowledge_registry"
SETUP_SOURCE = "memory_layer_setup_v1"


def _read_text(path: Path, limit: int = 2000) -> str:
    if not path.is_file():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")[:limit]


def _replace_managed(category: str, content: str, importance: int, metadata: dict) -> bool:
    """Replace rows this script owns for a category (delete setup_source, then insert)."""
    try:
        _rest(
            "nova_memories",
            method="DELETE",
            params={
                "category": f"eq.{category}",
                "metadata->>setup_source": f"eq.{SETUP_SOURCE}",
            },
        )
        _rest(
            "nova_memories",
            method="POST",
            body={
                "content": content,
                "category": category,
                "importance": importance,
                "metadata": metadata,
            },
        )
        return True
    except Exception as e:
        print(f"  WARN replace {category}: {e}")
        return False


def _replace_registry_category(content: str) -> bool:
    try:
        _rest(
            "nova_memories",
            method="DELETE",
            params={"category": f"eq.{REGISTRY_CATEGORY}"},
        )
        _rest(
            "nova_memories",
            method="POST",
            body={
                "content": content,
                "category": REGISTRY_CATEGORY,
                "importance": 10,
                "metadata": {
                    "user_id": DEFAULT_USER_ID,
                    "setup_source": SETUP_SOURCE,
                    "version": "1",
                },
            },
        )
        return True
    except Exception as e:
        print(f"  WARN registry: {e}")
        return False


def _category_counts() -> dict[str, int]:
    counts: dict[str, int] = {}
    try:
        rows = _rest(
            "nova_memories",
            params={"select": "category", "limit": "5000"},
        )
    except Exception:
        return counts
    if not isinstance(rows, list):
        return counts
    for row in rows:
        if isinstance(row, dict):
            cat = row.get("category") or "unknown"
            counts[cat] = counts.get(cat, 0) + 1
    return counts


def _build_identity_content() -> str:
    path = NOVA_DATA / "sovereign_identity.json"
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return json.dumps(
        {
            "name": "Nova Elite",
            "mission": "Empower SMBs through sovereign intelligence and strategic advisory.",
        }
    )


def _build_preference_content() -> str:
    user = _read_text(NOVA_DATA / "library" / "profile_user.md", 1200)
    lines = [
        "Ray communication: concise, dry humor, zero preambles.",
        "Safety: hard no-delete rule; destructive actions need explicit Yes/No approval.",
        "UI: premium, modern, dark-mode preferred.",
    ]
    if user:
        for line in user.splitlines():
            if line.strip().startswith("- **"):
                lines.append(line.strip().lstrip("- ").replace("**", ""))
    return _clip("\n".join(lines), 900)


def _build_project_direction_content() -> str:
    return _clip(
        "Project Nova: sovereign voice on LiveKit droplet; memory in Supabase; "
        "study homework targets real NotebookLM (schooling paused until archival works). "
        "Priority: identity → preferences → live policy refs → database retrieval on demand. "
        "Ray/fixes folders deploy as clipped live refs under nova-data/library/live/.",
        480,
    )


def _build_permission_content() -> str:
    nova = _read_text(NOVA_DATA / "library" / "profile_nova.md", 800)
    lines = [
        "Voice runtime: no NotebookLM, no filesystem tools, no notebook read/write on worker.",
        "No delete; do not mutate core safety logic.",
        "Direct outreach restricted to simulation/shadow-ops.",
        "Do not load business/emotion doctoral spam into live voice context.",
    ]
    if nova:
        for line in nova.splitlines():
            if "Fence" in line or "Vow" in line or "Sovereign" in line:
                lines.append(line.strip().lstrip("- "))
    return _clip("\n".join(lines), 720)


def _build_recovery_content() -> str:
    nexus = _read_text(NOVA_DATA / "memory" / "Memory_Nexus.md", 600)
    study = _read_text(NOVA_DATA / "library" / "live" / "Nova-Study-Index.md", 500)
    parts = [
        "Recovery: cross-call voice memory in Supabase (session_summary, fact).",
        "Live refs: nova-data/library/live/ (policy, manifest, blueprint, capabilities).",
        "Deep archive: NotebookLM + nova-data/notebooks/ (not mounted on voice).",
    ]
    if study:
        parts.append(_clip(study.replace("\n", " "), 280))
    if nexus:
        parts.append(_clip(nexus.replace("\n", " "), 200))
    return _clip("\n".join(parts), 900)


def _load_notebook_subject_map() -> list[dict]:
    path = NOVA_DATA / "library" / "notebook_subject_map.json"
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("subjects") or []
    except Exception:
        return []


def _build_registry(counts: dict[str, int]) -> str:
    active = [
        "sovereign_identity",
        "preference",
        "user_instruction",
        "permission_boundary",
        "recovery_history",
    ]
    on_demand = [
        "session_summary",
        "fact",
        "solutions_vault",
        "doctoral_syllabus",
        "notebook_registry",
        "business",
        "emotion",
    ]
    catalog = {
        "version": 1,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "instruction": (
            "Full text for most categories lives in Supabase only. "
            "Use semantic search when Ray asks for specifics; do not claim you lack a database."
        ),
        "active_retained": [
            {
                "category": c,
                "count": counts.get(c, 0),
                "role": "always_loaded_clipped",
            }
            for c in active
        ],
        "retrieve_on_demand": [
            {
                "category": c,
                "count": counts.get(c, 0),
                "role": "database_only" if c in SKIP_ALWAYS_LOAD else "search_or_fetch",
            }
            for c in on_demand
            if counts.get(c, 0) or c in on_demand
        ],
        "skipped_on_voice": list(SKIP_ALWAYS_LOAD),
        "live_voice_slice": "nova-data/library/live/Nova-Persona-Voice.md (instructions-only)",
        "live_ref_breadcrumbs": [
            {"label": "Manifest", "path": "nova-data/library/live/Nova-SOVEREIGN-AUTONOMY-MANIFEST-v2.2.md"},
            {"label": "Capabilities", "path": "nova-data/library/live/Nova-Capabilities.md"},
            {"label": "Decision log", "path": "nova-data/library/live/Nova-Decision-Log.md"},
            {"label": "Blueprint", "path": "nova-data/library/live/PROJECT_NOVA_ARCHITECTURE_BLUEPRINT_UPDATED-1.md"},
        ],
        "notebook_subjects": _load_notebook_subject_map(),
        "notebooklm": {
            "status": "read_write_pending_on_voice",
            "instruction": "Use notebook_subjects topic map; verify notebooklm_url before claiming live access.",
        },
        "notebooks": "nova-data/notebooks/ + NotebookLM (archive; not full load on voice)",
    }
    return json.dumps(catalog, indent=2)


def main() -> int:
    if not _client_configured():
        print("FAIL: Supabase not configured")
        return 1

    meta_base = {
        "user_id": DEFAULT_USER_ID,
        "setup_source": SETUP_SOURCE,
        "layer": "active_retained",
    }

    touched: list[str] = []
    identity = _build_identity_content()
    if _replace_managed(
        "sovereign_identity",
        identity,
        10,
        {**meta_base, "source_file": str(NOVA_DATA / "sovereign_identity.json")},
    ):
        touched.append("sovereign_identity")

    pref = _build_preference_content()
    if _replace_managed("preference", pref, 9, {**meta_base, "layer": "preference"}):
        touched.append("preference")

    proj = _build_project_direction_content()
    if _replace_managed(
        "user_instruction", proj, 9, {**meta_base, "layer": "project_direction"}
    ):
        touched.append("user_instruction")

    perm = _build_permission_content()
    if _replace_managed(
        "permission_boundary", perm, 10, {**meta_base, "layer": "permission"}
    ):
        touched.append("permission_boundary")

    rec = _build_recovery_content()
    if _replace_managed("recovery_history", rec, 8, {**meta_base, "layer": "recovery"}):
        touched.append("recovery_history")

    counts = _category_counts()
    registry_json = _build_registry(counts)
    if _replace_registry_category(registry_json):
        touched.append(REGISTRY_CATEGORY)

    print("=== setup_memory_layers ===")
    print("Supabase:", _supabase_url())
    print("Nova data:", NOVA_DATA)
    print("Upserted categories:", ", ".join(touched))
    print("Category counts:", json.dumps(counts, indent=2))
    return 0 if touched else 1


if __name__ == "__main__":
    raise SystemExit(main())
