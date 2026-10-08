from services.ai.matcher import match_soft_skills


tests = [
    {
        "name": "Exact soft skill",
        "candidate": [
            "communication",
            "teamwork"
        ],
        "required": [
            "communication"
        ]
    },
    {
        "name": "Controlled equivalent",
        "candidate": [
            "collaboration"
        ],
        "required": [
            "teamwork"
        ]
    },
    {
        "name": "Problem solving variation",
        "candidate": [
            "problem-solving"
        ],
        "required": [
            "problem solving"
        ]
    },
    {
        "name": "Semantic match",
        "candidate": [
            "verbal communication"
        ],
        "required": [
            "communication"
        ]
    },
    {
        "name": "Related but not strong enough",
        "candidate": [
            "teamwork"
        ],
        "required": [
            "leadership"
        ]
    },
    {
        "name": "Missing soft skill",
        "candidate": [
            "communication"
        ],
        "required": [
            "leadership"
        ]
    },
    {
        "name": "Multiple requirements",
        "candidate": [
            "communication",
            "collaboration",
            "critical thinking"
        ],
        "required": [
            "communication",
            "teamwork",
            "problem solving"
        ]
    },
    {
        "name": "No candidate soft skills",
        "candidate": [],
        "required": [
            "communication"
        ]
    },
    {
        "name": "No required soft skills",
        "candidate": [
            "communication"
        ],
        "required": []
    }
]


for test in tests:
    print("\n" + "=" * 60)
    print(test["name"])
    print("=" * 60)

    result = match_soft_skills(
        test["candidate"],
        test["required"]
    )

    print(result)