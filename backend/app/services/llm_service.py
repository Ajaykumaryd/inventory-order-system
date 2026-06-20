"""Thin wrapper around OpenRouter (OpenAI-compatible) for JSON completions.

OpenRouter speaks the OpenAI Chat Completions API, so we reuse the official
``openai`` SDK and just point it at OpenRouter's base URL. The only entry point
is :func:`complete_json`, which asks the model for a single JSON object and
returns the raw assistant text (parsing/validation happens in the caller).
"""

import time
from functools import lru_cache

from fastapi import HTTPException

from ..core.config import settings

# Free OpenRouter models share an upstream pool that frequently returns 429.
# Retry a couple of times with a short, bounded wait before giving up.
_MAX_RETRIES = 2
_MAX_WAIT_SECONDS = 5


@lru_cache(maxsize=1)
def _client():
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=503,
            detail="Analytics is not configured: set OPENROUTER_API_KEY in the environment.",
        )
    # Imported lazily so the app still boots when the dependency/key is absent.
    from openai import OpenAI

    return OpenAI(
        base_url=settings.openrouter_base_url,
        api_key=settings.openrouter_api_key,
    )


def complete_json(system_prompt: str, user_prompt: str) -> str:
    """Send a system + user prompt and return the assistant's raw text reply.

    Requests a JSON object via ``response_format`` and a temperature of 0 for
    deterministic, parseable output.
    """
    client = _client()
    from openai import RateLimitError

    last_exc: Exception | None = None
    resp = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            resp = client.chat.completions.create(
                model=settings.openrouter_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0,
            )
            break
        except RateLimitError as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES:
                time.sleep(min(_MAX_WAIT_SECONDS, 2**attempt))
                continue
            raise HTTPException(
                status_code=429,
                detail=(
                    "The model is rate-limited upstream (common on free models). "
                    "Try again in a moment or switch OPENROUTER_MODEL."
                ),
            )
        except HTTPException:
            raise
        except Exception as exc:  # network / provider / auth errors
            raise HTTPException(status_code=502, detail=f"LLM request failed: {exc}")

    content = resp.choices[0].message.content if resp and resp.choices else None
    if not content:
        raise HTTPException(status_code=502, detail="LLM returned an empty response.")
    return content
