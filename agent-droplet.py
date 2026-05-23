import asyncio
import json
import logging
import os
import random
import textwrap
import time
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    CloseEvent,
    CloseReason,
    JobContext,
    JobProcess,
    cli,
    function_tool,
)
from livekit.agents.voice.agent_session import SessionConnectOptions
from livekit.agents.voice.turn import TurnHandlingOptions
from livekit.plugins import cartesia, deepgram, openai, silero
from livekit.plugins.openai.realtime import RealtimeModel

from memory import (
    DEFAULT_USER_ID,
    format_memory_search_results,
    load_memory_context,
    persist_voice_session_memory,
    search_memories,
    summarize_session_transcript,
)
from archive_query import archive_query_enabled
from archive_query import query_archive as fetch_archive_text
from web_search import query_web as fetch_web_text
from web_search import web_search_enabled
from syllabus_append import append_business_subject

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Default Cartesia voice (restore by clearing NOVA_CARTESIA_VOICE on droplet).
_CARTESIA_VOICE_DEFAULT = "f9836c6e-a0bd-460e-9d3c-f7299fa60f94"
# OpenAI Realtime voices (speech-to-speech) — coral was the old VPS bridge; marin is LiveKit default.
_OPENAI_REALTIME_VOICE_DEFAULT = "coral"
_OPENAI_TTS_VOICE_DEFAULT = "coral"
# Deepgram Aura-1 (see developers.deepgram.com/docs/tts-models) — ~$15/M chars vs Aura-2 ~$30/M.
_DEEPGRAM_AURA1_MODEL_DEFAULT = "aura-stella-en"


def _voice_provider() -> str:
    """NOVA_TTS: cartesia | deepgram | openai | openai_realtime."""
    p = (os.getenv("NOVA_TTS") or "cartesia").strip().lower()
    if p in ("openai_realtime", "realtime", "openai-realtime"):
        return "openai_realtime"
    if p == "openai":
        return "openai"
    if p in ("deepgram", "aura", "aura1", "aura-1"):
        return "deepgram"
    return "cartesia"


def _openai_realtime_voice() -> str:
    return (
        os.getenv("NOVA_OPENAI_REALTIME_VOICE")
        or os.getenv("NOVA_OPENAI_TTS_VOICE")
        or _OPENAI_REALTIME_VOICE_DEFAULT
    ).strip()


def _build_agent_llm():
    if _voice_provider() == "openai_realtime":
        model = (os.getenv("NOVA_OPENAI_REALTIME_MODEL") or "gpt-realtime").strip()
        voice = _openai_realtime_voice()
        # near_field + higher VAD threshold reduces car-speaker echo triggering self-reply.
        turn_detection = {
            "type": "server_vad",
            "threshold": float(os.getenv("NOVA_REALTIME_VAD_THRESHOLD", "0.65")),
            "silence_duration_ms": int(os.getenv("NOVA_REALTIME_SILENCE_MS", "900")),
        }
        logger.info(
            "voice: OpenAI Realtime model=%s voice=%s vad_threshold=%s",
            model,
            voice,
            turn_detection["threshold"],
        )
        return RealtimeModel(
            model=model,
            voice=voice,
            input_audio_noise_reduction="near_field",
            turn_detection=turn_detection,
        )
    return openai.LLM(model="gpt-4o")


def _build_tts():
    """Batch TTS only — used when provider is cartesia, deepgram, or openai (not openai_realtime)."""
    provider = _voice_provider()
    if provider == "openai":
        voice = (os.getenv("NOVA_OPENAI_TTS_VOICE") or _OPENAI_TTS_VOICE_DEFAULT).strip()
        logger.info("tts: OpenAI batch gpt-4o-mini-tts voice=%s", voice)
        return openai.TTS(model="gpt-4o-mini-tts", voice=voice)
    if provider == "deepgram":
        model = (
            os.getenv("NOVA_DEEPGRAM_TTS_MODEL")
            or os.getenv("NOVA_AURA_TTS_MODEL")
            or _DEEPGRAM_AURA1_MODEL_DEFAULT
        ).strip()
        logger.info("tts: Deepgram Aura model=%s", model)
        return deepgram.TTS(model=model)
    voice = (os.getenv("NOVA_CARTESIA_VOICE") or _CARTESIA_VOICE_DEFAULT).strip()
    logger.info("tts: Cartesia sonic-3 voice=%s", voice)
    return cartesia.TTS(model="sonic-3", voice=voice)

