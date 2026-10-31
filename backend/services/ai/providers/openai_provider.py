import os

from openai import OpenAI
from ..schemas import AIExplanation

def generate_openai_explanation(comparison: dict) -> AIExplanation:
    """
    Generate an explanation using OpenAI.

    OpenAI explains the supplied comparison only.
    It does not calculate scores or perform matching.
    """

    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise ValueError("OPENAI_API_KEY is not configured.")

    client = OpenAI(api_key=api_key)

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

    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
        input=prompt,
        text_format=AIExplanation,
    )

    if response.output_parsed is None:
        raise ValueError(
            "OpenAI did not return a valid structured explanation."
        )

    return response.output_parsed