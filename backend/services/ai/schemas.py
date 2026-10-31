from pydantic import BaseModel


class AIExplanation(BaseModel):
    summary: str
    strengths: list[str]
    gaps: list[str]
    experience_explanation: str
    education_explanation: str
    certification_explanation: str
    soft_skills_explanation: str
    recommendations: list[str]