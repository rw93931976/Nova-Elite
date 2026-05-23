"""Thin Supabase-backed memory for Nova voice sessions."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import httpx

logger = logging.getLogger("memory")

DEFAULT_USER_ID = "ray-sovereign"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536

# Always-loaded retained layers (priority order in _load_supabase_memory_context).
_ACTIVE_RETAINED_CATEGORIES = (
    "sovereign_identity",
    "preference",
    "user_instruction",
    "permission_boundary",
    "recovery_history",
)
# Recent voice recall only — capped, not full history.
_RECENT_VOICE_CATEGORIES = ("session_summary", "fact")
# Breadcrumb catalog only — tells Nova what exists in DB without loading bodies.
_REGISTRY_CATEGORY = "knowledge_registry"
# Stored in DB; retrieved on demand (semantic search / future tools), not stuffed into context.
_DB_ONLY_CATEGORIES = (
    "business",
    "emotion",
    "doctoral_syllabus",
    "solutions_vault",
    "notebook_registry",
)
_SKIP_CATEGORIES = _DB_ONLY_CATEGORIES
_LOAD_CATEGORIES = (
    *_ACTIVE_RETAINED_CATEGORIES,
    *_RECENT_VOICE_CATEGORIES,
    _REGISTRY_CATEGORY,
)
_MAX_LINES = 52
_MAX_CONTENT_CHARS = 360
_REGISTRY_BREADCRUMB_LINES = 8

_W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Clipped each call (~480 chars). Blueprint stays breadcrumb-only (infra noise on voice).
_LIVE_REFERENCE_SPECS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("Approved policy (Decision Log):", "Nova-Decision-Log", (".md", ".docx")),
    (
        "Identity and long-range vision:",
        "Nova-SOVEREIGN-AUTONOMY-MANIFEST-v2.2",
        (".md", ".txt", ".docx"),
    ),
    ("Capability progression:", "Nova-Capabilities", (".md", ".txt", ".docx")),
)

_PERSONA_VOICE_BASENAME = "Nova-Persona-Voice"
# Full voice persona file (~2k); do not one-line summarize (drops closers / honesty tail).
_PERSONA_VOICE_MAX_CHARS = 2200

_LIVE_REF_MAX_SECTION_CHARS = 480
_LIVE_REF_MAX_LINES = 18

_STUDY_INDEX_BASENAME = "Nova-Study-Index"

_LIVE_REF_BREADCRUMBS: tuple[tuple[str, str], ...] = (
    ("Manifest (staging tiers)", "Nova-SOVEREIGN-AUTONOMY-MANIFEST-v2.2"),
    ("Capabilities ladder", "Nova-Capabilities"),
    ("Decision log (policy)", "Nova-Decision-Log"),
    ("Project blueprint", "PROJECT_NOVA_ARCHITECTURE_BLUEPRINT_UPDATED-1"),
)

_NOTEBOOK_MAP_PATH = "nova-data/library/notebook_subject_map.json"
_NOTEBOOK_GROUPS_PATH = "nova-data/library/notebook_subject_groups.json"


def _voice_memory_session_limit() -> int:
    try:
        n = int((os.getenv("NOVA_VOICE_MEMORY_SESSIONS") or "8").strip())
    except ValueError:
        n = 8
    return max(1, min(n, 12))


def _supabase_url() -> str | None:
    return os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")


def _supabase_key() -> str | None:
    return (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
    )


def _openai_key() -> str | None:
    return os.getenv("OPENAI_API_KEY")


def _client_configured() -> bool:
    return bool(_supabase_url() and _supabase_key())


def _live_references_enabled() -> bool:
    flag = (os.getenv("NOVA_LIVE_REFERENCES") or "").strip().lower()
    return flag in ("1", "true", "yes", "on")


def _repo_root() -> Path:
    """Repo root: /root/nova when memory.py lives in src/."""
    here = Path(__file__).resolve().parent
    if (here / "nova-data").is_dir():
        return here
    if (here.parent / "nova-data").is_dir():
        return here.parent
    return here


def _live_ref_dir() -> Path:
    custom = (os.getenv("NOVA_LIVE_REF_DIR") or "").strip()
    if custom:
        return Path(custom).expanduser().resolve()
    return (_repo_root() / "nova-data" / "library" / "live").resolve()


def _scheduling_enabled() -> bool:
    flag = (os.getenv("NOVA_SCHEDULING") or "").strip().lower()
    return flag in ("1", "true", "yes", "on")


def _study_index_enabled() -> bool:
    flag = (os.getenv("NOVA_STUDY_INDEX") or "").strip().lower()
    return flag in ("1", "true", "yes", "on")


def _nova_timezone() -> ZoneInfo:
    name = (os.getenv("NOVA_TIMEZONE") or "America/Chicago").strip()
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo("America/Chicago")


def _headers() -> dict[str, str]:
    key = _supabase_key() or ""
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }


def _rest(path: str, *, method: str = "GET", params: dict | None = None, body: Any = None) -> Any:
    base = (_supabase_url() or "").rstrip("/")
    url = f"{base}/rest/v1/{path}"
    with httpx.Client(timeout=20.0) as client:
        resp = client.request(
            method,
            url,
            headers=_headers(),
            params=params,
            json=body,
        )
    if resp.status_code >= 400:
        raise RuntimeError(f"Supabase {method} {path}: {resp.status_code} {resp.text[:300]}")
    if resp.text:
        return resp.json()
    return None


def _clip(text: str, limit: int = _MAX_CONTENT_CHARS) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def _read_docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as zf:
        root = ET.fromstring(zf.read("word/document.xml"))
    paras: list[str] = []
    for para in root.iter(f"{_W_NS}p"):
        text = "".join(node.text or "" for node in para.iter(f"{_W_NS}t"))
        if text.strip():
            paras.append(text.strip())
    return "\n".join(paras)


def _read_reference_file(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return _read_docx_text(path)
    return path.read_text(encoding="utf-8", errors="replace")


def _find_reference_file(directory: Path, basename: str, suffixes: tuple[str, ...]) -> Path | None:
    for suffix in suffixes:
        candidate = directory / f"{basename}{suffix}"
        if candidate.is_file():
            return candidate
    return None


def _summarize_live_section(text: str, max_chars: int = _LIVE_REF_MAX_SECTION_CHARS) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(".,;:") + "..."


def _load_live_reference_context() -> str:
    """Approved on-disk references (policy, blueprint, manifest, capabilities)."""
    if not _live_references_enabled():
        return ""

    directory = _live_ref_dir()
    if not directory.is_dir():
        logger.debug("memory: live ref dir missing: %s", directory)
        return ""

    out: list[str] = [
        "Approved live references (use as source of truth; do not read aloud unless Ray asks):",
        "",
    ]
    line_count = 2
    loaded = 0

    for title, basename, suffixes in _LIVE_REFERENCE_SPECS:
        if line_count >= _LIVE_REF_MAX_LINES:
            break
        path = _find_reference_file(directory, basename, suffixes)
        if not path:
            continue
        try:
            raw = _read_reference_file(path)
        except Exception as e:
            logger.warning("memory: live ref read failed %s: %s", path.name, e)
            continue
        summary = _summarize_live_section(raw)
        if not summary:
            continue
        out.append(title)
        line_count += 1
        out.append(f"- {_clip(summary, _LIVE_REF_MAX_SECTION_CHARS)}")
        line_count += 1
        out.append("")
        line_count += 1
        loaded += 1

    if loaded == 0:
        return ""

    logger.info(
        "memory: loaded %d live reference(s) from %s",
        loaded,
        directory,
    )
    return "\n".join(out).strip() + "\n"


def _load_study_index_context() -> str:
    if not _study_index_enabled():
        return ""
    directory = _live_ref_dir()
    path = _find_reference_file(directory, _STUDY_INDEX_BASENAME, (".md",))
    if not path:
        return ""
    try:
        raw = _read_reference_file(path)
    except Exception as e:
        logger.warning("memory: study index read failed: %s", e)
        return ""
    summary = _summarize_live_section(raw, 520)
    if not summary:
        return ""
    logger.info("memory: loaded study index from %s", path.name)
    return (
        "Study index (grounding only; TODAY = completed sessions line, not the whole archive):\n"
        f"- {_clip(summary, 520)}\n"
    )


def _load_scheduling_context() -> str:
    if not _scheduling_enabled():
        return ""
    tz = _nova_timezone()
    now = datetime.now(tz)
    lines = [
        "Time and schedule (for grounding only):",
        f"- Current local time: {now.strftime('%A, %B %d, %Y %I:%M %p %Z')}",
    ]
    events_path = (_repo_root() / "nova-data" / "scheduling" / "events.json").resolve()
    if events_path.is_file():
        try:
            events = json.loads(events_path.read_text(encoding="utf-8"))
            if isinstance(events, list) and events:
                lines.append("- Upcoming (from events.json):")
                for ev in events[:4]:
                    if not isinstance(ev, dict):
                        continue
                    title = (ev.get("title") or "Event").strip()
                    start = (ev.get("start") or "").strip()
                    lines.append(f"  · {title}" + (f" — {start}" if start else ""))
        except Exception as e:
            logger.debug("memory: events.json skipped: %s", e)
    return "\n".join(lines) + "\n"


def _archive_query_enabled() -> bool:
    flag = (os.getenv("NOVA_ARCHIVE_QUERY") or "1").strip().lower()
    return flag not in ("0", "false", "no", "off")


def _load_voice_runtime_context() -> str:
    """Ground voice agent on what this runtime can and cannot access."""
    limit = _voice_memory_session_limit()
    if _archive_query_enabled():
        archive_line = (
            "- Text archive (DO Spaces): you CAN look up stored documents during this call "
            "with query_archive. Use it for profile, fixes vault, policy, research, business, "
            "schooling, SSU study sessions, or project topics—not casual chat. When Ray asks "
            "what you studied or whether you can see your study files, call query_archive first; "
            "never claim you have no study files without looking. Summarize excerpts for voice; "
            "never read URLs or tool names aloud; do not invent source text."
        )
    else:
        archive_line = (
            "- Archive lookup is not configured on this worker—do not claim you are reading "
            "stored documents live; do not invent source text."
        )
    return (
        "Voice runtime boundaries (accurate; do not claim otherwise):\n"
        f"- Cross-call memory: last {limit} voice session summaries and related facts from Supabase (below).\n"
        "- Nova's organized archive lives in DO Spaces only (not NotebookLM). Voice reads Spaces via query_archive.\n"
        f"{archive_line}\n"
        "- Live policy files on disk are clipped/breadcrumb-only in this call unless loaded below.\n"
        "- Autonomous study adds text to DO Spaces; Supabase holds session summaries when retrieved.\n"
    )


def _load_persona_voice_context() -> str:
    """Small instructions-only persona slice; never treat as content to read aloud."""
    if not _live_references_enabled():
        return ""
    directory = _live_ref_dir()
    path = _find_reference_file(directory, _PERSONA_VOICE_BASENAME, (".md",))
    if not path:
        return ""
    try:
        raw = _read_reference_file(path)
    except Exception as e:
        logger.warning("memory: persona voice read failed: %s", e)
        return ""
    body = re.sub(r"\n{3,}", "\n\n", (raw or "").strip())
    if not body:
        return ""
    if len(body) > _PERSONA_VOICE_MAX_CHARS:
        body = _clip(body, _PERSONA_VOICE_MAX_CHARS)
    logger.info(
        "memory: loaded persona voice slice from %s (%d chars, path=%s)",
        path.name,
        len(body),
        path,
    )
    return (
        "Persona (instructions-only—do not read aloud or quote to Ray):\n"
        f"{body}\n"
    )


def _notebook_subject_map() -> dict[str, Any]:
    path = (_repo_root() / _NOTEBOOK_MAP_PATH).resolve()
    if not path.is_file():
        alt = _live_ref_dir().parent / "notebook_subject_map.json"
        path = alt if alt.is_file() else path
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.debug("memory: notebook_subject_map skipped: %s", e)
        return {}


def resolve_notebook_for_topic(query: str) -> dict[str, str] | None:
    """Best subject→notebook mapping for a user question (breadcrumb / future retrieval)."""
    q = (query or "").lower()
    if not q.strip():
        return None
    data = _notebook_subject_map()
    best: dict[str, str] | None = None
    best_hits = 0
    for entry in data.get("subjects") or []:
        if not isinstance(entry, dict):
            continue
        topics = entry.get("topics") or []
        hits = sum(1 for t in topics if isinstance(t, str) and t.lower() in q)
        if hits > best_hits:
            best_hits = hits
            best = {
                "registry_id": str(entry.get("registry_id") or ""),
                "name": str(entry.get("name") or ""),
                "source_path": str(entry.get("source_path") or ""),
                "notebook_group": str(entry.get("notebook_group") or ""),
                "archive_key": str(entry.get("registry_id") or ""),
            }
    return best if best_hits else None


def _fetch_notebook_registry_rows() -> list[dict]:
    if not _client_configured():
        return []
    try:
        rows = _rest(
            "nova_memories",
            params={
                "select": "content,metadata",
                "category": "eq.notebook_registry",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
    except Exception as e:
        logger.debug("memory: notebook_registry fetch failed: %s", e)
        return []
    if not isinstance(rows, list):
        return []
    out: list[dict] = []
    for row in rows:
        content = row.get("content", "")
        if content.startswith("["):
            try:
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    out.extend(n for n in parsed if isinstance(n, dict))
            except json.JSONDecodeError:
                pass
    return out


def _notebook_subject_groups() -> dict[str, Any]:
    path = (_repo_root() / _NOTEBOOK_GROUPS_PATH).resolve()
    if not path.is_file():
        alt = _live_ref_dir().parent / "notebook_subject_groups.json"
        path = alt if alt.is_file() else path
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.debug("memory: notebook_subject_groups skipped: %s", e)
        return {}


def _notebook_group_summary_lines() -> list[str]:
    lines: list[str] = []
    for g in _notebook_subject_groups().get("groups") or []:
        if not isinstance(g, dict):
            continue
        gid = g.get("group_id") or ""
        name = g.get("notebook_name") or gid
        count = g.get("row_count") or len(g.get("registry_ids") or [])
        lines.append(f"- {name} ({gid}, {count} topics): spaces://{gid}/")
    return lines


def _notebook_breadcrumb_lines() -> list[str]:
    lines: list[str] = [
        "- DO Spaces archive: use group map first, then topic rows."
    ]
    group_lines = _notebook_group_summary_lines()
    if group_lines:
        lines.append("- Subject notebooks:")
        lines.extend(group_lines[:14])
    priority_ids = (
        "ray_profile",
        "solutions_vault",
        "ray_briefing",
        "marketing-v1",
        "expert_skills",
    )
    subjects = _notebook_subject_map().get("subjects") or []
    priority = [e for e in subjects if e.get("registry_id") in priority_ids]
    rest = [e for e in subjects if e.get("registry_id") not in priority_ids]
    ordered = priority + rest
    for entry in ordered[:18]:
        if not isinstance(entry, dict):
            continue
        topics = ", ".join(t for t in (entry.get("topics") or [])[:3] if isinstance(t, str))
        rid = entry.get("registry_id") or ""
        path = entry.get("source_path") or ""
        group = entry.get("notebook_group") or ""
        rid = entry.get("registry_id") or ""
        lines.append(
            f"- [{group}] {topics} → {rid} (spaces://{group}/{rid}.md)"
        )
    for nb in _fetch_notebook_registry_rows()[:4]:
        name = nb.get("name") or nb.get("id") or "notebook"
        url = nb.get("url") or ""
        lines.append(f"- Registry: {name} ({_clip(url, 80)})")
    return lines[:28]


def _live_ref_breadcrumb_lines() -> list[str]:
    directory = _live_ref_dir()
    lines: list[str] = ["- Live policy files (retrieve on demand, not loaded in full this call):"]
    for label, basename in _LIVE_REF_BREADCRUMBS:
        found = any(
            _find_reference_file(directory, basename, suf)
            for suf in ((".md",), (".txt",), (".docx",))
        )
        status = "on disk" if found else "missing on worker"
        lines.append(f"- {label}: nova-data/library/live/{basename}.md ({status})")
    return lines


def _row_user_id(row: dict) -> str:
    meta = row.get("metadata") or {}
    if isinstance(meta, dict) and meta.get("user_id"):
        return str(meta["user_id"])
    return ""


def _matches_user(row: dict, user_id: str) -> bool:
    uid = _row_user_id(row)
    if not uid:
        return True
    return uid == user_id


def _identity_to_plain(content: str) -> list[str]:
    """Turn sovereign_identity JSON into short plain-English lines."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return [_clip(content, 280)]

    lines: list[str] = []
    name = (data.get("name") or "Nova Elite").strip()
    lines.append(f"You are {name}. You are speaking with Ray.")

    mission = (data.get("mission") or "").strip()
    if mission:
        short = _clip(mission.replace("\n", " "), 240)
        lines.append(f"Your mission: {short}")

    tone = data.get("tone")
    if isinstance(tone, dict):
        style = (tone.get("style") or "").strip()
        if style:
            lines.append(f"Your tone: {_clip(style, 120)}.")

    status = (data.get("status") or "").strip()
    if status and len(lines) < 4:
        lines.append(f"Status: {_clip(status, 80)}.")

    return lines[:5]


