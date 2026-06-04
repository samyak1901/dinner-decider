"""Post-processing for agent output: validation, dietary safety, and fallbacks.

The LLM is treated as untrusted: its output is validated and repaired here, and
dietary/allergy rules are enforced server-side rather than relying on the prompt.
All functions in this module are pure (no LLM, no network) so they are unit
tested without calling Gemini.
"""

import json
import logging
import re
from typing import Any

from pydantic import BaseModel, ValidationError, field_validator

logger = logging.getLogger(__name__)


class AgentMeal(BaseModel):
    """Lenient schema for a single meal coming back from the agent.

    A missing/blank ``name`` drops the meal; everything else is repaired
    (absurd times nulled, non-list ingredients coerced to ``[]``).
    """

    name: str
    cuisine: str | None = None
    is_vegetarian: bool = False
    recipe_summary: str | None = None
    ingredients: list[Any] = []
    prep_steps: list[Any] = []
    estimated_time_minutes: int | None = None
    youtube_video_url: str | None = None
    youtube_video_title: str | None = None
    source_url: str | None = None
    veg_alternative: "AgentMeal | None" = None

    @field_validator("name", mode="before")
    @classmethod
    def _require_name(cls, v):
        if not isinstance(v, str) or not v.strip():
            raise ValueError("meal name is required")
        return v.strip()

    @field_validator("estimated_time_minutes", mode="before")
    @classmethod
    def _clamp_time(cls, v):
        try:
            v = int(v)
        except (TypeError, ValueError):
            return None
        return v if 1 <= v <= 600 else None

    @field_validator("ingredients", "prep_steps", mode="before")
    @classmethod
    def _coerce_list(cls, v):
        return v if isinstance(v, list) else []


AgentMeal.model_rebuild()


def validate_meals(raw: list[dict] | None) -> list[dict]:
    """Validate/repair raw agent meals, dropping any that fail."""
    out: list[dict] = []
    for item in raw or []:
        if not isinstance(item, dict):
            continue
        try:
            out.append(AgentMeal.model_validate(item).model_dump())
        except ValidationError as exc:
            logger.warning(
                "Dropping invalid meal %r: %s",
                item.get("name") if isinstance(item, dict) else item,
                exc.errors()[:1],
            )
    return out


# --- Dietary safety (server-side, not prompt-only) ---

_STOPWORDS = {
    "allergic", "allergy", "allergies", "free", "none", "specific",
    "restriction", "restrictions", "avoid", "dislike", "dislikes", "prefer",
    "please", "only", "with", "without", "from", "intolerant", "intolerance",
}


def _allergen_terms(users) -> set[str]:
    """Crude allergen keywords pulled from each member's dietary_restrictions.

    This is a best-effort safety net (and logged when it fires) — not a
    guarantee. Tokens are lowercased, stripped of a trailing 's', and short
    or stopword tokens are ignored.
    """
    terms: set[str] = set()
    for user in users:
        text = getattr(user, "dietary_restrictions", None)
        if not text:
            continue
        for tok in re.split(r"[^a-zA-Z]+", text.lower()):
            if len(tok) >= 4 and tok not in _STOPWORDS:
                terms.add(tok.rstrip("s"))
    return terms


def _ingredient_text(meal: dict) -> str:
    parts: list[str] = []
    for ing in meal.get("ingredients") or []:
        if isinstance(ing, str):
            parts.append(ing.lower())
        elif isinstance(ing, dict):
            parts.append(" ".join(str(v) for v in ing.values()).lower())
    return " ".join(parts)


def _has_allergen(meal: dict, terms: set[str]) -> bool:
    if not terms:
        return False
    text = _ingredient_text(meal)
    return any(term in text for term in terms)


def enforce_dietary_safety(meals: list[dict], users) -> list[dict]:
    """Drop/repair suggestions that violate household dietary rules.

    - If any member is vegetarian, every kept suggestion must be vegetarian or
      carry a vegetarian alternative.
    - Suggestions whose ingredients match a declared allergy are dropped; an
      allergen-laden veg alternative is removed (which may then drop the whole
      suggestion via the rule above).
    """
    has_veg_member = any(getattr(u, "is_vegetarian", False) for u in users)
    terms = _allergen_terms(users)
    safe: list[dict] = []
    for meal in meals:
        if _has_allergen(meal, terms):
            logger.warning(
                "Dropping meal %r — ingredients match a declared allergy",
                meal.get("name"),
            )
            continue

        alt = meal.get("veg_alternative")
        if alt and _has_allergen(alt, terms):
            logger.warning(
                "Removing veg alternative of %r — matches a declared allergy",
                meal.get("name"),
            )
            meal = {**meal, "veg_alternative": None}

        if has_veg_member and not (meal.get("is_vegetarian") or meal.get("veg_alternative")):
            logger.warning(
                "Dropping meal %r — no vegetarian option for a vegetarian member",
                meal.get("name"),
            )
            continue

        safe.append(meal)
    return safe


# --- Fallbacks so the home page is never empty ---

SEED_MEALS: list[dict] = [
    {
        "name": "Vegetable Fried Rice",
        "cuisine": "Asian",
        "is_vegetarian": True,
        "recipe_summary": "Quick weeknight fried rice with mixed vegetables.",
        "ingredients": ["cooked rice", "mixed vegetables", "peas", "carrots", "spring onion", "oil"],
        "prep_steps": ["Heat oil", "Stir-fry vegetables", "Add rice and toss", "Season and serve"],
        "estimated_time_minutes": 25,
    },
    {
        "name": "Tomato Basil Pasta",
        "cuisine": "Italian",
        "is_vegetarian": True,
        "recipe_summary": "Simple pasta in a fresh tomato and basil sauce.",
        "ingredients": ["pasta", "tomatoes", "garlic", "basil", "olive oil"],
        "prep_steps": ["Boil pasta", "Simmer tomato sauce with garlic", "Toss with basil", "Serve"],
        "estimated_time_minutes": 30,
    },
    {
        "name": "Chickpea & Spinach Curry",
        "cuisine": "Indian",
        "is_vegetarian": True,
        "recipe_summary": "Hearty chickpea curry with spinach.",
        "ingredients": ["chickpeas", "spinach", "tomatoes", "onion", "ginger", "curry spices"],
        "prep_steps": ["Saute onion and spices", "Add tomato and chickpeas", "Stir in spinach", "Simmer and serve"],
        "estimated_time_minutes": 35,
    },
]


def seed_meals() -> list[dict]:
    """A fresh copy of the built-in vegetarian fallback menu."""
    return validate_meals(json.loads(json.dumps(SEED_MEALS)))


def meal_to_dict(meal) -> dict:
    """Reconstruct the agent-style dict from a stored Meal row (for reusing
    the previous day's suggestions as a last-known-good fallback)."""
    def _loads(value):
        try:
            return json.loads(value) if value else []
        except (TypeError, json.JSONDecodeError):
            return []

    return {
        "name": meal.name,
        "cuisine": meal.cuisine,
        "is_vegetarian": meal.is_vegetarian,
        "recipe_summary": meal.recipe_summary,
        "ingredients": _loads(meal.ingredients),
        "prep_steps": _loads(meal.prep_steps),
        "estimated_time_minutes": meal.estimated_time_minutes,
        "youtube_video_url": meal.youtube_video_url,
        "youtube_video_title": meal.youtube_video_title,
        "source_url": meal.source_url,
    }
