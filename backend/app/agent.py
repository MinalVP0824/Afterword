"""
Meeting-to-Action agent.

Pipeline:
  1. Extract   - LLM reads the transcript and returns structured notes
  2. Validate  - rule checks find tasks with a missing/vague owner, deadline or description
  3. Clarify   - the agent creates questions for every problem it found
  4. Update    - user answers are applied, tasks are validated again,
                 and new questions are asked only if something is still unclear
  5. Reflect   - the LLM checks which follow-up points are now settled
                 by the new information and moves them to "resolved"
"""

import re
import uuid
from datetime import date, datetime, timedelta
from typing import List, Optional

import dateparser

from . import llm
from .prompts import FOLLOWUP_PROMPT, SYSTEM_PROMPT, build_followup_prompt, build_user_prompt
from .schemas import Answer, Clarification, Decision, Issue, MeetingResult, ResolvedFollowUp, Task

VAGUE_OWNERS = {
    "someone", "somebody", "anyone", "anybody", "everyone", "everybody", "team", "the team",
    "we", "us", "all", "tbd", "tba", "unknown", "none", "null", "n/a", "na", "they",
}
VAGUE_DEADLINE_WORDS = [
    "soon", "asap", "later", "sometime", "some time", "eventually", "whenever",
    "next few", "at some point", "when possible", "tbd",
]
VAGUE_TASK_PATTERNS = [
    r"^look into\b", r"^check on\b", r"^think about\b", r"^figure out\b",
    r"\bthe thing\b", r"\bstuff\b", r"\betc\b", r"^handle it\b", r"^sort (it|this|that) out\b",
]


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _clean(value) -> Optional[str]:
    if value is None:
        return None
    value = str(value).strip()
    return None if value == "" or value.lower() in {"null", "none", "n/a"} else value


# ---------------------------------------------------------------- 1. Extract

def extract(transcript: str, meeting_date: str) -> dict:
    weekday = date.fromisoformat(meeting_date).strftime("%A")
    return llm.chat_json(SYSTEM_PROMPT, build_user_prompt(transcript, meeting_date, weekday))


def build_result(raw: dict, transcript: str, meeting_date: str, title: Optional[str]) -> MeetingResult:
    tasks: List[Task] = []

    for t in raw.get("tasks") or []:
        description = _clean(t.get("description"))
        if not description:
            continue
        task = Task(
            id=_new_id("task"),
            description=description,
            owner=_clean(t.get("owner")),
            deadline=_clean(t.get("deadline")),
            deadline_text=_clean(t.get("deadline_text")),
            priority=t.get("priority") if t.get("priority") in ("high", "medium", "low") else "medium",
        )
        if t.get("ambiguous"):
            task.ambiguity_note = _clean(t.get("ambiguity_reason")) or "The task does not say clearly what has to be done."
        tasks.append(task)

    decisions = [
        Decision(id=_new_id("dec"), decision=_clean(d.get("decision")), made_by=_clean(d.get("made_by")))
        for d in raw.get("decisions") or []
        if isinstance(d, dict) and _clean(d.get("decision"))
    ]

    result = MeetingResult(
        id=_new_id("mtg"),
        title=title or _clean(raw.get("title")) or "Untitled meeting",
        meeting_date=meeting_date,
        created_at=datetime.now().isoformat(timespec="seconds"),
        participants=[p for p in (_clean(x) for x in raw.get("participants") or []) if p],
        summary=_clean(raw.get("summary")) or "",
        key_points=[k for k in (_clean(x) for x in raw.get("key_points") or []) if k],
        decisions=decisions,
        tasks=tasks,
        follow_ups=[f for f in (_clean(x) for x in raw.get("follow_ups") or []) if f],
        transcript=transcript,
    )

    for task in result.tasks:
        validate_task(task, meeting_date)
    result.clarifications = build_clarifications(result)
    return result


# ---------------------------------------------------------------- 2. Validate

WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def parse_deadline(text: str, meeting_date: str) -> Optional[str]:
    """Turn 'Friday', 'next Monday', '28 Oct', '2026-10-30' into YYYY-MM-DD."""
    text = text.strip()
    try:
        return date.fromisoformat(text).isoformat()
    except ValueError:
        pass

    start = date.fromisoformat(meeting_date)
    cleaned = re.sub(r"^(by|on|before|till|until|latest by)\s+", "", text.lower()).strip(" .")

    # "Friday", "this Friday", "next Friday" -> the first such day after the meeting
    m = re.fullmatch(r"(?:this |next |coming )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", cleaned)
    if m:
        days_ahead = (WEEKDAYS.index(m.group(1)) - start.weekday()) % 7 or 7
        return (start + timedelta(days=days_ahead)).isoformat()
    if cleaned in ("tomorrow", "tmrw"):
        return (start + timedelta(days=1)).isoformat()
    if cleaned in ("end of the week", "end of week", "eow", "this week"):
        return (start + timedelta(days=(4 - start.weekday()) % 7)).isoformat()
    if cleaned in ("end of the month", "end of month", "eom", "this month"):
        next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        return (next_month - timedelta(days=1)).isoformat()

    base = datetime.combine(start, datetime.min.time())
    parsed = dateparser.parse(
        cleaned,
        settings={
            "RELATIVE_BASE": base,
            "PREFER_DATES_FROM": "future",
            "DATE_ORDER": "DMY",
            "TIMEZONE": "UTC",
            "RETURN_AS_TIMEZONE_AWARE": False,
        },
    )
    return parsed.date().isoformat() if parsed else None


def validate_task(task: Task, meeting_date: str) -> Task:
    issues: List[Issue] = []

    # Owner
    if not task.owner:
        issues.append(Issue(field="owner", message="No one was assigned to this task."))
    elif task.owner.lower() in VAGUE_OWNERS:
        issues.append(Issue(field="owner", message=f'"{task.owner}" is not a specific person.'))

    # Deadline
    if task.deadline:
        try:
            d = date.fromisoformat(task.deadline)
            if d < date.fromisoformat(meeting_date):
                issues.append(Issue(field="deadline", message="The deadline is before the meeting date."))
        except ValueError:
            resolved = parse_deadline(task.deadline, meeting_date)
            if resolved:
                task.deadline = resolved
            else:
                issues.append(Issue(field="deadline", message=f'"{task.deadline}" is not a valid date.'))
                task.deadline = None
    else:
        spoken = (task.deadline_text or "").lower()
        if spoken and any(w in spoken for w in VAGUE_DEADLINE_WORDS):
            issues.append(Issue(field="deadline", message=f'The deadline "{task.deadline_text}" is too vague.'))
        elif spoken:
            issues.append(Issue(field="deadline", message=f'"{task.deadline_text}" could not be converted to a date.'))
        else:
            issues.append(Issue(field="deadline", message="No deadline was mentioned."))

    # Description
    desc = task.description.lower().strip()
    if task.ambiguity_note:
        issues.append(Issue(field="description", message=task.ambiguity_note))
    elif len(desc.split()) < 3 or any(re.search(p, desc) for p in VAGUE_TASK_PATTERNS):
        issues.append(Issue(field="description", message="The task does not say clearly what has to be done."))

    task.issues = issues
    task.status = "needs_clarification" if issues else "ready"
    return task


# ---------------------------------------------------------------- 3. Clarify

def make_question(task: Task, field: str) -> str:
    what = f'"{task.description}"'
    if field == "owner":
        return f"Who is responsible for {what}?"
    if field == "deadline":
        if task.deadline_text:
            return f'{what} was given the deadline "{task.deadline_text}". What is the exact date?'
        return f"By when should {what} be completed?"
    return f"{what} is unclear. What exactly needs to be done?"


def build_clarifications(result: MeetingResult) -> List[Clarification]:
    """Keep answered questions as history and add one open question per current issue."""
    history = [c for c in result.clarifications if c.answered]
    open_keys = {(c.task_id, c.field) for c in result.clarifications if not c.answered}
    existing_open = {(c.task_id, c.field): c for c in result.clarifications if not c.answered}

    new_open = []
    for task in result.tasks:
        for issue in task.issues:
            key = (task.id, issue.field)
            if key in open_keys:
                new_open.append(existing_open[key])
            else:
                new_open.append(Clarification(
                    id=_new_id("clr"), task_id=task.id, field=issue.field,
                    question=make_question(task, issue.field),
                ))
                open_keys.add(key)
    return history + new_open


