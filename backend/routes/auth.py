from fastapi import APIRouter, Depends
from utils.auth import get_current_user

from services.auth_service import (
    login_user,
    register_user,
    resend_confirmation_email
)
from schemas.auth import LoginRequest, RegisterRequest
from services.auth_service import login_user, register_user
from utils.supabase_client import supabase, supabase_admin


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(request: RegisterRequest):
    response = register_user(
        supabase,
        supabase_admin,
        request.company_name,
        request.name,
        request.email,
        request.password
    )

    return {
        "message": "Registration successful",
        "user": response["user"],
        "company": response["company"],
        "profile": response["profile"]
    }


@router.post("/login")
def login(request: LoginRequest):
    response = login_user(
        supabase,
        request.email,
        request.password
    )

    return {
        "message": "Login successful",
        "user": response.user,
        "session": response.session
    }
@router.post("/resend-confirmation")
def resend_confirmation(email: str):
    response = resend_confirmation_email(
        supabase,
        email
    )

    return {
        "message": "Confirmation email sent"
    }

@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "user": current_user
    }