def _pick_managed_row(rows: list[dict]) -> dict | None:
    """Prefer memory_layer_setup_v1 rows, else highest importance."""
    if not rows:
        return None
    managed = [
        r
        for r in rows
        if isinstance(r.get("metadata"), dict)
        and r["metadata"].get("setup_source") == "memory_layer_setup_v1"
    ]
    if managed:
        return managed[0]
    return sorted(rows, key=lambda r: r.get("importance") or 0, reverse=True)[0]


def _registry_breadcrumb_lines(registry_content: str) -> list[str]:
    try:
        data = json.loads(registry_content)
    except json.JSONDecodeError:
        data = {}
    lines: list[str] = [
        "- Supabase holds deeper knowledge; retrieve on demand — do not claim you have no database."
    ]
    for entry in data.get("retrieve_on_demand") or []:
        if not isinstance(entry, dict):
            continue
        cat = entry.get("category") or ""
        count = entry.get("count") or 0
        if cat in _SKIP_CATEGORIES and count:
            lines.append(f"- {cat}: {count} archived study rows (not loaded on voice).")
        elif count:
            lines.append(f"- {cat}: {count} record(s) available for retrieval.")
    skipped = data.get("skipped_on_voice") or []
    if skipped:
        lines.append(f"- Skipped in live context: {', '.join(skipped)}.")
    lines.extend(_live_ref_breadcrumb_lines())
    lines.extend(_notebook_breadcrumb_lines())
    for subj in data.get("notebook_subjects") or []:
        if isinstance(subj, dict) and subj.get("registry_id"):
            lines.append(
                f"- Map: {', '.join(subj.get('topics') or [])} → {subj.get('registry_id')} "
                f"({subj.get('source_path') or 'path TBD'})"
            )
    return lines[:16]


