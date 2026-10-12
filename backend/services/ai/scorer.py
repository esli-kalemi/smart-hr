
WEIGHTS = {
    "skills": 0.35,
    "experience": 0.25,
    "education": 0.15,
    "certifications": 0.10,
    "soft_skills": 0.15,
}


def calculate_score(comparison):
    """
    Calculate the overall candidate match score.

    Each category must provide a score from 0 to 100.
    Categories with no requirements are excluded, and
    the remaining weights are normalized.
    """

    category_scores = {}
    applicable_weights = {}

    for category, weight in WEIGHTS.items():
        result = comparison.get(category)

        if not result:
            continue

        # Categories with no requirements should not
        # penalize or artificially reward a candidate.
        if result.get("required") is False:
            continue

        score = result.get("score")

        if score is None:
            continue

        score = max(0, min(100, float(score)))

        category_scores[category] = score
        applicable_weights[category] = weight

    total_weight = sum(applicable_weights.values())

    if total_weight == 0:
        return {
            "overall_score": None,
            "category_scores": {},
            "weights_used": {},
            "message": "No scorable requirements were provided."
        }

    overall_score = sum(
        category_scores[category] * weight
        for category, weight in applicable_weights.items()
    ) / total_weight

    return {
        "overall_score": round(overall_score, 2),
        "category_scores": category_scores,
        "weights_used": {
            category: round(weight / total_weight, 4)
            for category, weight in applicable_weights.items()
        },
        "message": "Score calculated successfully."
    }

def score_skill_matches(skill_result):
    """
    Convert skill matcher results into a score from 0 to 100.

    Exact and strong semantic matches receive full credit.
    Related skills receive partial credit.
    Missing skills receive no credit.
    """

    matches = skill_result.get("matches", [])
    related_skills = skill_result.get("related_skills", [])
    missing_skills = skill_result.get("missing_skills", [])

    total = (
        len(matches)
        + len(related_skills)
        + len(missing_skills)
    )

    if total == 0:
        return None

    matched_points = sum(
        1.0 if match.get("type") in ("exact", "strong_semantic")
        else 0.0
        for match in matches
    )

    related_points = len(related_skills) * 0.5

    score = (
        (matched_points + related_points) / total
    ) * 100

    return round(score, 2)


def score_experience(experience_result):
    """
    Score years of experience and relevant experience types.

    Years and experience types each contribute 50% when
    both are required. If only one is provided, score it
    independently.
    """

    years = experience_result.get("years", {})
    types = experience_result.get("types", {})

    required_years = years.get("required")
    candidate_years = years.get("candidate")

    years_score = None

    if required_years is not None:
        if required_years <= 0:
            years_score = 100
        elif candidate_years is not None :
            years_score = min(
                100,
                (candidate_years / required_years) * 100
            )

    matches = types.get("matches", [])
    related = types.get("related", [])
    missing = types.get("missing", [])

    total_types = len(matches) + len(related) + len(missing)

    types_score = None

    if total_types > 0:
        types_points = (
            len(matches) + (len(related) * 0.5)
        )

        types_score = (
            types_points / total_types
        ) * 100

    available_scores = []

    if years_score is not None:
        available_scores.append(years_score)

    if types_score is not None:
        available_scores.append(types_score)

    if not available_scores:
        return None

    return round(
        sum(available_scores) / len(available_scores),
        2
    )


def score_education(education_result):
    """
    Convert education matching results into a score from 0 to 100.

    Degree level and field of study contribute equally when
    both are required. Related fields receive partial credit.
    """

    level = education_result.get("level", {})
    field = education_result.get("field", {})

    level_score = None

    required_level = level.get("required")
    candidate_levels = level.get("candidate", [])

    if required_level is not None:
        if isinstance(candidate_levels, str):
            candidate_levels = [candidate_levels]

        level_score = (
            100
            if required_level in candidate_levels
            else 0
        )

    field_score = None

    required_fields = field.get("required", [])
    field_type = field.get("type")

    if required_fields:
        if field_type in ("exact", "strong_semantic"):
            field_score = 100
        elif field_type == "related":
            field_score = 50
        else:
            field_score = 0

    available_scores = []

    if level_score is not None:
        available_scores.append(level_score)

    if field_score is not None:
        available_scores.append(field_score)

    if not available_scores:
        return None

    return round(
        sum(available_scores) / len(available_scores),
        2
    )


def score_certifications(certification_result):
    """
    Calculate the certification score from matcher results.
    """

    matches = certification_result.get("matches", [])
    missing = certification_result.get("missing", [])

    total = len(matches) + len(missing)

    if total == 0:
        return None

    score = (len(matches) / total) * 100

    return round(score, 2)


def score_soft_skills(soft_skill_result):
    """
    Calculate a soft-skills score from matcher results.

    Exact and strong semantic matches receive full credit.
    Related skills receive partial credit.
    Missing skills receive zero credit.
    """

    matches = soft_skill_result.get("matches", [])
    related = soft_skill_result.get("related", [])
    missing = soft_skill_result.get("missing", [])

    total = len(matches) + len(related) + len(missing)

    if total == 0:
        return None

    matched_points = sum(
        1.0 if match.get("type") in ("exact", "strong_semantic")
        else 0.0
        for match in matches
    )

    related_points = len(related) * 0.5

    score = (
        (matched_points + related_points) / total
    ) * 100

    return round(score, 2)


def score_candidate(comparison):
    """
    Calculate category scores and the overall candidate score.

    Expected input:
    {
        "skills": {
            "required": True,
            "result": {...}
        },
        "experience": {
            "required": True,
            "result": {...}
        },
        "education": {
            "required": True,
            "result": {...}
        },
        "certifications": {
            "required": False,
            "result": {...}
        },
        "soft_skills": {
            "required": True,
            "result": {...}
        }
    }
    """

    category_scorers = {
        "skills": score_skill_matches,
        "experience": score_experience,
        "education": score_education,
        "certifications": score_certifications,
        "soft_skills": score_soft_skills,
    }

    category_scores = {}
    applicable_weights = {}

    for category, scorer in category_scorers.items():
        category_data = comparison.get(category)

        if not category_data:
            continue

        if category_data.get("required") is False:
            continue

        result = category_data.get("result", {})

        score = scorer(result)

        if score is None:
            continue

        category_scores[category] = score
        applicable_weights[category] = WEIGHTS[category]

    total_weight = sum(applicable_weights.values())

    if total_weight == 0:
        return {
            "overall_score": None,
            "category_scores": {},
            "weights_used": {},
            "message": "No scorable requirements were provided."
        }

    overall_score = sum(
        category_scores[category] * weight
        for category, weight in applicable_weights.items()
    ) / total_weight

    return {
        "overall_score": round(overall_score, 2),
        "category_scores": category_scores,
        "weights_used": {
            category: round(weight / total_weight, 4)
            for category, weight in applicable_weights.items()
        },
        "message": "Score calculated successfully."
    }
