import json
import re
import time

from openai import APITimeoutError, OpenAI, RateLimitError

from . import config


class LLMError(Exception):
    pass


_client = None


def _get_client() -> OpenAI:
    global _client
    if not config.LLM_API_KEY:
        raise LLMError("LLM_API_KEY is not set. Add it to backend/.env")
    if _client is None:
        _client = OpenAI(
            api_key=config.LLM_API_KEY,
            base_url=config.LLM_BASE_URL,
            timeout=config.LLM_TIMEOUT,
            max_retries=1,
        )
    return _client


def _parse_json(text: str) -> dict:
    text = text.strip()
    # Some models wrap JSON in ```json ... ``` even when asked not to
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def chat_json(system: str, user: str, retries: int = 1) -> dict:
    """Send a prompt and return the model's reply as a dict. Retries once if the JSON is broken."""
    client = _get_client()
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    last_error = None

    extra = {}
    if config.LLM_REASONING_EFFORT:
        extra["reasoning_effort"] = config.LLM_REASONING_EFFORT

    for _ in range(retries + 1):
        started = time.time()
        try:
            response = client.chat.completions.create(
                model=config.LLM_MODEL,
                messages=messages,
                temperature=config.LLM_TEMPERATURE,
                response_format={"type": "json_object"},
                **extra,
            )
        except APITimeoutError as e:
            raise LLMError(
                f"The AI model took longer than {int(config.LLM_TIMEOUT)} seconds. Try again in a moment."
            ) from e
        except RateLimitError as e:
            raise LLMError("Free tier limit reached. Wait about a minute and try again.") from e
        except Exception as e:
            raise LLMError(f"LLM request failed: {e}") from e

        print(f"[llm] {config.LLM_MODEL} replied in {time.time() - started:.1f}s")

        content = response.choices[0].message.content or ""
        try:
            return _parse_json(content)
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            messages.append({"role": "assistant", "content": content})
            messages.append({"role": "user", "content": "That was not valid JSON. Reply again with valid JSON only."})

    raise LLMError(f"Model did not return valid JSON: {last_error}")