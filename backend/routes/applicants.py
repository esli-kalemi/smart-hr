from fastapi import APIRouter, Depends, HTTPException

from schemas.applicants import (
    CandidateCreateRequest,
    ApplicationCreateRequest,
    ApplicationUpdateRequest
)

from services.applicants_service import (
    create_candidate,
    create_application,
    get_company_applications,
    get_application,
    update_application
)

from utils.auth import get_current_user
from utils.supabase_client import supabase_admin


router = APIRouter(
    prefix="/applicants",
    tags=["Applicants"]
)


@router.post("/candidates")
def create_candidate_route(
    request: CandidateCreateRequest,
    current_user=Depends(get_current_user)
):
    try:
        candidate = create_candidate(
            supabase_admin,
            current_user["company_id"],
            request.first_name,
            request.last_name,
            request.email,
            request.phone,
            request.resume_url,
            request.resume_text
        )

        return {
            "message": "Candidate created successfully",
            "candidate": candidate
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to create candidate"
        )


@router.post("/applications")
def create_application_route(
    request: ApplicationCreateRequest,
    current_user=Depends(get_current_user)
):
    try:
        application = create_application(
            supabase_admin,
            current_user["company_id"],
            request.candidate_id,
            request.job_id
        )

        return {
            "message": "Application created successfully",
            "application": application
        }

    except Exception as e:
        if str(e) == "Job not found":
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        if str(e) == "Candidate not found":
            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        raise HTTPException(
            status_code=500,
            detail="Failed to create application"
        )


@router.get("/applications")
def get_applications(
    current_user=Depends(get_current_user)
):
    try:
        applications = get_company_applications(
            supabase_admin,
            current_user["company_id"]
        )

        return {
            "applications": applications
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve applications"
        )


@router.get("/applications/{application_id}")
def get_single_application(
    application_id: str,
    current_user=Depends(get_current_user)
):
    try:
        application = get_application(
            supabase_admin,
            current_user["company_id"],
            application_id
        )

        return {
            "application": application
        }

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )


@router.put("/applications/{application_id}")
def update_application_route(
    application_id: str,
    request: ApplicationUpdateRequest,
    current_user=Depends(get_current_user)
):
    updates = request.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    try:
        application = update_application(
            supabase_admin,
            current_user["company_id"],
            application_id,
            updates
        )

        return {
            "message": "Application updated successfully",
            "application": application
        }

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Application not found or update failed"
        )