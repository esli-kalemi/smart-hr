from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from utils.supabase_client import supabase, supabase_admin


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    access_token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(access_token)

        if not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token"
            )

        user = user_response.user

        profile_response = (
            supabase_admin
            .table("users")
            .select("*")
            .eq("id", user.id)
            .single()
            .execute()
        )

        if not profile_response.data:
            raise HTTPException(
                status_code=404,
                detail="SmartHR user profile not found"
            )

        return profile_response.data

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )