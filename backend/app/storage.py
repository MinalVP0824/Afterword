"""
Meeting storage. This is the agent's long-term memory of past meetings.

Uses MongoDB when MONGODB_URI is set (deployed), otherwise a local JSON file.
"""

import json
import os
import threading
from typing import Dict, List, Optional

from . import config
from .db import get_db
from .schemas import MeetingResult

_lock = threading.Lock()
NO_ID = {"_id": 0}  # leave out MongoDB's internal id when reading


# ---------------------------------------------------------------- local JSON file

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


# ---------------------------------------------------------------- public functions

def save_meeting(meeting: MeetingResult) -> None:
    doc = meeting.model_dump()
    db = get_db()
    if db is not None:
        db.meetings.replace_one({"_id": meeting.id}, {**doc, "_id": meeting.id}, upsert=True)
        return
    with _lock:
        data = _load()
        data[meeting.id] = doc
        _save(data)


def get_meeting(meeting_id: str, user_id: str) -> Optional[MeetingResult]:
    """Returns the meeting only if it belongs to this user."""
    db = get_db()
    if db is not None:
        item = db.meetings.find_one({"_id": meeting_id, "user_id": user_id}, NO_ID)
        return MeetingResult(**item) if item else None
    with _lock:
        item = _load().get(meeting_id)
    if not item or item.get("user_id") != user_id:
        return None
    return MeetingResult(**item)


def list_meetings(user_id: str) -> List[MeetingResult]:
    db = get_db()
    if db is not None:
        items = db.meetings.find({"user_id": user_id}, NO_ID).sort("created_at", -1)
        return [MeetingResult(**m) for m in items]
    with _lock:
        data = _load()
    meetings = [MeetingResult(**m) for m in data.values() if m.get("user_id") == user_id]
    return sorted(meetings, key=lambda m: m.created_at, reverse=True)


def delete_meeting(meeting_id: str, user_id: str) -> bool:
    db = get_db()
    if db is not None:
        return db.meetings.delete_one({"_id": meeting_id, "user_id": user_id}).deleted_count == 1
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
    db = get_db()
    if db is not None:
        return db.meetings.update_many({"user_id": None}, {"$set": {"user_id": user_id}}).modified_count
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