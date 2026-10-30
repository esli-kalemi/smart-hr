
from services.ai.requirement_extractor import (
    extract_resume_education,
    extract_experience_requirement,
    extract_education_requirement,
    extract_certification_requirement,
    extract_soft_skill_requirements,
    extract_experience_requirements,
    extract_resume_skills,
    extract_resume_experience_years,
)
from services.ai.matcher import (
    semantic_skill_match,
    match_experience,
    match_education,
    match_certifications,
    match_soft_skills,
)
from services.ai.scorer import score_candidate
from services.ai.explanation import generate_explanation


def extract_candidate_certifications(resume_text: str) -> list[str]:
    """Extract certification names from common resume wording."""
    import re

    text = resume_text.lower()
    certifications = []

    # Prefer lines under a certifications heading.
    section_match = re.search(
        r"(?:certifications?|licenses?)\s*:?\s*\n"
        r"(.*?)(?=\n\s*(?:education|experience|skills|projects|"
        r"languages|summary)\s*:?\s*(?:\n|$)|\Z)",
        text,
        re.IGNORECASE | re.DOTALL,
    )

    if section_match:
        for line in section_match.group(1).splitlines():
            item = re.sub(r"^\s*[-•*]\s*", "", line).strip(" \t,.;:-")
            if item and item not in {"none", "n/a", "not applicable"}:
                certifications.append(item)

    return list(dict.fromkeys(certifications))


def extract_candidate_soft_skills(resume_text: str) -> list[str]:
    """Return soft skills explicitly mentioned in the resume."""
    known_soft_skills = {
        "communication",
        "leadership",
        "teamwork",
        "problem solving",
        "critical thinking",
        "adaptability",
        "creativity",
        "time management",
        "organization",
        "attention to detail",
        "decision making",
        "collaboration",
        "interpersonal skills",
        "public speaking",
        "conflict resolution",
    }

    extracted = set(extract_resume_skills(resume_text))
    return sorted(extracted.intersection(known_soft_skills))



def extract_candidate_experience(resume_text: str) -> list[str]:
    """
    Extract explicitly stated experience areas from a resume without assuming a particular industry or job category.
    """
    import re

    text = re.sub(r"\s+", " ", resume_text.lower()).strip()

    patterns = [
        r"\bexperience\s+(?:in|with)\s+([^.;]+)",
        r"\bbackground\s+(?:in|with)\s+([^.;]+)",
        r"\bworked\s+(?:as|in|on)\s+([^.;]+)",
        r"\bresponsible\s+for\s+([^.;]+)",
        r"\b(?:managed|led|coordinated|handled|supported)\s+"
        r"([^.;]+)",
    ]

    experiences = []

    for pattern in patterns:
        for match in re.findall(pattern, text):
            phrase = match.strip(" ,.-")

            # Stop at common clause boundaries so a full sentence
            # is not treated as one experience description.
            phrase = re.split(
                r"\b(?:and then|where|while|which|resulting in)\b",
                phrase,
                maxsplit=1,
            )[0].strip(" ,.-")

            if phrase and phrase not in experiences:
                experiences.append(phrase)

    return experiences


def get_job_requirements(job: dict) -> dict:
    """
    Use structured job requirements when available.
    Fall back to extracting categories from the job description
    and submitted requirement statements.
    """
    structured = job.get("requirements") or {}
    description = job.get("description") or ""

    if not isinstance(structured, dict):
        structured = {}

    raw_skills = structured.get("skills") or []

    if isinstance(raw_skills, str):
        raw_skills = [raw_skills]

    if not isinstance(raw_skills, list):
        raw_skills = []

    # Include submitted requirement statements when identifying categories.
    requirement_text = "\n".join(
        str(item) for item in raw_skills if item
    )
    combined_text = f"{description}\n{requirement_text}"

    # Extract soft skills from explicit structured values first.
    soft_skills = (
        structured.get("soft_skills")
        or extract_soft_skill_requirements(combined_text)
    )

    # Keep category-specific skills separate from other requirements.
    category_markers = (
        "bachelor", "master", "phd", "doctorate",
        "degree", "certification", "certified",
        "years of experience", "internship",
        "project experience", "communication", "teamwork",
        "problem solving", "critical thinking",
        "leadership", "adaptability", "attention to detail",
    )

    skills = [
        item for item in raw_skills
        if not any(marker in str(item).lower()
                   for marker in category_markers)
    ]

    if not skills:
        skills = extract_resume_skills(combined_text)

    # Education
    education_text = structured.get("education")
    if isinstance(education_text, dict):
        education_requirement = {
            "required": bool(education_text.get("required", True)),
            "level": education_text.get("level"),
            "fields": education_text.get("fields") or [],
        }
    else:
        education_requirement = extract_education_requirement(
            str(education_text or requirement_text or description)
        )

    # Certifications
    certification_text = structured.get("certifications")
    if isinstance(certification_text, list):
        certification_requirement = {
            "required": bool(certification_text),
            "certifications": certification_text,
        }
    else:
        certification_requirement = extract_certification_requirement(
            str(certification_text or requirement_text or description)
        )

    # Experience
    experience_years = structured.get("experience_years")
    if experience_years is not None:
        experience_requirement = {
            "required": True,
            "minimum_years": experience_years,
        }
    else:
        experience_requirement = extract_experience_requirement(
            combined_text
        )

    experience_types = extract_experience_requirements(description)

    return {
        "skills": skills,
        "soft_skills": soft_skills,
        "experience": experience_requirement,
        "experience_types": experience_types,
        "education": education_requirement,
        "certifications": certification_requirement,
    }

def build_application_comparison(application: dict) -> dict:
    """
    Compare a candidate's resume with the requirements of the job
    attached to an application. This function does not save to Supabase.
    """
    candidate = application.get("candidates") or {}
    job = application.get("jobs") or {}

    resume_text = candidate.get("resume_text") or ""
    if not resume_text.strip():
        raise ValueError(
            "The candidate does not have resume text available for analysis."
        )

    requirements = get_job_requirements(job)

    # Extract candidate information from the resume.
    candidate_skills = extract_resume_skills(resume_text)
    candidate_years = extract_resume_experience_years(resume_text)
    candidate_education = extract_resume_education(resume_text)
    candidate_certifications = extract_candidate_certifications(resume_text)
    candidate_soft_skills = extract_candidate_soft_skills(resume_text)
    candidate_experience = extract_candidate_experience(resume_text)
   
    # Match the candidate against each requirement category.
    skills_result = semantic_skill_match(
        candidate_skills,
        requirements["skills"],
    )

    experience_result = match_experience(
        candidate_years=candidate_years,
        required_years=requirements["experience"]["minimum_years"],
        candidate_experience=candidate_experience,
        required_experience=requirements["experience_types"],
    )

    education_result = match_education(
        candidate_education,
        requirements["education"],
    )

    certification_requirement = requirements["certifications"]
    certifications_result = match_certifications(
        candidate_certifications,
        certification_requirement["certifications"],
    )

    soft_skills_result = match_soft_skills(
        candidate_soft_skills,
        requirements["soft_skills"],
    )

    # Prepare the structure expected by the existing deterministic scorer.
    comparison = {
        "skills": {
            "required": bool(requirements["skills"]),
            "result": skills_result,
        },
        "experience": {
            "required": requirements["experience"]["required"]
            or bool(requirements["experience_types"]),
            "result": experience_result,
        },
        "education": {
            "required": requirements["education"]["required"],
            "result": education_result,
        },
        "certifications": {
            "required": certification_requirement["required"],
            "result": certifications_result,
        },
        "soft_skills": {
            "required": bool(requirements["soft_skills"]),
            "result": soft_skills_result,
        },
    }
    priority_weights = job.get("priority_weights")

    scoring = score_candidate(
        comparison,
        priority_weights=priority_weights,
    )

    return {
        "comparison": comparison,
        "scoring": scoring,
        "candidate_evidence": {
            "skills": candidate_skills,
            "experience_years": candidate_years,
            "experience_types": candidate_experience,
            "education": candidate_education,
            "certifications": candidate_certifications,
            "soft_skills": candidate_soft_skills,
        },
    }
