
from datetime import datetime

from pydantic import BaseModel


class InterviewCreateRequest(BaseModel):
    application_id: str
    interviewer_id: str | None = None
    scheduled_at: datetime
    type: str
    status: str = "scheduled"
    notes: str | None = None


class InterviewUpdateRequest(BaseModel):
    interviewer_id: str | None = None
    scheduled_at: datetime | None = None
    type: str | None = None
    status: str | None = None
    notes: str | None = None