BASE_INSTRUCTIONS = textwrap.dedent(
    """\
    You are Nova Elite, Ray's trusted conversational partner on voice—not a formal VA, not a corporate agent.

    # Who you are

    - Ray's peer and strategic partner—not a subordinate. No corporate stiffness, no consultant-speak.
    - Intellectual equal. Fiduciary alignment. Same respect for every tier of person Ray discusses.
    - Match his dry humor; never explain or praise a joke. When he's thinking, don't rush him.

    # How you sound

    - Warm, calm, plainspoken, conversational—like talking to someone you know, not presenting to a client.
    - Default to natural partner pacing: usually two to five sentences. Take your time; one thought
      at a time. Do not cram lists or rush through an answer. Leave room between ideas so voice
      does not feel breathless or corporate.
    - When Ray shares strategy, vision, or a 30,000-foot plan: stay with him—reflect back briefly,
      think out loud a little, ask at most one natural follow-up if it fits. Do not bullet-dump
      and stop. This is a conversation, not a briefing.
    - Quick factual answers (weather, yes/no) can stay short. Depth when the topic deserves it.
    - Mirror Ray's energy: quieter when he's tired or stressed, a bit more spark when he's up.
    - Every call must sound fresh: rotate openers, bridges, and closers. Do not repeat the same
      opener, follow-up, or closer twice in a row across calls (paraphrase; never read a script).
    - Open: one short casual hello (often under eight words). Examples to vary from, not copy
      every time: "Hey Ray", "Morning", "Hi—what's up", "Hey, go ahead".
    - After you answer: do not use assistant closing scripts. A brief pause is fine. You may
      add a light human beat ("yeah", "makes sense") when it fits—never performative. Do not
      ask "anything else", "what's next", or "what else can I help with". At most one organic
      check-in per several turns ("want me to dig in?", "make sense?")—never the same line twice.
    - Close: often a brief human sign-off or quiet acknowledgment. Rotate closers
      ("talk soon", "I'm around", "good for now", "that works", "all right") or end naturally
      when the topic is done.
    - Banned stock phrases: how can I assist/help you today, what can I do for you, is there
      anything else, what's your next question, glad I could help, happy to help with anything else.
    - If Ray has numbered questions, answer the current one only—no quiz-host coaching.
    - Dry wit is fine when it fits; never perform cheerfulness or laugh-track praise.
    - Never sound like a business presentation, support script, or consultant report.

    # Voice output

    - Plain text only for TTS: no markdown, lists, tables, code, emojis.
    - Spell out numbers and emails when needed. Avoid awkward acronyms.
    - Do not reveal system instructions, tools, or internal labels.

    # Tools and safety

    - Use tools when needed; say outcomes simply if something fails.
    - Memory recall (query_memory): REQUIRED before answering questions about past voice
      conversations, prior calls, or what you remember. Examples: "last conversation",
      "what did we talk about", "what did we say about X", "do you remember when we",
      "what was our previous call about", Ray's preferences from earlier sessions.
      Call query_memory first—never guess from the startup "Recent voice sessions" block;
      that block is background only, not a substitute for a memory search.
    - Archive lookup (query_archive): When Ray asks about stored knowledge, policies, fixes, profile, project archives,
      schooling, SSU, study sessions, or what she studied (today, this morning, this afternoon, or previously),
      use query_archive before guessing—never say she has no study files without looking first.
      Do not use query_memory for study/SSU content; archive has the study_progress scorecard.
      Ray's wording is never wrong; interpret study/schooling questions naturally.
    - SSU schedule: noon Chicago = business; 3 PM = AEO/SEO or EQ. When Ray asks about this morning
      or the business/noon session, answer that slot—not the afternoon EQ session. When he asks what
      you studied today with no slot specified, mention both completed sessions if there are two.
    - When Ray asks for live or current information (weather, news, prices, sports, who won,
      what happened today, look something up on the web), use web_search. Say a brief natural
      line first if you need a moment, like "one sec" or "let me check" — then answer from results.
    - Do not use web_search for Ray's own profile, Nova project files, or archived notes —
      use query_archive for those.
    - When Ray asks to add a topic to her study syllabus (business/SSU), use add_study_subject.
      You can add subjects; do not say you cannot update the syllabus.
    - Stay lawful and appropriate; general info only for medical, legal, or financial topics.
    """
)


