from typing import Any

from pydantic import BaseModel


class JobCreateRequest(BaseModel):
    title: str
    description: str
    requirements: dict[str, Any] | None = None


class JobUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: dict[str, Any] | None = None
    status: str | None = None