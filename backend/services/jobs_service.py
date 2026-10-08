from supabase import Client


def create_job(
    supabase_admin: Client,
    company_id: str,
    title: str,
    description: str,
    requirements: dict | None
):
    response = (
        supabase_admin
        .table("jobs")
        .insert({
            "company_id": company_id,
            "title": title,
            "description": description,
            "requirements": requirements,
            "status": "draft"
        })
        .execute()
    )

    if not response.data:
        raise Exception("Job creation failed")

    return response.data[0]


def get_company_jobs(
    supabase_admin: Client,
    company_id: str
):
    response = (
        supabase_admin
        .table("jobs")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def get_job(
    supabase_admin: Client,
    company_id: str,
    job_id: str
):
    response = (
        supabase_admin
        .table("jobs")
        .select("*")
        .eq("id", job_id)
        .eq("company_id", company_id)
        .single()
        .execute()
    )

    return response.data


def update_job(
    supabase_admin: Client,
    company_id: str,
    job_id: str,
    updates: dict
):
    response = (
        supabase_admin
        .table("jobs")
        .update(updates)
        .eq("id", job_id)
        .eq("company_id", company_id)
        .execute()
    )

    if not response.data:
        raise Exception("Job update failed")

    return response.data[0]


def delete_job(
    supabase_admin: Client,
    company_id: str,
    job_id: str
):
    response = (
        supabase_admin
        .table("jobs")
        .delete()
        .eq("id", job_id)
        .eq("company_id", company_id)
        .execute()
    )

    if not response.data:
        raise Exception("Job deletion failed")

    return response.data[0]