def _load_supabase_memory_context(user_id: str = DEFAULT_USER_ID) -> str:
    if not _client_configured():
        logger.warning("memory: Supabase not configured, skipping load")
        return ""

    try:
        cats = ",".join(_LOAD_CATEGORIES)
        rows = _rest(
            "nova_memories",
            params={
                "select": "category,content,importance,created_at,metadata",
                "category": f"in.({cats})",
                "order": "importance.desc,created_at.desc",
                "limit": "120",
            },
        )
    except Exception as e:
        logger.warning("memory: load failed: %s", e)
        return ""

    if not isinstance(rows, list):
        return ""

    by_cat: dict[str, list[dict]] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        cat = row.get("category") or ""
        if cat in _SKIP_CATEGORIES:
            continue
        if cat not in _LOAD_CATEGORIES:
            continue
        if not _matches_user(row, user_id):
            continue
        by_cat.setdefault(cat, []).append(row)

    out: list[str] = [
        "Active retained memory (use silently unless Ray asks):",
        "",
    ]
    line_count = 2

    def add_lines(section_title: str, items: list[str], max_items: int) -> None:
        nonlocal line_count
        if not items or line_count >= _MAX_LINES:
            return
        out.append(section_title)
        line_count += 1
        for item in items[:max_items]:
            if line_count >= _MAX_LINES:
                break
            out.append(item)
            line_count += 1
        out.append("")

    ident_row = _pick_managed_row(by_cat.get("sovereign_identity", []))
    if ident_row:
        plain = _identity_to_plain(ident_row.get("content", ""))
        add_lines("Identity and mission:", [f"- {ln}" for ln in plain], 5)

    pref_row = _pick_managed_row(by_cat.get("preference", []))
    pref_items: list[str] = []
    if pref_row:
        pref_items.append(f"- {_clip(pref_row.get('content', ''))}")
    for r in by_cat.get("preference", [])[:2]:
        if pref_row and r is pref_row:
            continue
        pref_items.append(f"- {_clip(r.get('content', ''))}")
    add_lines("Ray's preferences:", pref_items[:3], 3)

    proj_row = _pick_managed_row(by_cat.get("user_instruction", []))
    if proj_row:
        add_lines("Project direction:", [f"- {_clip(proj_row.get('content', ''))}"], 1)

    perm_row = _pick_managed_row(by_cat.get("permission_boundary", []))
    if perm_row:
        add_lines(
            "Permission and boundaries:",
            [f"- {_clip(perm_row.get('content', ''), 320)}"],
            1,
        )

    rec_row = _pick_managed_row(by_cat.get("recovery_history", []))
    if rec_row:
        add_lines(
            "Recovery history:",
            [f"- {_clip(rec_row.get('content', ''), 320)}"],
            1,
        )

    reg_row = _pick_managed_row(by_cat.get(_REGISTRY_CATEGORY, []))
    if reg_row:
        crumbs = _registry_breadcrumb_lines(reg_row.get("content", ""))
        add_lines("Knowledge store (breadcrumbs only):", crumbs, _REGISTRY_BREADCRUMB_LINES)
    else:
        fallback_crumbs = _live_ref_breadcrumb_lines() + _notebook_breadcrumb_lines()
        if fallback_crumbs:
            add_lines("Knowledge store (breadcrumbs only):", fallback_crumbs, _REGISTRY_BREADCRUMB_LINES)

    session_limit = _voice_memory_session_limit()
    summaries = by_cat.get("session_summary", [])
    voice_summaries = [
        r
        for r in summaries
        if isinstance(r.get("metadata"), dict)
        and r["metadata"].get("source") == "voice"
    ]
    summaries = (voice_summaries or summaries)[:session_limit]
    add_lines(
        "Recent voice sessions (background hints only — use query_memory for recall questions):",
        [f"- {_clip(r.get('content', ''))}" for r in summaries],
        session_limit,
    )

    all_facts = by_cat.get("fact", [])
    voice_facts = [
        r
        for r in all_facts
        if isinstance(r.get("metadata"), dict)
        and r["metadata"].get("source") == "voice"
    ]
    fact_cap = min(session_limit, 6)
    facts = [
        f"- {_clip(r.get('content', ''))}"
        for r in (voice_facts or all_facts)[:fact_cap]
    ]
    add_lines("Recent facts:", facts, fact_cap)

    if len(out) <= 2:
        return ""

    return "\n".join(out).strip() + "\n"


