import re


INSTITUTION_WORDS = (
    "university",
    "college",
    "institute",
    "school",
    "academy",
    "faculty",
)


def normalize_education_field(field):
    if not field:
        return ""

    field = field.lower().strip()

    phrases_to_remove = [
        "or a related field",
        "or related field",
        "or a related discipline",
        "or related discipline",
        "or a related area",
        "or related area",
        "or equivalent field",
        "or equivalent",
    ]

    for phrase in phrases_to_remove:
        field = field.replace(phrase, "")

    return " ".join(field.split())


def extract_resume_education(education_text):
    text = education_text.lower()

    degrees = []

    degree_pattern = re.compile(
        r"\b("
        r"bachelor'?s?|bsc|b\.sc|bs|"
        r"master'?s?|msc|m\.sc|ms|"
        r"phd|doctorate"
        r")\b"
        r"(?:\s+degree)?"
        r"(?:\s+of\s+science)?"
        r"(?:\s+of\s+(?:science|arts|engineering))?"
        r"\s+in\s+"
        r"([^\n]+)"
    )

    matches = degree_pattern.finditer(text)

    for match in matches:
        raw_level = match.group(1)
        field = match.group(2).strip()

        if "bachelor" in raw_level or raw_level in {
            "bsc",
            "b.sc",
            "bs",
        }:
            level = "bachelor"

        elif "master" in raw_level or raw_level in {
            "msc",
            "m.sc",
            "ms",
        }:
            level = "master"

        elif "phd" in raw_level or "doctorate" in raw_level:
            level = "doctorate"

        else:
            continue

        institution_pattern = (
            r"\s+\S+(?:\s+\S+){0,4}\s+"
            r"(?:" + "|".join(INSTITUTION_WORDS) + r")\b.*$"
        )

        field = re.sub(
            institution_pattern,
            "",
            field,
            flags=re.IGNORECASE
        )

        field = field.split(",")[0]

        field = re.split(r"\s+\d{4}\b", field)[0]

        field = re.sub(r"\s+", " ", field)
        field = field.strip(" ,.-")

        field = re.sub(
            r"^(?:science|arts|engineering)\s+in\s+",
            "",
            field,
            flags=re.IGNORECASE
        )

        field = normalize_education_field(field)

        if field:
            degrees.append({
                "level": level,
                "field": field
            })

    return {
        "degrees": degrees
    }

def extract_experience_requirement(text):
    text = text.lower()

    patterns = [
        r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",

        r"minimum\s+(\d+)\+?\s*years?\s+(?:of\s+)?experience",

        r"at\s+least\s+(\d+)\+?\s*years?\s+(?:of\s+)?experience",

        r"(?:minimum|at\s+least)?\s*(\d+)\+?\s*years?"
        r"(?:\s+of)?\s+[^.;,\n]+?\s+experience",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)

        if match:
            years = int(match.group(1))

            return {
                "required": True,
                "minimum_years": years
            }

    return {
        "required": False,
        "minimum_years": None
    }

def extract_education_requirement(text):
    text = text.lower()

    required_section_pattern = re.compile(
        r"^\s*(?:required qualifications|required requirements|"
        r"requirements|required)\s*:?\s*$"
        r"(.*?)"
        r"(?=^\s*(?:preferred qualifications|preferred requirements|"
        r"preferred|nice to have|preferred certifications|"
        r"certifications)\s*:?\s*$|\Z)",
        re.IGNORECASE | re.MULTILINE | re.DOTALL
    )

    section_match = required_section_pattern.search(text)

    if section_match:
        required_section = section_match.group(1)
    else:
        required_section = text

    education_pattern = re.compile(
        r"\b("
        r"bachelor'?s?|bsc|b\.sc|bs|"
        r"master'?s?|msc|m\.sc|ms|"
        r"phd|doctorate"
        r")\b"
        r"(?:\s+degree)?"
        r"(?:\s+of\s+science)?"
        r"\s+(?:in|of)\s+"
        r"([^\n.;]+)",
        re.IGNORECASE
    )

    matches = education_pattern.findall(required_section)

    if not matches:
        return {
            "required": False,
            "level": None,
            "fields": []
        }

    education_level = None
    fields = []

    for raw_level, raw_fields in matches:

        raw_level = raw_level.lower().strip()

        if (
            "bachelor" in raw_level
            or raw_level in {"bsc", "b.sc", "bs"}
        ):
            current_level = "bachelor"

        elif (
            "master" in raw_level
            or raw_level in {"msc", "m.sc", "ms"}
        ):
            current_level = "master"

        elif (
            "phd" in raw_level
            or "doctorate" in raw_level
        ):
            current_level = "phd"

        else:
            continue

        if education_level is None:
            education_level = current_level

        field_text = raw_fields.strip()

        field_text = re.sub(
            r"\b(required|preferred|desired|necessary|mandatory)\b",
            "",
            field_text,
            flags=re.IGNORECASE
        )

        field_text = re.sub(
            r"\s+or\s+(?:a\s+)?related\s+"
            r"(?:field|discipline|area|degree)\b.*$",
            "",
            field_text,
            flags=re.IGNORECASE
        )

        field_text = re.sub(
            r"\s+or\s+equivalent(?:\s+field|degree)?\b.*$",
            "",
            field_text,
            flags=re.IGNORECASE
        )

        field_text = re.sub(
            r"\s+",
            " ",
            field_text
        ).strip(" ,.-")

        field_parts = re.split(
            r"\s*,\s*|\s+\b(?:or|and)\b\s+",
            field_text
        )

        for part in field_parts:
            field = re.sub(
                r"^(?:or|and)\s+",
                "",
                part.strip(" ,.-"),
                flags=re.IGNORECASE
            )

            if field and field not in fields:
                fields.append(field)

    if education_level or fields:
        return {
            "required": True,
            "level": education_level,
            "fields": fields
        }

    return {
        "required": False,
        "level": None,
        "fields": []
    }

