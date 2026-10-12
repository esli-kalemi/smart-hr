
from services.ai.application_analyzer import build_application_comparison


sample_application = {
    "candidates": {
        "first_name": "John",
        "last_name": "Smith",
        "resume_text": """
        John Smith is a software developer with experience in Python and SQL.      He has a Bachelor degree in Computer Science.
        Skills include communication, teamwork and problem solving.
        """
    },
    "jobs": {
        "title": "Junior Full-Stack Developer",
        "description": """
        We are looking for a Junior Full-Stack Developer with one year
        of relevant experience.Experience in web development is required.Communication, teamwork and problem
        solving are important for this role.
        """
        ,
        "requirements": {
            "skills": [
                "JavaScript",
                "React",
                "Python",
                "SQL",
                "PostgreSQL"
            ],
            "education": "Bachelor degree in Computer Science or related field",
            "soft_skills": [
                "Communication",
                "Teamwork",
                "Problem solving"
            ],
            "experience_years": 1
        }
    }
}


if __name__ == "__main__":
    result = build_application_comparison(sample_application)

    print("\n=== OVERALL SCORE ===")
    print(result["scoring"]["overall_score"])

    print("\n=== CATEGORY SCORES ===")
    print(result["scoring"]["category_scores"])

    print("\n=== COMPARISON ===")
    print(result["comparison"])

    print("\n=== CANDIDATE EVIDENCE ===")
    print(result["candidate_evidence"])
