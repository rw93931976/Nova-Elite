"""Read Nova's text archive from DigitalOcean Spaces (voice filing cabinet)."""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from functools import lru_cache
from typing import Any
from zoneinfo import ZoneInfo

from memory import _repo_root, resolve_notebook_for_topic

logger = logging.getLogger("archive")

_TEXT_SUFFIXES = {".md", ".txt"}
_MAX_OBJECT_BYTES = 2_000_000
_MAX_ANSWER_CHARS = 1800
_MAX_FILES_PER_QUERY = 8
_CORRUPT_RE = re.compile(
    r"Incorrect API key|Logic Snag|Sovereign Gateway: High-intelligence providers failed",
    re.I,
)


def _is_corrupt(text: str) -> bool:
    return bool(_CORRUPT_RE.search(text or ""))


_STUDY_PREFIXES = ("mastery/", "business/", "eq/", "marketing/", "research/")
# Ops / crash log — must not win when Ray asks about schooling (filename fooled retrieval).
_MISLEADING_STUDY_KEYS = frozenset({"ray_project/nova_study.md"})
_STUDY_INTENT_RE = re.compile(
    r"\b(stud\w*|school\w*|ssu|syllabus|doctoral|homework|course\w*)\b",
    re.I,
)
_RESTORATION_LOG_RE = re.compile(r"SYSTEM CRASH|RESTORATION LOG|Sovereign LOG", re.I)
_CHICAGO = ZoneInfo("America/Chicago")
_MORNING_STUDY_HINTS = (
    "this morning",
    "morning study",
    "morning session",
    "midday",
    "12 pm",
    "12:00",
    "at noon",
    "this noon",
    "business session",
    "business study",
    "lunchtime",
)
_AFTERNOON_STUDY_HINTS = (
    "this afternoon",
    "afternoon",
    "eq session",
    " eq ",
    "emotion",
    "3 pm",
    "3:00",
    "15:00",
    "search-eq",
)


def _is_ssu_study_question(question: str) -> bool:
    ql = (question or "").lower().strip()
    if not ql:
        return False
    if _STUDY_INTENT_RE.search(ql):
        return True
    if "study" in ql or "school" in ql:
        return True
    if any(p in ql for p in ("what did you do today", "what did you work on", "what have you been learning")):
        return True
    if any(p in ql for p in ("your files", "your notes", "the archive", "other files")) and any(
        p in ql for p in ("see", "find", "read", "access", "have", "show", "list")
    ):
        return True
    return False


def _load_study_progress() -> dict[str, Any]:
    try:
        raw = _get_text("library/ssu/study_progress.json")
        return json.loads(raw)
    except Exception as e:
        logger.debug("archive: study_progress unavailable: %s", e)
        return {}


def _study_file_inventory() -> str:
    lines: list[str] = ["Study files visible in DO Spaces archive:"]
    total = 0
    for prefix in _STUDY_PREFIXES:
        try:
            keys = [k for k in _list_keys(prefix) if k.endswith(".md")]
        except Exception:
            continue
        if not keys:
            continue
        total += len(keys)
        label = prefix.rstrip("/")
        lines.append(f"- {label}: {len(keys)} files")
        for key in keys[:4]:
            name = os.path.basename(key).replace("_", " ").replace(".md", "")
            lines.append(f"  • {name}")
        if len(keys) > 4:
            lines.append(f"  • plus {len(keys) - 4} more")
    prog = _load_study_progress()
    summary = prog.get("summary") or {}
    biz = summary.get("business") or {}
    lines.append(
        f"SSU scorecard: business {biz.get('done', '?')}/{biz.get('total', '?')} complete."
    )
    if total == 0:
        return "No study markdown files found in archive folders yet."
    return "\n".join(lines)


def _completed_chicago_date(entry: dict[str, Any]) -> str | None:
    raw = str(entry.get("completed_at") or "").strip()
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.astimezone(_CHICAGO).date().isoformat()
    except ValueError:
        return None


def _sessions_for_day(completed: list[dict[str, Any]], day: str) -> list[dict[str, Any]]:
    return [c for c in completed if _completed_chicago_date(c) == day]


def _session_label(entry: dict[str, Any]) -> str:
    subject = str(entry.get("subject") or "study session")
    study_type = str(entry.get("type") or "")
    return f"{subject} ({study_type})" if study_type else subject


def _format_study_session(entry: dict[str, Any], question: str, headline: str) -> str:
    key = str(entry.get("spaces_key") or "")
    label = _session_label(entry)
    if key:
        try:
            text = _get_text(key)
            if not _is_corrupt(text):
                excerpt = _extract_relevant(text, question)
                if excerpt:
                    return f"{headline}{label}. {excerpt}"
        except Exception as e:
            logger.warning("archive: study read failed key=%s: %s", key, e)
    return f"{headline}{label}."


