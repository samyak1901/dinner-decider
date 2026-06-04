import json
import logging
import re
import time

from google.adk.runners import InMemoryRunner
from google.genai import types

from backend.agent.meal_agent import create_meal_agent
from backend.database import SessionLocal
from backend.models import User

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3

_STRICT_SUFFIX = (
    "\n\nIMPORTANT: Respond with ONLY a JSON array of exactly 3 meal objects. "
    "No prose, no explanation, no markdown fences — just the raw JSON array."
)


def _extract_json(text: str) -> list[dict]:
    """Extract JSON array from agent response, handling markdown fences."""
    # Try direct parse first
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding array brackets
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from agent response: {text[:200]}...")


def _build_household_context() -> tuple[str, int]:
    """Assemble the household description sent to the agent."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        num_people = len(users) if users else 2
        if not users:
            return "- No users registered. Suggest generally healthy, diverse meals.", num_people
        lines = []
        for u in users:
            rules = u.dietary_restrictions if u.dietary_restrictions else "No specific restrictions"
            lines.append(f"- {u.name}: {'Vegetarian' if u.is_vegetarian else 'Omnivore'}. {rules}")
        return "\n".join(lines), num_people
    finally:
        db.close()


async def _run_agent_once(household_context: str, num_people: int, strict: bool) -> str:
    """One agent invocation; returns the concatenated final text and logs token usage."""
    agent = create_meal_agent(household_context=household_context, num_people=num_people)
    runner = InMemoryRunner(agent=agent, app_name="dinner_decider")

    session = await runner.session_service.create_session(
        app_name="dinner_decider",
        user_id="system",
    )

    prompt = (
        f"The household consists of:\n{household_context}\n\n"
        "Generate 3 dinner suggestions for tonight. Use the tools to check meal "
        "history, user preferences, and current season first, then search for real "
        "recipes and YouTube videos."
    )
    if strict:
        prompt += _STRICT_SUFFIX

    user_message = types.Content(role="user", parts=[types.Part(text=prompt)])

    final_text = ""
    total_tokens = 0
    async for event in runner.run_async(
        user_id="system",
        session_id=session.id,
        new_message=user_message,
    ):
        usage = getattr(event, "usage_metadata", None)
        if usage is not None:
            total_tokens = getattr(usage, "total_token_count", total_tokens) or total_tokens
        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_text += part.text

    if total_tokens:
        logger.info("Agent token usage: %d total tokens", total_tokens)
    return final_text


async def generate_meal_suggestions() -> list[dict]:
    """Run the ADK agent with retries and return parsed (unvalidated) meals.

    Retries with a stricter JSON-only reprompt when the response can't be parsed
    into a non-empty list. Raises after MAX_ATTEMPTS so the caller can fall back
    to last-known-good / seed meals rather than showing an empty page.
    """
    household_context, num_people = _build_household_context()
    last_error: Exception | None = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.monotonic()
        try:
            text = await _run_agent_once(
                household_context, num_people, strict=attempt > 1
            )
            elapsed = time.monotonic() - started
            if not text:
                raise RuntimeError("Agent returned no response")
            meals = _extract_json(text)
            if not isinstance(meals, list) or not meals:
                raise ValueError("Agent did not return a non-empty list of meals")
            logger.info(
                "Agent generation succeeded: attempt=%d latency=%.1fs meals=%d chars=%d",
                attempt, elapsed, len(meals), len(text),
            )
            return meals
        except Exception as exc:  # noqa: BLE001 — retry on any failure
            last_error = exc
            logger.warning(
                "Agent generation attempt %d/%d failed (%.1fs): %s",
                attempt, MAX_ATTEMPTS, time.monotonic() - started, exc,
            )

    raise RuntimeError(
        f"Agent generation failed after {MAX_ATTEMPTS} attempts: {last_error}"
    )
