"""Append subjects to SSU business curriculum (local file + optional Spaces sync)."""
from __future__ import annotations

import logging
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger("syllabus")


def _repo_root() -> Path:
    here = Path(__file__).resolve().parent
    if (here / "nova-data").is_dir():
        return here
    return here.parent


REPO = _repo_root()
DEFAULT_BUSINESS_PATH = REPO / "nova-data" / "library" / "SSU_Business_Courses.md"
DEFAULT_ARCHIVE_PATH = REPO / "Syllabus_Archive.md"
STAGE_HEADER = "## Stage 7 — Nova Elite & Market Reality (Ray-direct)"


def _business_path() -> Path:
    raw = (os.getenv("NOVA_SSU_BUSINESS_PATH") or "").strip()
    return Path(raw) if raw else DEFAULT_BUSINESS_PATH


def _normalize(subject: str) -> str:
    s = re.sub(r"\s+", " ", subject.strip())
    if not s:
        raise ValueError("Subject cannot be empty.")
    if not s.startswith("- "):
        s = f"- {s}"
    return s


def _existing_bullets(text: str) -> set[str]:
    return {line.strip().lower() for line in text.splitlines() if line.strip().startswith("- ")}


def append_business_subject(subject: str, *, section: str = STAGE_HEADER) -> str:
    """Append one bullet to SSU business courses if not already present."""
    line = _normalize(subject)
    path = _business_path()
    if not path.is_file():
        raise FileNotFoundError(f"SSU business curriculum not found: {path}")

    text = path.read_text(encoding="utf-8")
    if line.lower() in _existing_bullets(text):
        return f"Already on the syllabus: {line[2:]}"

    if section not in text:
        text = text.rstrip() + f"\n\n{section}\n> Ray-directed topics tied to Nova Elite, SaaS go-to-market, and the moving AI stack.\n"
    text = text.rstrip() + "\n" + line + "\n"
    path.write_text(text, encoding="utf-8")

    archive = Path(os.getenv("NOVA_SYLLABUS_ARCHIVE") or DEFAULT_ARCHIVE_PATH)
    try:
        stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with archive.open("a", encoding="utf-8") as f:
            f.write(f"- [{stamp}] added business subject: {line[2:]}\n")
    except OSError as e:
        logger.warning("syllabus archive append failed: %s", e)

    _try_spaces_push(path)
    return f"Added to SSU business syllabus: {line[2:]}"


def _try_spaces_push(local: Path) -> None:
    script = REPO / "scripts" / "spaces_schooling.py"
    if not script.is_file():
        return
    py = os.getenv("NOVA_PYTHON") or sys.executable
    try:
        subprocess.run(
            [py, str(script), "push", str(local), "SSU_Business_Courses.md"],
            cwd=str(REPO),
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as e:
        logger.warning("Spaces curriculum push skipped: %s", e)
