
import os

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel


load_dotenv()


class AIExplanation(BaseModel):
    summary: str
    strengths: list[str]
    gaps: list[str]
    experience_explanation: str
    education_explanation: str
    certification_explanation: str
    soft_skills_explanation: str
    recommendations: list[str]


def generate_explanation(comparison: dict) -> AIExplanation:
    """
    Generate a natural-language explanation of an existing comparison.

    Gemini explains the supplied results only. It does not calculate
    scores, perform matching, or invent candidate qualifications.
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are an assistant for SmartHR, an AI-powered recruitment platform.

Explain the supplied candidate-to-job comparison in clear, professional,
objective language for a recruiter.

Rules:
- The supplied comparison and scores were produced by another system.
- Do not calculate, modify, or invent scores.
- Do not perform new matching.
- Do not invent candidate skills, qualifications, experience, or certifications.
- Base every conclusion on the supplied data.
- Distinguish a confirmed missing requirement from information that is
  simply unavailable or not detected in the resume.
- Do not make assumptions about protected characteristics.
- Keep recommendations relevant to evaluating this application fairly.
- If a category has no requirements, explain that it was not evaluated.

Return:
- A concise summary.
- A list of strengths supported by the comparison.
- A list of gaps supported by the comparison.
- An explanation of experience, education, certifications, and soft skills.
- A list of practical recommendations for the recruiter.

Comparison data:
{comparison}
"""

    response = client.models.generate_content(
        model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": AIExplanation,
        },
    )

    if response.parsed is None:
        raise ValueError("Gemini did not return a valid structured explanation.")

    return response.parsed
