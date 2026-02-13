import json
import logging
import re

from google.adk.runners import InMemoryRunner
from google.adk.sessions import Session
from google.genai import types

from backend.agent.meal_agent import create_meal_agent
from backend.database import SessionLocal
from backend.models import User

logger = logging.getLogger(__name__)


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


async def generate_meal_suggestions() -> list[dict]:
    """Run the ADK agent and return parsed meal suggestions."""
    # Fetch live household context from DB
    db = SessionLocal()
    try:
        users = db.query(User).all()
        num_people = len(users) if users else 2
        if not users:
            household_context = "- No users registered. Suggest generally healthy, diverse meals."
        else:
            lines = []
            for u in users:
                rules = u.dietary_restrictions if u.dietary_restrictions else "No specific restrictions"
                lines.append(f"- {u.name}: {'Vegetarian' if u.is_vegetarian else 'Omnivore'}. {rules}")
            household_context = "\n".join(lines)
    finally:
        db.close()

    agent = create_meal_agent(household_context=household_context, num_people=num_people)
    runner = InMemoryRunner(agent=agent, app_name="dinner_decider")

    session = await runner.session_service.create_session(
        app_name="dinner_decider",
        user_id="system",
    )

    user_message = types.Content(
        role="user",
        parts=[types.Part(text=f"The household consists of:\n{household_context}\n\nGenerate 3 dinner suggestions for tonight. Use the tools to check meal history, user preferences, and current season first, then search for real recipes and YouTube videos.")],
    )

    final_text = ""
    async for event in runner.run_async(
        user_id="system",
        session_id=session.id,
        new_message=user_message,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_text += part.text

    if not final_text:
        raise RuntimeError("Agent returned no response")

    logger.info("Agent response length: %d chars", len(final_text))
    meals = _extract_json(final_text)

    if not isinstance(meals, list) or len(meals) == 0:
        raise ValueError("Agent did not return a list of meals")

    return meals
