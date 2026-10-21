"""
Accounts and login.

- Passwords are never stored. Only a salted PBKDF2 hash is saved.
- After login the user gets a signed JWT token. The frontend sends it with
  every request, and get_current_user() checks it before any meeting is touched.
"""

import hashlib
import hmac
import json
import os
import re
import secrets
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config
from .schemas import UserOut

_lock = threading.Lock()
_bearer = HTTPBearer(auto_error=False)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HASH_ROUNDS = 200_000


# ---------------------------------------------------------------- password hashing

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), HASH_ROUNDS).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), HASH_ROUNDS).hex()
    return hmac.compare_digest(check, digest)


# ---------------------------------------------------------------- user storage

def _load() -> Dict[str, dict]:
    if not os.path.exists(config.USERS_FILE):
        return {}
    with open(config.USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def _save(users: Dict[str, dict]) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(config.USERS_FILE)), exist_ok=True)
    tmp = config.USERS_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
    os.replace(tmp, config.USERS_FILE)


def _public(user: dict) -> UserOut:
    return UserOut(id=user["id"], name=user["name"], email=user["email"])


def create_user(name: str, email: str, password: str) -> UserOut:
    email = email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    with _lock:
        users = _load()
        if any(u["email"] == email for u in users.values()):
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        user = {
            "id": f"usr_{uuid.uuid4().hex[:10]}",
            "name": name.strip(),
            "email": email,
            "password_hash": hash_password(password),
            "created_at": datetime.now().isoformat(timespec="seconds"),
        }
        users[user["id"]] = user
        _save(users)
    return _public(user)


def authenticate(email: str, password: str) -> UserOut:
    email = email.strip().lower()
    with _lock:
        user = next((u for u in _load().values() if u["email"] == email), None)
    # same message either way, so nobody can find out which emails have accounts
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong email or password.")
    return _public(user)


def get_user(user_id: str) -> Optional[UserOut]:
    with _lock:
        user = _load().get(user_id)
    return _public(user) if user else None


def user_count() -> int:
    with _lock:
        return len(_load())


# ---------------------------------------------------------------- tokens

def create_token(user: UserOut) -> str:
    payload = {
        "sub": user.id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer)) -> UserOut:
    """FastAPI dependency: add it to any endpoint that needs a logged-in user."""
    if creds is None:
        raise HTTPException(status_code=401, detail="Please log in.")
    try:
        payload = jwt.decode(creds.credentials, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your session has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Please log in.")
    user = get_user(payload.get("sub", ""))
    if user is None:
        raise HTTPException(status_code=401, detail="Please log in.")
    return user