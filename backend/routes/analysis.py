
from fastapi import APIRouter, Depends, HTTPException

from services.ai.application_analyzer import (
    build_application_comparison,
)
from services.ai.explanation import generate_explanation
from services.applicants_service import (
    get_application,
    update_application,
)
from utils.auth import get_current_user
from utils.supabase_client import supabase_admin


router = APIRouter(
    prefix="/applicants",
    tags=["AI Analysis"],
)


@router.post("/applications/{application_id}/analyze")
def analyze_application(
    application_id: str,
    current_user=Depends(get_current_user),
):
    company_id = current_user["company_id"]

    # Retrieve the application, candidate, and job.
    try:
        application = get_application(
            supabase_admin,
            company_id,
            application_id,
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    # Calculate the comparison and score.
    try:
        result = build_application_comparison(application)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze application",
        )

    scoring = result["scoring"]
    score = scoring.get("overall_score")

    # Generate an explanation without making analysis depend on Gemini.
    explanation = None
    explanation_status = "unavailable"

    try:
        explanation = generate_explanation(
            {
                "comparison": result["comparison"],
                "scoring": scoring,
                "candidate_evidence": result["candidate_evidence"],
            }
        )
        explanation = explanation.model_dump()
        explanation_status = "generated"
    except Exception:
        explanation = {
            "summary": (
                "The match score was calculated, but the AI explanation "
                "is temporarily unavailable."
            ),
            "strengths": [],
            "gaps": [],
            "experience_explanation": "",
            "education_explanation": "",
            "certification_explanation": "",
            "soft_skills_explanation": "",
            "recommendations": [],
        }

    # Save the result to the existing application record.
    try:
        saved_application = update_application(
            supabase_admin,
            company_id,
            application_id,
            {
                "ai_score": score,
                "ai_analysis": explanation,
            },
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Analysis completed but results could not be saved",
        )

    return {
        "message": "Application analysis completed",
        "application_id": application_id,
        "ai_score": score,
        "ai_analysis": explanation,
        "explanation_status": explanation_status,
        "comparison": result["comparison"],
        "scoring": scoring,
        "candidate_evidence": result["candidate_evidence"],
    }
