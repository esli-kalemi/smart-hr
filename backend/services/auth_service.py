from supabase import Client


def register_user(
    supabase: Client,
    supabase_admin: Client,
    company_name: str,
    name: str,
    email: str,
    password: str
):
    auth_response = supabase.auth.sign_up({
        "email": email,
        "password": password
    })

    if not auth_response.user:
        raise Exception("User registration failed")

    company_response = (
        supabase_admin
        .table("companies")
        .insert({
            "name": company_name
        })
        .execute()
    )

    if not company_response.data:
        raise Exception("Company creation failed")

    company = company_response.data[0]

    user_response = (
        supabase_admin
        .table("users")
        .insert({
            "id": auth_response.user.id,
            "company_id": company["id"],
            "name": name,
            "email": email,
            "role": "admin"
        })
        .execute()
    )

    if not user_response.data:
        raise Exception("User profile creation failed")

    return {
        "user": auth_response.user,
        "company": company,
        "profile": user_response.data[0]
    }


def login_user(
    supabase: Client,
    email: str,
    password: str
):
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    return response

def resend_confirmation_email(
    supabase: Client,
    email: str
):
    response = supabase.auth.resend({
        "type": "signup",
        "email": email
    })

    return response