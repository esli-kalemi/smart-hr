
from fastapi import APIRouter, Depends, HTTPException

from schemas.interviews import (
    InterviewCreateRequest,
    InterviewUpdateRequest,
)

from services.interviews_service import (
    get_company_interviews,
    create_interview,
    update_interview,
    delete_interview,
)

from utils.auth import get_current_user
from utils.supabase_client import supabase_admin


router = APIRouter(
    prefix="/interviews",
    tags=["Interviews"]
)


@router.get("/")
def get_interviews(
    current_user=Depends(get_current_user)
):
    try:
        interviews = get_company_interviews(
            supabase_admin,
            current_user["company_id"]
        )

        return {"interviews": interviews}

    except Exception as e:
        print(f"Failed to retrieve interviews: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve interviews"
        )


@router.post("/")
def create_interview_route(
    request: InterviewCreateRequest,
    current_user=Depends(get_current_user)
):
    try:
        interview_data = request.model_dump(
            exclude={"application_id"},
            exclude_unset=True
        )

        interview = create_interview(
            supabase_admin,
            current_user["company_id"],
            request.application_id,
            interview_data
        )

        return {
            "message": "Interview created successfully",
            "interview": interview
        }

    except Exception as e:
        print(f"Failed to create interview: {e}")

        if str(e) == "Application not found":
            raise HTTPException(
                status_code=404,
                detail="Application not found"
            )

        raise HTTPException(
            status_code=500,
            detail="Failed to create interview"
        )


@router.put("/{interview_id}")
def update_interview_route(
    interview_id: str,
    request: InterviewUpdateRequest,
    current_user=Depends(get_current_user)
):
    updates = request.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    try:
        interview = update_interview(
            supabase_admin,
            current_user["company_id"],
            interview_id,
            updates
        )

        return {
            "message": "Interview updated successfully",
            "interview": interview
        }

    except Exception as e:
        print(f"Failed to update interview: {e}")

        if str(e) == "Interview not found":
            raise HTTPException(
                status_code=404,
                detail="Interview not found"
            )

        raise HTTPException(
            status_code=500,
            detail="Failed to update interview"
        )

@router.delete("/{interview_id}")
def delete_interview_endpoint(
    interview_id: str,
    current_user=Depends(get_current_user),
):
    try:
        result = delete_interview(
            supabase_admin,
            current_user["company_id"],
            interview_id,
        )
        return result

    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))

    except Exception as error:
        print(f"Failed to delete interview: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete interview",
        )