# ---------------------------------------------------------------- 4. Update

def apply_answers(result: MeetingResult, answers: List[Answer]) -> MeetingResult:
    by_id = {c.id: c for c in result.clarifications}
    tasks = {t.id: t for t in result.tasks}
    updates = []  # plain-English list of what changed, used in step 5

    for a in answers:
        clr = by_id.get(a.clarification_id)
        if not clr or clr.answered or clr.task_id not in tasks:
            continue
        task = tasks[clr.task_id]
        value = a.answer.strip()

        if clr.field == "owner":
            task.owner = value
        elif clr.field == "deadline":
            parsed = parse_deadline(value, result.meeting_date)
            task.deadline_text = value
            task.deadline = parsed
        elif clr.field == "description":
            task.description = value
            task.ambiguity_note = None  # the user has explained it now

        clr.answered = True
        clr.answer = value
        updates.append(f'{clr.question} Answer: "{value}"')

    # Validate every task again with the new information
    for task in result.tasks:
        validate_task(task, result.meeting_date)

    result.clarifications = build_clarifications(result)
    return refresh_follow_ups(result, updates)


def update_task(result: MeetingResult, task_id: str, changes: dict) -> MeetingResult:
    task = next((t for t in result.tasks if t.id == task_id), None)
    if task is None:
        raise KeyError(task_id)
    changed = {k: v for k, v in changes.items() if v is not None}
    for key, value in changed.items():
        if key == "deadline":
            task.deadline = parse_deadline(value, result.meeting_date)
            task.deadline_text = value
        elif key == "description":
            task.description = value.strip()
            task.ambiguity_note = None
        else:
            setattr(task, key, value.strip() if isinstance(value, str) else value)
    validate_task(task, result.meeting_date)
    # Drop open questions that the manual edit has already fixed
    still_open = {(task.id, i.field) for i in task.issues}
    result.clarifications = [
        c for c in result.clarifications
        if c.answered or c.task_id != task.id or (c.task_id, c.field) in still_open
    ]
    result.clarifications = build_clarifications(result)
    if not changed:
        return result
    edits = ", ".join(f"{k} set to {v}" for k, v in changed.items())
    return refresh_follow_ups(result, [f'Task "{task.description}" was edited by hand: {edits}'])


# ---------------------------------------------------------------- 5. Reflect

def refresh_follow_ups(result: MeetingResult, updates: List[str]) -> MeetingResult:
    """Ask the LLM which follow-up points the new information has settled."""
    if not result.follow_ups or not updates:
        return result
    try:
        raw = llm.chat_json(FOLLOWUP_PROMPT, build_followup_prompt(result.follow_ups, result.tasks, updates))
    except llm.LLMError:
        return result  # not critical, so keep the list as it is

    resolved = {}
    for item in raw.get("resolved") or []:
        if not isinstance(item, dict):
            continue
        idx = item.get("index")
        if isinstance(idx, str) and idx.strip().isdigit():
            idx = int(idx)
        if isinstance(idx, int) and 0 <= idx < len(result.follow_ups):
            resolved[idx] = _clean(item.get("reason")) or "Settled by the new information."

    for idx in sorted(resolved, reverse=True):
        text = result.follow_ups.pop(idx)
        result.resolved_follow_ups.append(ResolvedFollowUp(text=text, reason=resolved[idx]))
    return result


# ---------------------------------------------------------------- Entry point

def analyze(transcript: str, meeting_date: Optional[str] = None, title: Optional[str] = None) -> MeetingResult:
    meeting_date = meeting_date or date.today().isoformat()
    date.fromisoformat(meeting_date)  # raises ValueError if the format is wrong
    raw = extract(transcript, meeting_date)
    return build_result(raw, transcript, meeting_date, title)