def load_memory_context(user_id: str = DEFAULT_USER_ID) -> str:
    runtime = _load_voice_runtime_context()
    persona = _load_persona_voice_context()
    live = _load_live_reference_context()
    study = _load_study_index_context()
    schedule = _load_scheduling_context()
    supabase_ctx = _load_supabase_memory_context(user_id)
    notebook_catalog = ""
    crumbs = _notebook_breadcrumb_lines()
    if crumbs:
        notebook_catalog = "Archive catalog (routing map; not full source text):\n" + "\n".join(crumbs)
    parts = [
        p
        for p in (runtime, notebook_catalog, persona, live, study, schedule, supabase_ctx)
        if p
    ]
    if not parts:
        return ""
    return "\n\n".join(parts)


def memory_wiring_status() -> dict[str, Any]:
    """Diagnostic for deploy scripts and control-room checks."""
    live_dir = _live_ref_dir()
    specs_ok: list[str] = []
    specs_missing: list[str] = []
    for _title, basename, suffixes in _LIVE_REFERENCE_SPECS:
        if _find_reference_file(live_dir, basename, suffixes):
            specs_ok.append(basename)
        else:
            specs_missing.append(basename)
    return {
        "live_references_enabled": _live_references_enabled(),
        "study_index_enabled": _study_index_enabled(),
        "scheduling_enabled": _scheduling_enabled(),
        "archive_query_enabled": _archive_query_enabled(),
        "live_dir": str(live_dir),
        "live_dir_exists": live_dir.is_dir(),
        "references_found": specs_ok,
        "references_missing": specs_missing,
        "study_index_found": bool(
            _find_reference_file(live_dir, _STUDY_INDEX_BASENAME, (".md",))
        ),
        "events_json": (_repo_root() / "nova-data" / "scheduling" / "events.json").is_file(),
        "supabase_configured": _client_configured(),
    }