def extract_certification_requirement(text):
    text = text.lower()

    certifications = []

    section_pattern = re.compile(
        r"^\s*(?:required|preferred)?\s*certifications?\s*:?\s*$"
        r"(.*?)"
        r"(?=^\s*(?:required qualifications|required requirements|"
        r"preferred qualifications|preferred requirements|"
        r"preferred|nice to have|soft skills|education|"
        r"experience|skills)\s*:?\s*$|\Z)",
        re.IGNORECASE | re.MULTILINE | re.DOTALL
    )

    section_matches = section_pattern.findall(text)

    for section in section_matches:

        lines = section.splitlines()

        for line in lines:
            certification = line.strip()

            certification = re.sub(
                r"^[-•*]\s*",
                "",
                certification
            )

            certification = certification.strip(" ,.;:-")

            if not certification:
                continue

            if certification in {
                "none",
                "n/a",
                "not required"
            }:
                continue

            if certification not in certifications:
                certifications.append(certification)

    patterns = [
        r"\b([a-z0-9][^.;,\n]*?\bcertified\b[^.;,\n]*)",
        r"\b([a-z0-9][^.;,\n]*?\bcertification\b[^.;,\n]*)",
    ]

    for pattern in patterns:
        matches = re.findall(
            pattern,
            text,
            re.IGNORECASE
        )

        for match in matches:
            certification = match.strip()

            certification = re.sub(
                r"\b(is|required|preferred|desired|"
                r"mandatory|necessary)\b",
                "",
                certification,
                flags=re.IGNORECASE
            )

            certification = re.sub(
                r"\bcertification\b",
                "",
                certification,
                flags=re.IGNORECASE
            )

            certification = re.sub(
                r"^\s*a\s+",
                "",
                certification,
                flags=re.IGNORECASE
            )

            certification = re.sub(
                r"\s+",
                " ",
                certification
            ).strip(" ,.;:-")

            if (
                certification
                and certification not in certifications
            ):
                certifications.append(certification)

    if certifications:
        return {
            "required": True,
            "certifications": certifications
        }

    return {
        "required": False,
        "certifications": []
    }

def extract_soft_skill_requirements(text):
    text = text.lower()

    soft_skills = [
        "communication",
        "leadership",
        "teamwork",
        "problem solving",
        "critical thinking",
        "adaptability",
        "creativity",
        "time management",
        "organization",
        "attention to detail",
        "decision making",
        "collaboration",
        "interpersonal skills",
        "public speaking",
        "conflict resolution",
    ]

    found_skills = []

    for skill in soft_skills:
        if skill in text:
            found_skills.append(skill)

    return found_skills

def extract_experience_requirements(text):
    text = text.lower()

    patterns = [
        r"experience\s+(?:in|with)\s+([^.;]+)",
        r"background\s+(?:in|with)\s+([^.;]+)",
    ]

    requirements = []

    for pattern in patterns:
        matches = re.findall(pattern, text)

        for match in matches:
            parts = re.split(
                r"\s*,\s*|\s+\b(?:or|and)\b\s+",
                match
            )

            for part in parts:
                experience = part.strip(" ,.-")

                experience = re.sub(
                    r"^(?:or|and)\s+",
                    "",
                    experience,
                    flags=re.IGNORECASE
                )

                experience = re.sub(
                    r"\s+(?:is|required|preferred|desired|mandatory|necessary)\b.*$",
                    "",
                    experience,
                    flags=re.IGNORECASE
                )

                experience = experience.strip(" ,.-")

                if experience and experience not in requirements:
                    requirements.append(experience)

    return requirements