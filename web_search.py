"""Live web lookup for Nova voice (Tavily)."""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger("web_search")

_MAX_ANSWER_CHARS = 1400
_MAX_SNIPPET_CHARS = 320
_TIMEOUT = 25.0


def web_search_enabled() -> bool:
    flag = (os.getenv("NOVA_WEB_SEARCH") or "1").strip().lower()
    if flag in ("0", "false", "no", "off"):
        return False
    return bool((os.getenv("TAVILY_API_KEY") or "").strip())


def _api_key() -> str:
    return (os.getenv("TAVILY_API_KEY") or "").strip()


async def query_web(question: str) -> str:
    """Search the live web and return a voice-friendly text block."""
    key = _api_key()
    if not key:
        return "Web search is not configured on the server."

    q = (question or "").strip()
    if not q:
        return "I need a question to search for."

    payload = {
        "api_key": key,
        "query": q,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 4,
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post("https://api.tavily.com/search", json=payload)
    except httpx.TimeoutException:
        logger.warning("web_search: timeout for %r", q[:80])
        return "The web search timed out. Try a shorter question."
    except Exception as e:
        logger.warning("web_search: request failed: %s", e)
        return "I couldn't reach the search service just now."

    if resp.status_code >= 400:
        logger.warning("web_search: HTTP %s %s", resp.status_code, resp.text[:200])
        return "Web search failed on the server."

    data = resp.json()
    parts: list[str] = []

    answer = (data.get("answer") or "").strip()
    if answer:
        parts.append(answer[:_MAX_ANSWER_CHARS])

    for hit in data.get("results") or []:
        if not isinstance(hit, dict):
            continue
        title = (hit.get("title") or "").strip()
        content = (hit.get("content") or "").strip()
        if not content:
            continue
        snippet = content[:_MAX_SNIPPET_CHARS]
        if title:
            parts.append(f"{title}: {snippet}")
        else:
            parts.append(snippet)
        if sum(len(p) for p in parts) >= _MAX_ANSWER_CHARS:
            break

    if not parts:
        return "I searched but didn't get useful results for that."

    text = "\n\n".join(parts)
    return text[: _MAX_ANSWER_CHARS + 400]
