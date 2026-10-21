import os
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import agent, config, storage
from .llm import LLMError
from .schemas import (
    AnalyzeRequest,
    ClarifyRequest,
    MeetingListItem,
    MeetingResult,
    TaskUpdate,
)

app = FastAPI(title="Afterword", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")


def _get_or_404(meeting_id: str) -> MeetingResult:
    meeting = storage.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@app.get("/api/health")
def health():
    return {"status": "ok", "model": config.LLM_MODEL, "llm_configured": bool(config.LLM_API_KEY)}


@app.post("/api/analyze", response_model=MeetingResult)
def analyze(req: AnalyzeRequest):
    try:
        result = agent.analyze(req.transcript, req.meeting_date, req.title)
    except ValueError:
        raise HTTPException(status_code=400, detail="meeting_date must be in YYYY-MM-DD format")
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
    storage.save_meeting(result)
    return result


@app.get("/api/meetings", response_model=List[MeetingListItem])
def list_meetings():
    return [
        MeetingListItem(
            id=m.id,
            title=m.title,
            meeting_date=m.meeting_date,
            created_at=m.created_at,
            task_count=len(m.tasks),
            open_questions=sum(1 for c in m.clarifications if not c.answered),
        )
        for m in storage.list_meetings()
    ]


@app.get("/api/meetings/{meeting_id}", response_model=MeetingResult)
def get_meeting(meeting_id: str):
    return _get_or_404(meeting_id)


@app.post("/api/meetings/{meeting_id}/clarify", response_model=MeetingResult)
def clarify(meeting_id: str, req: ClarifyRequest):
    meeting = _get_or_404(meeting_id)
    meeting = agent.apply_answers(meeting, req.answers)
    storage.save_meeting(meeting)
    return meeting


@app.patch("/api/meetings/{meeting_id}/tasks/{task_id}", response_model=MeetingResult)
def edit_task(meeting_id: str, task_id: str, req: TaskUpdate):
    meeting = _get_or_404(meeting_id)
    try:
        meeting = agent.update_task(meeting, task_id, req.model_dump())
    except KeyError:
        raise HTTPException(status_code=404, detail="Task not found")
    storage.save_meeting(meeting)
    return meeting


@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: str):
    if not storage.delete_meeting(meeting_id):
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"deleted": meeting_id}


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