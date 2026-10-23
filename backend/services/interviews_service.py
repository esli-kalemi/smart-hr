
from supabase import Client


def get_company_interviews(
    supabase_admin: Client,
    company_id: str
):
    # Find the jobs owned by the current company.
    job_response = (
        supabase_admin
        .table("jobs")
        .select("id")
        .eq("company_id", company_id)
        .execute()
    )

    job_ids = [job["id"] for job in job_response.data]

    if not job_ids:
        return []

    # Find applications linked to those jobs.
    application_response = (
        supabase_admin
        .table("applications")
        .select("id")
        .in_("job_id", job_ids)
        .execute()
    )

    application_ids = [
        application["id"]
        for application in application_response.data
    ]

    if not application_ids:
        return []

    # Retrieve interviews linked to those applications.
    response = (
        supabase_admin
        .table("interviews")
        .select(
            "*, applications(*, candidates(*), jobs(*))"
        )
        .in_("application_id", application_ids)
        .order("scheduled_at", desc=False)
        .execute()
    )

    return response.data
