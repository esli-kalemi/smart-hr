from pydantic import BaseModel


class CandidateCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    resume_url: str | None = None
    resume_text: str | None = None


class ApplicationCreateRequest(BaseModel):
    candidate_id: str
    job_id: str


class ApplicationUpdateRequest(BaseModel):
    status: str | None = None
    stage: str | None = None
    notes: str | None = None