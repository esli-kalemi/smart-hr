from supabase import Client


def create_candidate(
    supabase_admin: Client,
    company_id: str,
    first_name: str,
    last_name: str,
    email: str,
    phone: str | None,
    resume_url: str | None,
    resume_text: str | None
):
    response = (
        supabase_admin
        .table("candidates")
        .insert({
            "company_id": company_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "resume_url": resume_url,
            "resume_text": resume_text
        })
        .execute()
    )

    if not response.data:
        raise Exception("Candidate creation failed")

    return response.data[0]


def create_application(
    supabase_admin: Client,
    company_id: str,
    candidate_id: str,
    job_id: str
):
    # First make sure the job belongs to the recruiter's company.
    job_response = (
        supabase_admin
        .table("jobs")
        .select("id")
        .eq("id", job_id)
        .eq("company_id", company_id)
        .execute()
    )

    if not job_response.data:
        raise Exception("Job not found")
    
    candidate_response = (
        supabase_admin
        .table("candidates")
        .select("id")
        .eq("id", candidate_id)
        .eq("company_id", company_id)
        .execute()
    )

    if not candidate_response.data:
        raise Exception("Candidate not found")
    
    response = (
        supabase_admin
        .table("applications")
        .insert({
            "candidate_id": candidate_id,
            "job_id": job_id,
            "status": "active",
            "stage": "applied"
        })
        .execute()
    )

    if not response.data:
        raise Exception("Application creation failed")

    return response.data[0]


def get_company_applications(
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

    response = (
        supabase_admin
        .table("applications")
        .select(
            "*, candidates(*), jobs(*)"
        )
        .in_("job_id", job_ids)
        .order("applied_at", desc=True)
        .execute()
    )

    return response.data


def get_application(
    supabase_admin: Client,
    company_id: str,
    application_id: str
):
    application_response = (
        supabase_admin
        .table("applications")
        .select("*")
        .eq("id", application_id)
        .single()
        .execute()
    )

    if not application_response.data:
        raise Exception("Application not found")

    application = application_response.data
    
    job_response = (
        supabase_admin
        .table("jobs")
        .select("id")
        .eq("id", application["job_id"])
        .eq("company_id", company_id)
        .single()
        .execute()
    )

    if not job_response.data:
        raise Exception("Application not found")

    detailed_response = (
        supabase_admin
        .table("applications")
        .select(
            "*, candidates(*), jobs(*)"
        )
        .eq("id", application_id)
        .single()
        .execute()
    )

    if not detailed_response.data:
        raise Exception("Application not found")

    return detailed_response.data


def update_application(
    supabase_admin: Client,
    company_id: str,
    application_id: str,
    updates: dict
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
        raise Exception("Application not found")

    response = (
        supabase_admin
        .table("applications")
        .update(updates)
        .eq("id", application_id)
        .in_("job_id", job_ids)
        .execute()
    )

    if not response.data:
        raise Exception("Application update failed")

    return response.data[0]