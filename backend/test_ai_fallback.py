from unittest.mock import patch

from services.ai.explanation import generate_explanation
from services.ai.schemas import AIExplanation


fake_explanation = AIExplanation(
    summary="The candidate is a good match for this position.",
    strengths=["Python", "SQL"],
    gaps=["AWS certification"],
    experience_explanation="Relevant experience was identified.",
    education_explanation="Education requirements are satisfied.",
    certification_explanation="One certification gap was identified.",
    soft_skills_explanation="Soft skills information is available.",
    recommendations=["Review the candidate's AWS experience."],
)


def test_openai_fallback():
    with patch(
        "services.ai.explanation.generate_gemini_explanation",
        side_effect=TimeoutError("Gemini timed out"),
    ) as mock_gemini:

        with patch(
            "services.ai.explanation.generate_openai_explanation",
            return_value=fake_explanation,
        ) as mock_openai:

            with patch.dict("os.environ", {"OPENAI_API_KEY": "fake-test-key"}):

                result = generate_explanation({"skills": ["Python", "SQL"]})

                assert result == fake_explanation

                mock_gemini.assert_called_once()
                mock_openai.assert_called_once()

                print("Gemini fallback to OpenAI: SUCCESS")

def test_gemini_success():
    with patch(
        "services.ai.explanation.generate_gemini_explanation",
        return_value=fake_explanation,
    ) as mock_gemini:

        with patch(
            "services.ai.explanation.generate_openai_explanation",
        ) as mock_openai:

            result = generate_explanation({"skills": ["Python", "SQL"]})

            assert result == fake_explanation

            mock_gemini.assert_called_once()
            mock_openai.assert_not_called()

            print("Gemini primary provider: SUCCESS")

def test_fallback_without_openai_key():
    with patch(
        "services.ai.explanation.generate_gemini_explanation",
        side_effect=TimeoutError("Gemini timed out"),
    ):

        with patch(
            "services.ai.explanation.generate_openai_explanation",
        ) as mock_openai:

            with patch.dict("os.environ", {}, clear=True):

                try:
                    generate_explanation({"skills": ["Python"]})

                except TimeoutError as error:
                    assert str(error) == "Gemini timed out"
                    mock_openai.assert_not_called()

                    print("Fallback disabled without API key: SUCCESS")

                else:
                    raise AssertionError("Expected Gemini timeout was not raised.")

def test_no_fallback_for_invalid_api_key():
    from google.genai.errors import ClientError

    invalid_key_error = ClientError(
        401,
        {"error": {"message": "Invalid API key"}}
    )

    with patch(
        "services.ai.explanation.generate_gemini_explanation",
        side_effect=invalid_key_error,
    ):

        with patch(
            "services.ai.explanation.generate_openai_explanation",
        ) as mock_openai:

            with patch.dict(
                "os.environ",
                {"OPENAI_API_KEY": "fake-test-key"},
            ):

                try:
                    generate_explanation({"skills": ["Python"]})

                except ClientError:
                    mock_openai.assert_not_called()
                    print("Invalid Gemini API key: fallback correctly skipped")

                else:
                    raise AssertionError(
                        "Expected Gemini authentication error."
                    )
                
if __name__ == "__main__":
    test_openai_fallback()
    test_gemini_success()
    test_fallback_without_openai_key()
    test_no_fallback_for_invalid_api_key()