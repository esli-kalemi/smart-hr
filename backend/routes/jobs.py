from fastapi import APIRouter, Depends, HTTPException

from schemas.jobs import JobCreateRequest, JobUpdateRequest
from services.jobs_service import (
    create_job,
    get_company_jobs,
    get_job,
    update_job,
    delete_job
)
from utils.auth import get_current_user
from utils.supabase_client import supabase_admin


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("/")
def create_job_route(
    request: JobCreateRequest,
    current_user=Depends(get_current_user)
):
    try:
        job = create_job(
            supabase_admin,
            current_user["company_id"],
            request.title,
            request.description,
            request.requirements
        )

        return {
            "message": "Job created successfully",
            "job": job
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to create job"
        )


@router.get("/")
def get_jobs(
    current_user=Depends(get_current_user)
):
    try:
        jobs = get_company_jobs(
            supabase_admin,
            current_user["company_id"]
        )

        return {
            "jobs": jobs
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve jobs"
        )


@router.get("/{job_id}")
def get_single_job(
    job_id: str,
    current_user=Depends(get_current_user)
):
    try:
        job = get_job(
            supabase_admin,
            current_user["company_id"],
            job_id
        )

        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        return {
            "job": job
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )


@router.put("/{job_id}")
def update_job_route(
    job_id: str,
    request: JobUpdateRequest,
    current_user=Depends(get_current_user)
):
    updates = request.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    try:
        job = update_job(
            supabase_admin,
            current_user["company_id"],
            job_id,
            updates
        )

        return {
            "message": "Job updated successfully",
            "job": job
        }

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Job not found or update failed"
        )


@router.delete("/{job_id}")
def delete_job_route(
    job_id: str,
    current_user=Depends(get_current_user)
):
    try:
        job = delete_job(
            supabase_admin,
            current_user["company_id"],
            job_id
        )

        return {
            "message": "Job deleted successfully",
            "job": job
        }

    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Job not found or deletion failed"
        )