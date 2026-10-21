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


def get_meeting(meeting_id: str, user_id: str) -> Optional[MeetingResult]:
    """Returns the meeting only if it belongs to this user."""
    with _lock:
        item = _load().get(meeting_id)
    if not item or item.get("user_id") != user_id:
        return None
    return MeetingResult(**item)


def list_meetings(user_id: str) -> List[MeetingResult]:
    with _lock:
        data = _load()
    meetings = [MeetingResult(**m) for m in data.values() if m.get("user_id") == user_id]
    return sorted(meetings, key=lambda m: m.created_at, reverse=True)


def delete_meeting(meeting_id: str, user_id: str) -> bool:
    with _lock:
        data = _load()
        item = data.get(meeting_id)
        if not item or item.get("user_id") != user_id:
            return False
        del data[meeting_id]
        _save(data)
        return True


def claim_unowned_meetings(user_id: str) -> int:
    """Meetings saved before login existed have no owner. Give them to the first account."""
    with _lock:
        data = _load()
        count = 0
        for item in data.values():
            if not item.get("user_id"):
                item["user_id"] = user_id
                count += 1
        if count:
            _save(data)
        return count