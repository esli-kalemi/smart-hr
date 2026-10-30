from typing import Any

from pydantic import BaseModel,Field, model_validator

DEFAULT_PRIORITY_WEIGHTS = {
    "skills": 35,
    "experience": 25,
    "education": 15,
    "certifications": 10,
    "soft_skills": 15,
}

class JobCreateRequest(BaseModel):
    title: str
    description: str
    requirements: dict[str, Any] | None = None
    priority_weights: dict[str, int] = Field(
        default_factory=lambda: DEFAULT_PRIORITY_WEIGHTS.copy()
    )

    @model_validator(mode="after")
    def validate_priority_weights(self):
        expected_keys = set(DEFAULT_PRIORITY_WEIGHTS.keys())

        if set(self.priority_weights.keys()) != expected_keys:
            raise ValueError(
                "Priority weights must contain skills, experience, "
                "education, certifications, and soft_skills."
            )

        for key, value in self.priority_weights.items():
            if isinstance(value, bool) or not isinstance(value, int):
                raise ValueError(f"{key} must be an integer.")

            if not 0 <= value <= 100:
                raise ValueError(f"{key} must be between 0 and 100.")

        if sum(self.priority_weights.values()) != 100:
            raise ValueError("Priority weights must add up to 100.")

        return self

class JobUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: dict[str, Any] | None = None
    status: str | None = None