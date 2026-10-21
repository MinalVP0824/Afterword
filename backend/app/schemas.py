from typing import List, Literal, Optional
from pydantic import BaseModel, Field

Field_ = Literal["owner", "deadline", "description"]


class Issue(BaseModel):
    field: Field_
    message: str


class Task(BaseModel):
    id: str
    description: str
    owner: Optional[str] = None
    deadline: Optional[str] = None          # resolved date, YYYY-MM-DD
    deadline_text: Optional[str] = None     # exactly how it was said in the meeting
    priority: Literal["high", "medium", "low"] = "medium"
    status: Literal["ready", "needs_clarification"] = "ready"
    issues: List[Issue] = []
    ambiguity_note: Optional[str] = None   # set when the LLM thinks the task is unclear


class Decision(BaseModel):
    id: str
    decision: str
    made_by: Optional[str] = None


class Clarification(BaseModel):
    id: str
    task_id: str
    field: Field_
    question: str
    answered: bool = False
    answer: Optional[str] = None


class ResolvedFollowUp(BaseModel):
    text: str
    reason: str = ""


class MeetingResult(BaseModel):
    id: str
    title: str
    meeting_date: str
    created_at: str
    participants: List[str] = []
    summary: str = ""
    key_points: List[str] = []
    decisions: List[Decision] = []
    tasks: List[Task] = []
    follow_ups: List[str] = []
    resolved_follow_ups: List[ResolvedFollowUp] = []
    clarifications: List[Clarification] = []
    transcript: str = ""


class MeetingListItem(BaseModel):
    id: str
    title: str
    meeting_date: str
    created_at: str
    task_count: int
    open_questions: int


class AnalyzeRequest(BaseModel):
    transcript: str = Field(min_length=20)
    meeting_date: Optional[str] = None   # YYYY-MM-DD, defaults to today
    title: Optional[str] = None


class Answer(BaseModel):
    clarification_id: str
    answer: str = Field(min_length=1)


class ClarifyRequest(BaseModel):
    answers: List[Answer]


class TaskUpdate(BaseModel):
    description: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[Literal["high", "medium", "low"]] = None