async def embed_text(text: str) -> list[float] | None:
    api_key = _openai_key()
    if not api_key or not text.strip():
        return None
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": EMBED_MODEL, "input": text[:8000]},
            )
        if resp.status_code >= 400:
            logger.warning("memory: embed failed %s", resp.status_code)
            return None
        data = resp.json()
        return data["data"][0]["embedding"]
    except Exception as e:
        logger.warning("memory: embed error: %s", e)
        return None


def _insert_memory(
    user_id: str,
    content: str,
    category: str,
    importance: int,
    metadata: dict | None,
    embedding: list[float] | None = None,
) -> None:
    meta = dict(metadata or {})
    meta.setdefault("user_id", user_id)
    meta.setdefault("source", "voice")

    row: dict[str, Any] = {
        "content": content,
        "category": category,
        "importance": importance,
        "metadata": meta,
    }
    if embedding:
        row["embedding"] = embedding

    _rest("nova_memories", method="POST", body=row)


async def persist_voice_session_memory(
    user_id: str,
    summary: str,
    facts: list[str],
    metadata: dict | None = None,
) -> None:
    """Save voice session summary + facts with embeddings for semantic search."""
    if not _client_configured():
        return
    meta = dict(metadata or {})
    meta.setdefault("source", "voice")
    if summary.strip():
        emb = await embed_text(summary)
        try:
            _insert_memory(
                user_id,
                summary.strip(),
                "session_summary",
                9,
                meta,
                embedding=emb,
            )
            logger.info("memory: saved session_summary for %s (embedded=%s)", user_id, bool(emb))
        except Exception as e:
            logger.warning("memory: save_session_summary failed: %s", e)
    saved = 0
    for fact in facts[:5]:
        fact = fact.strip()
        if len(fact) < 8:
            continue
        category = (
            "preference" if re.search(r"\b(prefer|likes|wants|avoid)\b", fact, re.I) else "fact"
        )
        emb = await embed_text(fact)
        try:
            _insert_memory(user_id, fact, category, 7, meta, embedding=emb)
            saved += 1
        except Exception as e:
            logger.warning("memory: save_fact failed: %s", e)
    if saved:
        logger.info("memory: saved %d fact(s) for %s", saved, user_id)