def _pick_study_sessions(
    completed: list[dict[str, Any]], question: str
) -> list[dict[str, Any]]:
    """Pick SSU session row(s) for a study question (Chicago day/slot aware)."""
    if not completed:
        return []
    ql = (question or "").lower()
    today = datetime.now(_CHICAGO).date().isoformat()
    today_sessions = _sessions_for_day(completed, today)

    if any(p in ql for p in _AFTERNOON_STUDY_HINTS):
        emo = [s for s in today_sessions if str(s.get("type")) == "Emotion"]
        if emo:
            return [emo[-1]]
        search = [s for s in today_sessions if str(s.get("type")) == "Search"]
        if search:
            return [search[-1]]
        emo_all = [s for s in completed if str(s.get("type")) == "Emotion"]
        return [emo_all[-1]] if emo_all else []

    if any(p in ql for p in _MORNING_STUDY_HINTS) or (
        "morning" in ql and "afternoon" not in ql
    ):
        biz = [s for s in today_sessions if str(s.get("type")) == "Business"]
        if biz:
            return [biz[-1]]
        biz_all = [s for s in completed if str(s.get("type")) == "Business"]
        return [biz_all[-1]] if biz_all else []

    if any(p in ql for p in ("today", "latest", "recent", "just", "now", "tonight")):
        if today_sessions:
            return today_sessions
        return [completed[-1]]

    return [completed[-1]]


def _answer_ssu_study_question(question: str) -> str | None:
    if not _is_ssu_study_question(question):
        return None

    ql = (question or "").lower()
    prog = _load_study_progress()
    completed = prog.get("completed") or []
    if not completed:
        return "SSU scorecard shows no completed study sessions yet."

    if any(
        p in ql
        for p in (
            "other",
            "previous",
            "past",
            "archive",
            "before",
            "else",
            "more",
        )
    ) and any(p in ql for p in ("file", "files", "see", "list", "show", "access")):
        return _study_file_inventory()

    picks = _pick_study_sessions(completed, question)
    if not picks:
        return "No matching SSU study session found for that question."

    if len(picks) == 1:
        if any(p in ql for p in ("today", "latest", "recent", "just", "now", "tonight")):
            headline = "Today's SSU session: "
        elif any(p in ql for p in _MORNING_STUDY_HINTS):
            headline = "Today's noon business SSU session: "
        elif any(p in ql for p in _AFTERNOON_STUDY_HINTS):
            headline = "Today's afternoon SSU session: "
        else:
            headline = "Latest completed SSU session: "
        return _format_study_session(picks[0], question, headline)

    labels = [_session_label(entry) for entry in picks]
    lead = f"Today's completed SSU sessions ({len(picks)}): " + "; ".join(labels) + "."
    detail = _format_study_session(picks[-1], question, "Most recent: ")
    return f"{lead} {detail}"