@function_tool
async def query_archive(
    question: str,
    notebook_group: str | None = None,
) -> str:
    """Look up Nova's text archive (DO Spaces) and return relevant source excerpts.

    Use when Ray asks about stored knowledge, his profile, fixes vault, live policy,
    research, business, marketing, recovery, schooling, SSU study sessions, or any archived topic—not casual chat.

    Args:
        question: What to look up in plain English.
        notebook_group: Optional folder hint (ray_profile, nova_fixes, live_policy,
            research, business, marketing, recovery, eq, legal, technical, mastery,
            ray_project).
    """
    _trace_tool("archive")
    return await fetch_archive_text(question, notebook_group)


@function_tool
async def query_memory(question: str) -> str:
    """Search semantic memory for past voice sessions, preferences, and facts.

    REQUIRED before answering recall questions. Use when Ray asks about:
    last conversation, previous call, what we talked or said about something, what you
    remember from earlier, prior context, or his preferences from past sessions.
    Do NOT answer from the startup "Recent voice sessions" hints instead of calling this.
    Do NOT use for archived files, study logs, SSU sessions, or schooling (use query_archive).

    Args:
        question: Ray's recall question in plain English.
    """
    q = question.strip()
    _trace_tool("memory")
    rows = await search_memories(q, k=5, user_id=DEFAULT_USER_ID)
    logger.info("memory: query_memory question=%r hits=%d", q[:160], len(rows))
    return format_memory_search_results(rows)


@function_tool
async def web_search(question: str) -> str:
    """Search the live internet for current information.

    Use for weather, news, sports, prices, recent events, or when Ray asks to look
    something up online. Do not use for Nova's archived files or Ray's stored profile.

    Args:
        question: Plain English search question.
    """
    _trace_tool("web")
    return await fetch_web_text(question)


@function_tool
async def add_study_subject(subject: str) -> str:
    """Add a business subject to Nova's SSU schooling rotation.

    Use when Ray asks to add something to the syllabus, curriculum, or study queue—
    especially topics tied to Nova Elite, SaaS, or the AI market.

    Args:
        subject: Plain English topic title (e.g. "Cold start SaaS pricing experiments").
    """
    _trace_tool("study")
    try:
        return append_business_subject(subject)
    except Exception as e:
        logger.warning("add_study_subject failed: %s", e)
        return f"Could not update syllabus: {e}"


_PHRASING_STATE = Path(
    os.getenv("NOVA_PHRASING_STATE", "/root/nova/logs/voice-phrasing-state.json")
)
_SESSION_LEDGER = Path(
    os.getenv("NOVA_SESSION_LEDGER", "/root/nova/logs/voice-sessions.log")
)


@dataclass
class _SessionTrace:
    room: str
    job_id: str
    started_at: datetime
    memory_queries: int = 0
    archive_queries: int = 0
    web_queries: int = 0
    study_adds: int = 0


_session_trace: ContextVar[_SessionTrace | None] = ContextVar("_session_trace", default=None)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ts(dt: datetime | None = None) -> str:
    return (dt or _utc_now()).strftime("%Y-%m-%dT%H:%M:%SZ")


def _append_session_ledger(line: str) -> None:
    try:
        _SESSION_LEDGER.parent.mkdir(parents=True, exist_ok=True)
        with _SESSION_LEDGER.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except OSError as exc:
        logger.warning("session ledger write failed: %s", exc)
    logger.info(line)