def save_session_summary(
    user_id: str,
    summary: str,
    metadata: dict | None = None,
    embedding: list[float] | None = None,
) -> None:
    if not _client_configured() or not summary.strip():
        return
    try:
        _insert_memory(
            user_id,
            summary.strip(),
            "session_summary",
            9,
            metadata,
            embedding=embedding,
        )
        logger.info("memory: saved session_summary for %s", user_id)
    except Exception as e:
        logger.warning("memory: save_session_summary failed: %s", e)


def save_facts(
    user_id: str,
    facts: list[str],
    metadata: dict | None = None,
    *,
    embeddings: list[list[float] | None] | None = None,
) -> None:
    if not _client_configured() or not facts:
        return
    for i, fact in enumerate(facts[:5]):
        fact = fact.strip()
        if len(fact) < 8:
            continue
        category = (
            "preference" if re.search(r"\b(prefer|likes|wants|avoid)\b", fact, re.I) else "fact"
        )
        emb = embeddings[i] if embeddings and i < len(embeddings) else None
        try:
            _insert_memory(user_id, fact, category, 7, metadata, embedding=emb)
        except Exception as e:
            logger.warning("memory: save_fact failed: %s", e)
    logger.info("memory: saved %d fact(s) for %s", min(len(facts), 5), user_id)