def archive_query_enabled() -> bool:
    flag = (os.getenv("NOVA_ARCHIVE_QUERY") or "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return False
    return bool(_spaces_bucket() and _spaces_key() and _spaces_secret())


def _spaces_bucket() -> str:
    return (os.getenv("DO_SPACES_BUCKET") or "nova-archive").strip()


def _spaces_region() -> str:
    return (os.getenv("DO_SPACES_REGION") or "sfo3").strip()


def _spaces_endpoint() -> str:
    custom = (os.getenv("DO_SPACES_ENDPOINT") or "").strip()
    if custom:
        return custom.rstrip("/")
    return f"https://{_spaces_region()}.digitaloceanspaces.com"


def _spaces_key() -> str:
    return (os.getenv("DO_SPACES_KEY") or os.getenv("DO_SPACES_ACCESS_KEY") or "").strip()


def _spaces_secret() -> str:
    return (os.getenv("DO_SPACES_SECRET") or os.getenv("DO_SPACES_SECRET_KEY") or "").strip()


@lru_cache(maxsize=1)
def _s3_client():
    import boto3

    return boto3.client(
        "s3",
        region_name=_spaces_region(),
        endpoint_url=_spaces_endpoint(),
        aws_access_key_id=_spaces_key(),
        aws_secret_access_key=_spaces_secret(),
    )


def _load_groups() -> list[dict[str, Any]]:
    path = (_repo_root() / "nova-data/library/notebook_subject_groups.json").resolve()
    if not path.is_file():
        return []
    import json

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        logger.warning("archive: groups load failed: %s", e)
        return []
    groups = data.get("groups") or []
    return [g for g in groups if isinstance(g, dict)]


def _group_by_hint(hint: str) -> dict[str, Any] | None:
    hint_l = (hint or "").strip().lower()
    if not hint_l:
        return None
    for group in _load_groups():
        gid = str(group.get("group_id") or "").lower()
        name = str(group.get("notebook_name") or "").lower()
        if hint_l == gid or hint_l in name or hint_l.replace("_", " ") in name:
            return group
    return None


def resolve_archive_group(
    question: str, notebook_group: str | None = None
) -> tuple[str, str, str | None]:
    """Return (group_id, label, registry_id or None)."""
    if notebook_group:
        group = _group_by_hint(notebook_group)
        if group:
            gid = str(group.get("group_id") or notebook_group)
            label = str(group.get("notebook_name") or gid)
            return gid, label, None

    topic = resolve_notebook_for_topic(question)
    if topic and _is_ssu_study_question(question):
        rid = str(topic.get("registry_id") or "")
        if rid in ("nova_study",):
            topic = None
    if topic:
        group_id = str(topic.get("notebook_group") or topic.get("registry_id") or "")
        label = str(topic.get("name") or topic.get("registry_id") or "archive")
        rid = str(topic.get("registry_id") or "") or None
        if group_id:
            return group_id, label, rid

    q = (question or "").lower()
    keyword_groups: tuple[tuple[str, str], ...] = (
        ("what studying", "mastery"),
        ("what did you study", "mastery"),
        ("studying", "mastery"),
        ("studied", "mastery"),
        ("study files", "mastery"),
        ("study today", "mastery"),
        ("completed study", "mastery"),
        ("study session", "mastery"),
        ("today's study", "mastery"),
        ("todays study", "mastery"),
        ("schooling", "mastery"),
        ("ssu", "mastery"),
        ("teamwork", "mastery"),
        ("leadership", "mastery"),
        ("foundations of", "mastery"),
        ("doctoral study", "mastery"),
        ("eq", "eq"),
        ("mirroring", "eq"),
        ("emotional intelligence", "eq"),
        ("profile", "ray_profile"),
        ("fixes", "nova_fixes"),
        ("solutions vault", "nova_fixes"),
        ("live policy", "live_policy"),
        ("decision log", "live_policy"),
        ("recovery", "recovery"),
        ("marketing", "marketing"),
        ("business", "business"),
        ("legal", "legal"),
        ("research", "research"),
    )
    for phrase, gid in keyword_groups:
        if phrase in q:
            group = _group_by_hint(gid)
            if group:
                return gid, str(group.get("notebook_name") or gid), None
            if gid in ("mastery", "eq", "research", "marketing", "business"):
                labels = {
                    "mastery": "SSU mastery studies",
                    "eq": "emotional intelligence",
                    "research": "research",
                    "marketing": "marketing",
                    "business": "business",
                }
                return gid, labels.get(gid, gid), None

    raise ValueError("no archive route")


def _skip_key_for_study(key: str, head: str, question: str) -> bool:
    if key in _MISLEADING_STUDY_KEYS and _is_ssu_study_question(question):
        return True
    if _is_ssu_study_question(question) and _RESTORATION_LOG_RE.search(head[:2000]):
        return True
    return False


def _list_keys(prefix: str) -> list[str]:
    client = _s3_client()
    bucket = _spaces_bucket()
    keys: list[str] = []
    token: str | None = None
    while True:
        kwargs: dict[str, Any] = {"Bucket": bucket, "Prefix": prefix}
        if token:
            kwargs["ContinuationToken"] = token
        resp = client.list_objects_v2(**kwargs)
        for item in resp.get("Contents") or []:
            key = str(item.get("Key") or "")
            if key and not key.endswith("/"):
                suffix = os.path.splitext(key)[1].lower()
                if suffix in _TEXT_SUFFIXES:
                    keys.append(key)
        if not resp.get("IsTruncated"):
            break
        token = resp.get("NextContinuationToken")
    return sorted(keys)


def _get_text(key: str) -> str:
    client = _s3_client()
    resp = client.get_object(Bucket=_spaces_bucket(), Key=key)
    body = resp["Body"].read(_MAX_OBJECT_BYTES + 1)
    if len(body) > _MAX_OBJECT_BYTES:
        body = body[:_MAX_OBJECT_BYTES]
    return body.decode("utf-8", errors="replace")


def _question_terms(question: str) -> list[str]:
    stop = {
        "a", "an", "the", "is", "are", "was", "what", "who", "how", "when",
        "where", "why", "tell", "me", "about", "nova", "ray", "please", "can",
        "you", "do", "does", "did", "in", "on", "at", "to", "for", "of", "and",
        "or", "my", "i",
    }
    terms: list[str] = []
    for raw in re.findall(r"[a-z0-9]{3,}", (question or "").lower()):
        if raw not in stop:
            terms.append(raw)
    return terms[:24]


def _score_chunk(chunk: str, terms: list[str]) -> int:
    text = chunk.lower()
    return sum(text.count(t) for t in terms)


def _extract_relevant(text: str, question: str, max_chars: int = 1400) -> str:
    terms = _question_terms(question)
    if not terms:
        clipped = re.sub(r"\s+", " ", text.strip())
        return clipped[:max_chars]

    parts = re.split(r"\n(?=#{1,3}\s)", text)
    if len(parts) <= 1:
        parts = re.split(r"\n{2,}", text)

    scored: list[tuple[int, str]] = []
    for part in parts:
        part = part.strip()
        if len(part) < 40:
            continue
        score = _score_chunk(part, terms)
        if score > 0:
            scored.append((score, part))

    if not scored:
        clipped = re.sub(r"\s+", " ", text.strip())
        return clipped[:max_chars]

    scored.sort(key=lambda x: x[0], reverse=True)
    out: list[str] = []
    total = 0
    for _, chunk in scored[:6]:
        chunk = re.sub(r"\s+", " ", chunk.strip())
        if total + len(chunk) > max_chars:
            chunk = chunk[: max_chars - total]
        out.append(chunk)
        total += len(chunk) + 2
        if total >= max_chars:
            break
    return "\n\n".join(out).strip()


async def query_archive(question: str, notebook_group: str | None = None) -> str:
    """Fetch relevant archive text from DO Spaces for a voice answer."""
    if not archive_query_enabled():
        return "Archive lookup is not configured on this worker."

    q = (question or "").strip()
    if len(q) < 4:
        return "Need a clearer question to search the archive."

    ssu = _answer_ssu_study_question(q)
    if ssu:
        logger.info("archive: ssu study answer chars=%d", len(ssu))
        if len(ssu) > _MAX_ANSWER_CHARS:
            ssu = ssu[: _MAX_ANSWER_CHARS - 3].rsplit(" ", 1)[0] + "..."
        return ssu

    try:
        group_id, label, registry_id = resolve_archive_group(q, notebook_group)
    except ValueError:
        if _is_ssu_study_question(q):
            inv = _study_file_inventory()
            logger.info("archive: study fallback inventory")
            return inv
        return (
            "I could not match that to a specific archive folder. "
            "Try asking about a topic area like business, marketing, profile, or fixes."
        )

    prefix = f"{group_id}/"
    try:
        keys = _list_keys(prefix)
    except Exception as e:
        logger.exception("archive: list failed prefix=%s", prefix)
        return f"Could not open archive folder ({label}): {e}"

    if registry_id:
        preferred = f"{group_id}/{registry_id}.md"
        if preferred in keys:
            keys = [preferred] + [k for k in keys if k != preferred]
    else:
        canonical = f"{group_id}/{group_id}.md"
        if canonical in keys:
            keys = [canonical] + [k for k in keys if k != canonical]

    if not keys:
        return f"No text files found in archive folder {label} yet."

    terms = _question_terms(q)
    best_key = keys[0]
    if len(keys) > 1 and terms:
        best_score = -1
        for key in keys[:_MAX_FILES_PER_QUERY]:
            try:
                head = _get_text(key)[:4000]
            except Exception:
                continue
            if _is_corrupt(head):
                continue
            if _skip_key_for_study(key, head, q):
                continue
            score = _score_chunk(head, terms)
            if score > best_score:
                best_score = score
                best_key = key

    try:
        text = _get_text(best_key)
    except Exception as e:
        logger.exception("archive: read failed key=%s", best_key)
        return f"Could not read archive file for {label}: {e}"

    if _is_corrupt(text):
        # Try any non-corrupt file in this folder before giving up.
        for key in keys:
            if key == best_key:
                continue
            try:
                candidate = _get_text(key)
            except Exception:
                continue
            if not _is_corrupt(candidate):
                text = candidate
                best_key = key
                break
        else:
            return (
                f"Archive folder {label} has study files but they contain stale API errors "
                "from before the key was fixed. Ask Ray to run archive cleanup."
            )

    excerpt = _extract_relevant(text, q)
    if not excerpt:
        return f"Found {label} in the archive but nothing matched that question."

    if len(excerpt) > _MAX_ANSWER_CHARS:
        excerpt = excerpt[: _MAX_ANSWER_CHARS - 3].rsplit(" ", 1)[0] + "..."
    logger.info("archive: %s key=%s chars=%d", label, best_key, len(excerpt))
    return excerpt
