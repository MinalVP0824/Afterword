import os
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import agent, auth, config, storage
from .llm import LLMError
from .schemas import (
    AnalyzeRequest,
    AuthResponse,
    ClarifyRequest,
    LoginRequest,
    MeetingListItem,
    MeetingResult,
    SignupRequest,
    TaskUpdate,
    UserOut,
)

app = FastAPI(title="Afterword", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")


def _get_or_404(meeting_id: str, user: UserOut) -> MeetingResult:
    meeting = storage.get_meeting(meeting_id, user.id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# ---------------------------------------------------------------- public

@app.get("/api/health")
def health():
    return {"status": "ok", "model": config.LLM_MODEL, "llm_configured": bool(config.LLM_API_KEY)}


@app.get("/api/samples")
def samples():
    """Sample transcripts for the demo, so the UI has something to load."""
    items = []
    if os.path.isdir(SAMPLES_DIR):
        for name in sorted(os.listdir(SAMPLES_DIR)):
            if name.endswith(".txt"):
                with open(os.path.join(SAMPLES_DIR, name), encoding="utf-8") as f:
                    text = f.read()
                title = name[:-4].split("_", 1)[-1].replace("_", " ").title()
                items.append({"id": name[:-4], "title": title, "transcript": text})
    return items


# ---------------------------------------------------------------- accounts

@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    first_user = auth.user_count() == 0
    user = auth.create_user(req.name, req.email, req.password)
    if first_user:
        storage.claim_unowned_meetings(user.id)
    return AuthResponse(token=auth.create_token(user), user=user)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user = auth.authenticate(req.email, req.password)
    return AuthResponse(token=auth.create_token(user), user=user)


@app.get("/api/auth/me", response_model=UserOut)
def me(user: UserOut = Depends(auth.get_current_user)):
    return user


# ---------------------------------------------------------------- meetings (login required)

@app.post("/api/analyze", response_model=MeetingResult)
def analyze(req: AnalyzeRequest, user: UserOut = Depends(auth.get_current_user)):
    try:
        result = agent.analyze(req.transcript, req.meeting_date, req.title)
    except ValueError:
        raise HTTPException(status_code=400, detail="meeting_date must be in YYYY-MM-DD format")
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
    result.user_id = user.id
    storage.save_meeting(result)
    return result


@app.get("/api/meetings", response_model=List[MeetingListItem])
def list_meetings(user: UserOut = Depends(auth.get_current_user)):
    return [
        MeetingListItem(
            id=m.id,
            title=m.title,
            meeting_date=m.meeting_date,
            created_at=m.created_at,
            task_count=len(m.tasks),
            open_questions=sum(1 for c in m.clarifications if not c.answered),
        )
        for m in storage.list_meetings(user.id)
    ]


@app.get("/api/meetings/{meeting_id}", response_model=MeetingResult)
def get_meeting(meeting_id: str, user: UserOut = Depends(auth.get_current_user)):
    return _get_or_404(meeting_id, user)


@app.post("/api/meetings/{meeting_id}/clarify", response_model=MeetingResult)
def clarify(meeting_id: str, req: ClarifyRequest, user: UserOut = Depends(auth.get_current_user)):
    meeting = _get_or_404(meeting_id, user)
    meeting = agent.apply_answers(meeting, req.answers)
    storage.save_meeting(meeting)
    return meeting


@app.patch("/api/meetings/{meeting_id}/tasks/{task_id}", response_model=MeetingResult)
def edit_task(meeting_id: str, task_id: str, req: TaskUpdate, user: UserOut = Depends(auth.get_current_user)):
    meeting = _get_or_404(meeting_id, user)
    try:
        meeting = agent.update_task(meeting, task_id, req.model_dump())
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")
    storage.save_meeting(meeting)
    return meeting


@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: str, user: UserOut = Depends(auth.get_current_user)):
    if not storage.delete_meeting(meeting_id, user.id):
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"deleted": meeting_id}