def format_memory_search_results(rows: list[dict], *, max_chars: int = 1600) -> str:
    if not rows:
        return "No matching memories found in Supabase for that question."
    lines: list[str] = ["Relevant memories (summarize for voice; do not read tool names):"]
    total = 0
    for row in rows[:5]:
        cat = row.get("category") or "memory"
        content = _clip(str(row.get("content") or ""), 320)
        if not content:
            continue
        line = f"- [{cat}] {content}"
        if total + len(line) > max_chars:
            break
        lines.append(line)
        total += len(line)
    return "\n".join(lines)


async def search_memories(
    query: str, k: int = 5, user_id: str = DEFAULT_USER_ID
) -> list[dict]:
    if not _client_configured() or not query.strip():
        return []
    embedding = await embed_text(query)
    if not embedding:
        return []
    try:
        rows = _rest(
            "rpc/match_nova_memories",
            method="POST",
            body={
                "query_embedding": embedding,
                "match_count": k,
                "filter_user_id": user_id,
            },
        )
        return rows if isinstance(rows, list) else []
    except Exception as e:
        logger.debug("memory: search_memories unavailable: %s", e)
        return []


async def summarize_session_transcript(transcript: str) -> tuple[str, list[str]]:
    """Return (summary, facts) from a voice session transcript."""
    api_key = _openai_key()
    if not api_key or len(transcript.strip()) < 40:
        return "", []

    prompt = (
        "Summarize this voice conversation between Ray and Nova.\n"
        'Return JSON only: {"summary": "2-4 sentences", "facts": ["...", ...]}\n'
        "facts: up to 5 durable preferences or facts worth remembering; use [] if none.\n\n"
        f"Transcript:\n{transcript[:12000]}"
    )
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                },
            )
        if resp.status_code >= 400:
            logger.warning("memory: summarize failed %s", resp.status_code)
            return "", []
        raw = resp.json()["choices"][0]["message"]["content"]
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return "", []
        data = json.loads(match.group())
        summary = (data.get("summary") or "").strip()
        facts = [str(f).strip() for f in data.get("facts") or [] if str(f).strip()]
        return summary, facts[:5]
    except Exception as e:
        logger.warning("memory: summarize error: %s", e)
        return "", []
