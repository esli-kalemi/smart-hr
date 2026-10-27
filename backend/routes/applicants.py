import uuid
from pathlib import Path

from fastapi import UploadFile, File, Form
from fastapi import APIRouter, Depends, HTTPException
from services.ai.resume_parser import (
    extract_resume_text,
    clean_resume_text,
)
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
    update_application,
    get_application_resume_path,
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


@router.get("/applications/{application_id}/resume-url")
def get_application_resume_url(
    application_id: str,
    current_user=Depends(get_current_user),
):
    try:
        storage_path = get_application_resume_path(
            supabase_admin,
            current_user["company_id"],
            application_id,
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Application or resume not found.",
        )

    if not storage_path:
        raise HTTPException(
            status_code=404,
            detail="No resume is available for this candidate.",
        )

    try:
        result = (
            supabase_admin.storage
            .from_("candidate-resumes")
            .create_signed_url(storage_path, 300)
        )

        signed_url = result.get("signedURL") or result.get("signedUrl")

        if not signed_url:
            raise ValueError("No signed URL returned.")

        return {"resume_url": signed_url}

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not generate a resume viewing link.",
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

@router.post("/public/applications")
def submit_public_application(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    job_id: str = Form(...),
    phone: str | None = Form(None),
    cv: UploadFile = File(...),
):
    bucket_name = "candidate-resumes"
    max_file_size = 5 * 1024 * 1024

    # Validate the file extension.
    filename = Path(cv.filename or "").name
    extension = Path(filename).suffix.lower()

    if extension not in {".pdf", ".docx"}:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX resumes are supported.",
        )

    # Read the file and enforce the size limit.
    file_bytes = cv.file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded resume is empty.",
        )

    if len(file_bytes) > max_file_size:
        raise HTTPException(
            status_code=400,
            detail="The resume must be 5 MB or smaller.",
        )

    # Confirm that the job is active and belongs to a company.
    job_response = (
        supabase_admin.table("jobs")
        .select("id, company_id, status, deleted_at")
        .eq("id", job_id)
        .eq("status", "active")
        .is_("deleted_at", "null")
        .execute()
    )

    if not job_response.data:
        raise HTTPException(
            status_code=404,
            detail="This job is no longer available.",
        )

    job = job_response.data[0]
    company_id = job["company_id"]

    # Extract the text from the uploaded resume.
    try:
        resume_text = clean_resume_text(
            extract_resume_text(filename, file_bytes)
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="We couldn't read this resume. Please upload a valid PDF or DOCX file.",
        )

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in the resume.",
        )

    # Upload the original resume using a unique storage path.
    storage_path = f"{company_id}/{uuid.uuid4()}{extension}"

    content_type = (
        "application/pdf"
        if extension == ".pdf"
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    try:
        supabase_admin.storage.from_(bucket_name).upload(
            storage_path,
            file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "false",
            },
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="We couldn't save your resume. Please try again.",
        )

    # Create the candidate record.
    try:
        candidate = create_candidate(
            supabase_admin,
            company_id,
            first_name.strip(),
            last_name.strip(),
            email.strip().lower(),
            phone.strip() if phone else None,
            storage_path,
            resume_text,
        )
    except Exception:
        try:
            supabase_admin.storage.from_(bucket_name).remove([storage_path])
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="We couldn't save your application. Please try again.",
        )

    # Create the application record.
    try:
        application = create_application(
            supabase_admin,
            company_id,
            candidate["id"],
            job["id"],
        )
    except Exception:
        # Avoid leaving an uploaded CV behind if application creation fails.
        try:
            supabase_admin.storage.from_(bucket_name).remove([storage_path])
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail="We couldn't complete your application. Please try again.",
        )

    return {
        "message": "Application submitted successfully.",
        "application_id": application["id"],
    }