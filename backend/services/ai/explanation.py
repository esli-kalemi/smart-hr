import logging
import os

import openai
from google.genai import errors as genai_errors

from .providers.gemini_provider import generate_gemini_explanation
from .providers.openai_provider import generate_openai_explanation
from .schemas import AIExplanation


logger = logging.getLogger(__name__)


def is_temporary_error(error: Exception) -> bool:
    """
    Identify provider errors that may be temporary
    and worth trying with another AI provider.
    """

    if isinstance(error, ValueError):
        return False

    # Gemini server errors (5xx).
    if isinstance(error, genai_errors.ServerError):
        return True

    # OpenAI temporary errors.
    if isinstance(
        error,
        (
            openai.APIConnectionError,
            openai.RateLimitError,
            openai.InternalServerError,
        ),
    ):
        return True

    # Check HTTP status codes from either provider.
    status_code = getattr(error, "status_code", None)

    if status_code is None:
        status_code = getattr(error, "code", None)

    temporary_status_codes = {
        408,  # Request timeout
        409,  # Conflict
        429,  # Rate limit
        500,
        502,
        503,
        504,
    }

    if status_code in temporary_status_codes:
        return True

    # Generic connection and timeout errors.
    temporary_error_names = (
        "timeout",
        "connectionerror",
        "connecterror",
        "networkerror",
        "transporterror",
    )

    error_name = type(error).__name__.lower()

    return any(name in error_name for name in temporary_error_names)


def generate_explanation(comparison: dict) -> AIExplanation:
    """
    Generate an explanation using Gemini first.

    OpenAI is used as a backup only when Gemini encounters
    a temporary failure and an OpenAI API key is configured.
    """

    try:
        return generate_gemini_explanation(comparison)

    except Exception as gemini_error:

        if not is_temporary_error(gemini_error):
            raise

        if not os.getenv("OPENAI_API_KEY"):
            raise gemini_error

        logger.warning(
            "Gemini temporarily failed. Trying OpenAI as backup. Error: %s",
            gemini_error,
        )

        try:
            return generate_openai_explanation(comparison)

        except Exception as openai_error:
            raise RuntimeError(
                "Both AI providers failed. "
                f"Gemini error: {gemini_error!r}. "
                f"OpenAI error: {openai_error!r}."
            ) from openai_error