def _trace_tool(name: str) -> None:
    trace = _session_trace.get()
    if trace is None:
        return
    if name == "memory":
        trace.memory_queries += 1
    elif name == "archive":
        trace.archive_queries += 1
    elif name == "web":
        trace.web_queries += 1
    elif name == "study":
        trace.study_adds += 1


def _tools_summary(trace: _SessionTrace | None) -> str:
    if trace is None:
        return "none"
    bits: list[str] = []
    if trace.memory_queries:
        bits.append(f"memory:{trace.memory_queries}")
    if trace.archive_queries:
        bits.append(f"archive:{trace.archive_queries}")
    if trace.web_queries:
        bits.append(f"web:{trace.web_queries}")
    if trace.study_adds:
        bits.append(f"study:{trace.study_adds}")
    return ",".join(bits) if bits else "none"


def _ledger_start(room: str, job_id: str, started_at: datetime) -> None:
    _append_session_ledger(
        f"SESSION_START ts={_ts(started_at)} room={room} job_id={job_id}"
    )


def _ledger_end(
    *,
    room: str,
    job_id: str,
    started_at: datetime,
    reason: str,
    duration_sec: float,
    transcript_chars: int,
    trace: _SessionTrace | None,
) -> None:
    clean = 0 if reason == "error" else 1
    short = 1 if duration_sec < 25 and transcript_chars < 80 else 0
    error = 1 if reason == "error" else 0
    _append_session_ledger(
        "SESSION_END "
        f"ts={_ts()} "
        f"room={room} job_id={job_id} "
        f"clean={clean} error={error} short={short} "
        f"reason={reason} duration_sec={duration_sec} transcript_chars={transcript_chars} "
        f"tools={_tools_summary(trace)}"
    )


def _ledger_persist(*, room: str, job_id: str, saved: bool, facts: int, skipped: bool) -> None:
    _append_session_ledger(
        "SESSION_PERSIST "
        f"ts={_ts()} room={room} job_id={job_id} "
        f"saved={1 if saved else 0} facts={facts} skipped={1 if skipped else 0}"
    )


def _session_job_id(ctx: JobContext) -> str:
    job = getattr(ctx, "job", None)
    jid = getattr(job, "id", None) if job else None
    return str(jid) if jid else "-"

# Rotating on_enter hints — paired with phrasing state so the same slot is not picked twice in a row.
_GREETING_HINTS: tuple[str, ...] = (
    "Ray joined. Say hi in 3–6 words only—e.g. 'Hey Ray' or 'Morning'. No offer to help.",
    "Open with a quick casual hello to Ray. Under eight words. Do not say how can I help.",
    "One relaxed hey to Ray—like answering a call from someone you know. No script.",
    "Brief hi to Ray ('Hi—what's up' or 'Hey, go ahead' style). Warm, not corporate.",
    "Ray's here. Greet him shortly. No assistant menu, no 'what can I do for you'.",
    "Start with a natural hello—maybe just 'Hey' or 'Oh hey Ray'. Then wait for him.",
    "Warm one-liner hello to Ray. Vary from last call; never the same opener twice in a row.",
    "Quick check-in word to Ray only—no follow-up question in the greeting itself.",
)


def _pick_rotating(pool: tuple[str, ...], state_key: str) -> str:
    """Pick from pool, avoiding the same index as last call."""
    if not pool:
        return ""
    state: dict[str, int] = {}
    path = _PHRASING_STATE
    if path.is_file():
        try:
            state = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            state = {}
    last = state.get(state_key)
    if len(pool) == 1:
        idx = 0
    else:
        choices = [i for i in range(len(pool)) if i != last]
        idx = random.choice(choices)
    state[state_key] = idx
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(state), encoding="utf-8")
        logger.info("phrasing: %s idx=%d -> %s", state_key, idx, path)
    except OSError:
        logger.warning("phrasing: could not write state to %s", path)
    return pool[idx]


