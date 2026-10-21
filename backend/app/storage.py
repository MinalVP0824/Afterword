"""Simple JSON file storage. This is the agent's long-term memory of past meetings."""

import json
import os
import threading
from typing import Dict, List, Optional

from . import config
from .schemas import MeetingResult

_lock = threading.Lock()


def _load() -> Dict[str, dict]:
    if not os.path.exists(config.DATA_FILE):
        return {}
    with open(config.DATA_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def _save(data: Dict[str, dict]) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(config.DATA_FILE)), exist_ok=True)
    tmp = config.DATA_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, config.DATA_FILE)


def save_meeting(meeting: MeetingResult) -> None:
    with _lock:
        data = _load()
        data[meeting.id] = meeting.model_dump()
        _save(data)


def get_meeting(meeting_id: str) -> Optional[MeetingResult]:
    with _lock:
        item = _load().get(meeting_id)
    return MeetingResult(**item) if item else None


def list_meetings() -> List[MeetingResult]:
    with _lock:
        data = _load()
    meetings = [MeetingResult(**m) for m in data.values()]
    return sorted(meetings, key=lambda m: m.created_at, reverse=True)


def delete_meeting(meeting_id: str) -> bool:
    with _lock:
        data = _load()
        if meeting_id not in data:
            return False
        del data[meeting_id]
        _save(data)
        return True