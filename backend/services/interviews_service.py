
from supabase import Client


def get_company_interviews(
    supabase_admin: Client,
    company_id: str
):
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

    response = (
        supabase_admin
        .table("interviews")
        .select("*, applications(*, candidates(*), jobs(*))")
        .in_("application_id", application_ids)
        .order("scheduled_at", desc=False)
        .execute()
    )

    return response.data


def create_interview(
    supabase_admin: Client,
    company_id: str,
    application_id: str,
    interview_data: dict
):
    # Verify that the application belongs to this company.
    application_response = (
        supabase_admin
        .table("applications")
        .select("id, job_id")
        .eq("id", application_id)
        .maybe_single()
        .execute()
    )

    application = application_response.data

    if not application:
        raise Exception("Application not found")

    job_response = (
        supabase_admin
        .table("jobs")
        .select("id")
        .eq("id", application["job_id"])
        .eq("company_id", company_id)
        .maybe_single()
        .execute()
    )

    if not job_response.data:
        raise Exception("Application not found")

    # Create the interview.
    serializable_data = {
        key: value.isoformat() if hasattr(value, "isoformat") else value
        for key, value in interview_data.items()
    }
    response = (
        supabase_admin
        .table("interviews")
        .insert({
            "application_id": application_id,
            **serializable_data
        })
        .execute()
    )

    if not response.data:
        raise Exception("Failed to create interview")

    return response.data[0]


def update_interview(
    supabase_admin: Client,
    company_id: str,
    interview_id: str,
    updates: dict
):
    # Find the interview and its linked application.
    interview_response = (
        supabase_admin
        .table("interviews")
        .select("id, application_id")
        .eq("id", interview_id)
        .maybe_single()
        .execute()
    )

    interview = interview_response.data

    if not interview:
        raise Exception("Interview not found")

    # Verify company ownership through the linked application.
    application_response = (
        supabase_admin
        .table("applications")
        .select("id, job_id")
        .eq("id", interview["application_id"])
        .maybe_single()
        .execute()
    )

    application = application_response.data

    if not application:
        raise Exception("Interview not found")

    job_response = (
        supabase_admin
        .table("jobs")
        .select("id")
        .eq("id", application["job_id"])
        .eq("company_id", company_id)
        .maybe_single()
        .execute()
    )

    if not job_response.data:
        raise Exception("Interview not found")

    # Apply the changes.
    serializable_updates = {
        key: value.isoformat() if hasattr(value, "isoformat") else value
        for key, value in updates.items()
    }
    response = (
        supabase_admin
        .table("interviews")
        .update(serializable_updates)
        .eq("id", interview_id)
        .execute()
    )

    if not response.data:
        raise Exception("Failed to update interview")

    return response.data[0]


def delete_interview(supabase_admin, company_id, interview_id):
    # Find the interview.
    interview_response = (
        supabase_admin
        .table("interviews")
        .select("*")
        .eq("id", interview_id)
        .execute()
    )

    if not interview_response.data:
        raise ValueError("Interview not found")

    interview = interview_response.data[0]
    application_id = interview.get("application_id")

    # Find the application.
    application_response = (
        supabase_admin
        .table("applications")
        .select("id, job_id")
        .eq("id", application_id)
        .execute()
    )

    if not application_response.data:
        raise ValueError("Application not found")

    application = application_response.data[0]

    # Verify that the job belongs to the current company.
    job_response = (
        supabase_admin
        .table("jobs")
        .select("id, company_id")
        .eq("id", application["job_id"])
        .execute()
    )

    if (
        not job_response.data
        or str(job_response.data[0]["company_id"]) != str(company_id)
    ):
        raise ValueError("Interview not found")

    # Delete the interview.
    response = (
        supabase_admin
        .table("interviews")
        .delete()
        .eq("id", interview_id)
        .execute()
    )

    if not response.data:
        raise ValueError("Failed to delete interview")

    return {"message": "Interview deleted successfully"}
