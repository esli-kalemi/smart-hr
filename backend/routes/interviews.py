
from fastapi import APIRouter, Depends, HTTPException

from services.interviews_service import get_company_interviews
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

        return {
            "interviews": interviews
        }

    except Exception as e:
        print(f"Failed to retrieve interviews: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve interviews"
        )