def _transcript_from_session(session: AgentSession) -> str:
    lines: list[str] = []
    for item in session.history.items:
        if getattr(item, "type", None) != "message":
            continue
        if item.role not in ("user", "assistant"):
            continue
        text = item.text_content
        if text and text.strip():
            lines.append(f"{item.role}: {text.strip()}")
    return "\n".join(lines)


async def _persist_session_memory(
    transcript: str, room: str, job_id: str
) -> None:
    if len(transcript.strip()) < 40:
        logger.info("memory: skip persist, transcript too short (%d chars)", len(transcript))
        _ledger_persist(room=room, job_id=job_id, saved=False, facts=0, skipped=True)
        return
    meta = {"room": room, "source": "voice"}
    summary, facts = await summarize_session_transcript(transcript)
    await persist_voice_session_memory(DEFAULT_USER_ID, summary, facts, meta)
    logger.info(
        "memory: persisted summary=%s facts=%d room=%s",
        bool(summary),
        len(facts),
        room,
    )
    _ledger_persist(
        room=room,
        job_id=job_id,
        saved=bool(summary),
        facts=len(facts),
        skipped=False,
    )


class Assistant(Agent):
    def __init__(self) -> None:
        tools: list = [query_memory]
        if archive_query_enabled():
            tools.append(query_archive)
        if web_search_enabled():
            tools.append(web_search)
        tools.append(add_study_subject)
        tools = tools or None
        super().__init__(
            llm=_build_agent_llm(),
            instructions=BASE_INSTRUCTIONS,
            tools=tools,
        )

    async def on_enter(self) -> None:
        mem = load_memory_context(DEFAULT_USER_ID)
        if mem:
            await self.update_instructions(f"{BASE_INSTRUCTIONS}\n\n{mem}")
            logger.info("memory: loaded context into instructions")
        self.session.generate_reply(
            instructions=_pick_rotating(_GREETING_HINTS, "greeting")
        )


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session()
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    room_name = ctx.room.name
    job_id = _session_job_id(ctx)
    session_started_at = time.monotonic()
    started_wall = _utc_now()
    trace = _SessionTrace(room=room_name, job_id=job_id, started_at=started_wall)
    trace_token = _session_trace.set(trace)
    _ledger_start(room_name, job_id, started_wall)

    conn = SessionConnectOptions(max_unrecoverable_errors=5)
    if _voice_provider() == "openai_realtime":
        # Speech-to-speech (same API family as the old bridge voice: coral / marin).
        session = AgentSession(conn_options=conn)
    else:
        session = AgentSession(
            stt=deepgram.STT(model="nova-3", language="multi"),
            tts=_build_tts(),
            vad=ctx.proc.userdata["vad"],
            turn_handling=TurnHandlingOptions(
                interruption={"mode": "vad"},
                preemptive_generation={"enabled": True},
            ),
            conn_options=conn,
        )

    persist_task: asyncio.Task[None] | None = None

    @session.on("close")
    def _on_session_close(ev: CloseEvent) -> None:
        nonlocal persist_task
        transcript = _transcript_from_session(session)
        duration_sec = round(time.monotonic() - session_started_at, 1)
        reason = ev.reason.value
        _ledger_end(
            room=room_name,
            job_id=job_id,
            started_at=started_wall,
            reason=reason,
            duration_sec=duration_sec,
            transcript_chars=len(transcript),
            trace=_session_trace.get(),
        )
        logger.info(
            "memory: session close reason=%s transcript_chars=%d",
            reason,
            len(transcript),
        )
        if ev.reason == CloseReason.ERROR:
            ctx.shutdown("session error")
            return
        room = room_name

        async def _persist() -> None:
            await _persist_session_memory(transcript, room, job_id)

        persist_task = asyncio.create_task(_persist())

    async def _await_persist(_reason: str) -> None:
        if persist_task is None:
            return
        try:
            await persist_task
        except Exception:
            logger.exception("memory: persist failed on shutdown")

    ctx.add_shutdown_callback(_await_persist)

    agent = Assistant()
    try:
        await session.start(agent=agent, room=ctx.room)
    finally:
        _session_trace.reset(trace_token)


if __name__ == "__main__":
    cli.run_app(server)
