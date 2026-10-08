from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim


model = SentenceTransformer("all-MiniLM-L6-v2")

SEMANTIC_EQUIVALENTS = {
    "teamwork": [
        "collaboration"
    ],
    "collaboration": [
        "teamwork"
    ],
    "problem solving": [
        "problem-solving",
        "problem solving skills"
    ],
}

def match_skills(candidate_skills, required_skills):
    candidate_skills = [
        skill.lower().strip()
        for skill in candidate_skills
    ]

    required_skills = [
        skill.lower().strip()
        for skill in required_skills
    ]

    matched = []
    missing = []

    for required_skill in required_skills:
        if required_skill in candidate_skills:
            matched.append(required_skill)
        else:
            missing.append(required_skill)

    return {
        "matched": matched,
        "missing": missing
    }

def semantic_skill_match(resume_skills, job_skills):


    matches = []
    related_skills = []
    missing_skills = []

    resume_skill_set = {
        skill.lower().strip()
        for skill in resume_skills
    }

    if not resume_skills:
        return {
            "matches": [],
            "related_skills": [],
            "missing_skills": job_skills
        }

    resume_embeddings = model.encode(resume_skills)

    for job_skill in job_skills:
        normalized_job_skill = job_skill.lower().strip()

        # Exact match
        if normalized_job_skill in resume_skill_set:
            matches.append({
                "job_skill": job_skill,
                "resume_skill": job_skill,
                "similarity": 1.0,
                "type": "exact"
            })

            continue

        # Controlled semantic equivalent
        equivalent_found = False

        for resume_skill in resume_skills:
            normalized_resume_skill = resume_skill.lower().strip()

            equivalents = SEMANTIC_EQUIVALENTS.get(
                normalized_resume_skill,
                []
            )

            if normalized_job_skill in equivalents:
                matches.append({
                    "job_skill": job_skill,
                    "resume_skill": resume_skill,
                    "similarity": 1.0,
                    "type": "strong_semantic"
                })

                equivalent_found = True
                break

        if equivalent_found:
            continue

        job_embedding = model.encode([job_skill])[0]

        best_match = None
        best_similarity = 0

        for resume_skill, resume_embedding in zip(
            resume_skills,
            resume_embeddings
        ):
            similarity = float(
                cos_sim(
                    resume_embedding,
                    job_embedding
                )
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = resume_skill

        if best_similarity >= 0.7:
            matches.append({
                "job_skill": job_skill,
                "resume_skill": best_match,
                "similarity": round(best_similarity, 3),
                "type": "strong_semantic"
            })

        elif best_similarity >= 0.6:
            related_skills.append({
                "job_skill": job_skill,
                "resume_skill": best_match,
                "similarity": round(best_similarity, 3),
                "type": "related"
            })

        else:
            missing_skills.append(job_skill)

    return {
        "matches": matches,
        "related_skills": related_skills,
        "missing_skills": missing_skills
    }

def match_experience(
    candidate_years,
    required_years,
    candidate_experience,
    required_experience
):
    years_match = (
        candidate_years >= required_years
        if required_years is not None
        else True
    )

    result = {
        "years": {
            "candidate": candidate_years,
            "required": required_years,
            "matched": years_match
        },
        "types": {
            "matches": [],
            "related": [],
            "missing": []
        }
    }

    if not required_experience:
        return result

    if not candidate_experience:
        result["types"]["missing"] = required_experience
        return result

    candidate_embeddings = model.encode(
        candidate_experience
    )

    for requirement in required_experience:
        requirement_embedding = model.encode(
            [requirement]
        )[0]

        best_match = None
        best_similarity = 0

        for experience, embedding in zip(
            candidate_experience,
            candidate_embeddings
        ):
            similarity = float(
                cos_sim(
                    embedding,
                    requirement_embedding
                )
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = experience

        if best_similarity >= 0.7:
            result["types"]["matches"].append({
                "requirement": requirement,
                "candidate_experience": best_match,
                "similarity": round(best_similarity, 3),
                "type": "strong_semantic"
            })

        elif best_similarity >= 0.6:
            result["types"]["related"].append({
                "requirement": requirement,
                "candidate_experience": best_match,
                "similarity": round(best_similarity, 3),
                "type": "related"
            })

        else:
            result["types"]["missing"].append(
                requirement
            )

    return result

def match_education(
    candidate_education,
    required_education
):
    if not required_education:
        return {
            "matched": True,
            "level": {
                "candidate": None,
                "required": None,
                "matched": True
            },
            "field": {
                "matched": True,
                "candidate": [],
                "required": []
            }
        }

    candidate_degrees = candidate_education.get(
        "degrees",
        []
    )

    required_level = required_education.get(
        "level"
    )

    required_fields = required_education.get(
        "fields",
        []
    )

    candidate_levels = [
        degree["level"]
        for degree in candidate_degrees
    ]

    candidate_fields = [
        degree["field"]
        for degree in candidate_degrees
    ]

    level_match = (
        required_level in candidate_levels
    )

    field_result = {
        "matched": True,
        "candidate": candidate_fields,
        "required": required_fields,
        "similarity": 1.0,
        "type": "not_required"
    }

    if required_fields:
        if not candidate_fields:
            field_result = {
                "matched": False,
                "candidate": [],
                "required": required_fields,
                "similarity": 0,
                "type": "missing"
            }

        else:
            candidate_embeddings = model.encode(
                candidate_fields
            )

            required_embeddings = model.encode(
                required_fields
            )

            best_match = None
            best_similarity = 0
            best_candidate_field = None

            for candidate_field, candidate_embedding in zip(
                candidate_fields,
                candidate_embeddings
            ):
                for required_field, required_embedding in zip(
                    required_fields,
                    required_embeddings
                ):
                    similarity = float(
                        cos_sim(
                            candidate_embedding,
                            required_embedding
                        )
                    )

                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match = required_field
                        best_candidate_field = candidate_field

            if best_similarity >= 0.7:
                field_result = {
                    "matched": True,
                    "candidate": candidate_fields,
                    "candidate_field": best_candidate_field,
                    "required": required_fields,
                    "required_field": best_match,
                    "similarity": round(
                        best_similarity,
                        3
                    ),
                    "type": "strong_semantic"
                }

            elif best_similarity >= 0.6:
                field_result = {
                    "matched": False,
                    "candidate": candidate_fields,
                    "candidate_field": best_candidate_field,
                    "required": required_fields,
                    "required_field": best_match,
                    "similarity": round(
                        best_similarity,
                        3
                    ),
                    "type": "related"
                }

            else:
                field_result = {
                    "matched": False,
                    "candidate": candidate_fields,
                    "candidate_field": best_candidate_field,
                    "required": required_fields,
                    "required_field": best_match,
                    "similarity": round(
                        best_similarity,
                        3
                    ),
                    "type": "missing"
                }

    return {
        "matched": level_match and field_result["matched"],
        "level": {
            "candidate": candidate_levels,
            "required": required_level,
            "matched": level_match
        },
        "field": field_result
    }

def match_certifications(
    candidate_certifications,
    required_certifications
):
    if not required_certifications:
        return {
            "matched": True,
            "matches": [],
            "missing": []
        }

    if not candidate_certifications:
        return {
            "matched": False,
            "matches": [],
            "missing": required_certifications
        }

    matches = []
    missing = []

    candidate_embeddings = model.encode(
        candidate_certifications
    )

    for required_certification in required_certifications:
        required_embedding = model.encode(
            [required_certification]
        )[0]

        best_match = None
        best_similarity = 0

        for certification, embedding in zip(
            candidate_certifications,
            candidate_embeddings
        ):
            similarity = float(
                cos_sim(
                    embedding,
                    required_embedding
                )
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = certification

        if best_similarity >= 0.7:
            matches.append({
                "required": required_certification,
                "candidate": best_match,
                "similarity": round(
                    best_similarity,
                    3
                ),
                "type": "strong_semantic"
            })

        else:
            missing.append(
                required_certification
            )

    return {
        "matched": len(missing) == 0,
        "matches": matches,
        "missing": missing
    }

def match_soft_skills(
    candidate_soft_skills,
    required_soft_skills
):
    if not required_soft_skills:
        return {
            "matched": True,
            "matches": [],
            "related": [],
            "missing": []
        }

    if not candidate_soft_skills:
        return {
            "matched": False,
            "matches": [],
            "related": [],
            "missing": required_soft_skills
        }

    matches = []
    related = []
    missing = []

    candidate_skill_set = {
        skill.lower().strip()
        for skill in candidate_soft_skills
    }

    candidate_embeddings = model.encode(
        candidate_soft_skills
    )

    for required_skill in required_soft_skills:
        normalized_required = required_skill.lower().strip()

        # Exact match
        if normalized_required in candidate_skill_set:
            matches.append({
                "required": required_skill,
                "candidate": required_skill,
                "similarity": 1.0,
                "type": "exact"
            })

            continue

        # Controlled semantic equivalent
        equivalent_found = False

        for candidate_skill in candidate_soft_skills:
            normalized_candidate = candidate_skill.lower().strip()

            equivalents = SEMANTIC_EQUIVALENTS.get(
                normalized_candidate,
                []
            )

            if normalized_required in equivalents:
                matches.append({
                    "required": required_skill,
                    "candidate": candidate_skill,
                    "similarity": 1.0,
                    "type": "strong_semantic"
                })

                equivalent_found = True
                break

        if equivalent_found:
            continue

        # General semantic matching
        required_embedding = model.encode(
            [required_skill]
        )[0]

        best_match = None
        best_similarity = 0

        for candidate_skill, embedding in zip(
            candidate_soft_skills,
            candidate_embeddings
        ):
            similarity = float(
                cos_sim(
                    embedding,
                    required_embedding
                )
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = candidate_skill

        if best_similarity >= 0.7:
            matches.append({
                "required": required_skill,
                "candidate": best_match,
                "similarity": round(
                    best_similarity,
                    3
                ),
                "type": "strong_semantic"
            })

        elif best_similarity >= 0.6:
            related.append({
                "required": required_skill,
                "candidate": best_match,
                "similarity": round(
                    best_similarity,
                    3
                ),
                "type": "related"
            })

        else:
            missing.append(required_skill)

    return {
        "matched": len(missing) == 0,
        "matches": matches,
        "related": related,
        "missing": missing
    }