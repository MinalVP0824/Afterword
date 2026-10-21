"""MongoDB connection, used only when MONGODB_URI is set in .env."""

from typing import Optional

from pymongo import ASCENDING, MongoClient
from pymongo.database import Database

from . import config

_db: Optional[Database] = None


def get_db() -> Optional[Database]:
    """Returns the database, or None when running with local JSON files."""
    global _db
    if not config.MONGODB_URI:
        return None
    if _db is None:
        client = MongoClient(config.MONGODB_URI, serverSelectionTimeoutMS=8000)
        _db = client[config.MONGODB_DB]
        _db.users.create_index([("email", ASCENDING)], unique=True)
        _db.meetings.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    return _db