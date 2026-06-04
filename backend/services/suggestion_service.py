import json
import logging
from datetime import date

from sqlalchemy.orm import Session

from backend.agent.postprocess import (
    enforce_dietary_safety,
    meal_to_dict,
    seed_meals,
    validate_meals,
)
from backend.models import DailySuggestion, Meal, User

logger = logging.getLogger(__name__)


def _save_meal(db: Session, meal_data: dict, is_veg: bool) -> Meal:
    meal = Meal(
        name=meal_data["name"],
        cuisine=meal_data.get("cuisine"),
        is_vegetarian=is_veg,
        recipe_summary=meal_data.get("recipe_summary"),
        ingredients=json.dumps(meal_data.get("ingredients", [])),
        prep_steps=json.dumps(meal_data.get("prep_steps", [])),
        estimated_time_minutes=meal_data.get("estimated_time_minutes"),
        youtube_video_url=meal_data.get("youtube_video_url"),
        youtube_video_title=meal_data.get("youtube_video_title"),
        source_url=meal_data.get("source_url"),
    )
    db.add(meal)
    db.flush()
    return meal


def _last_known_good(db: Session, users) -> list[dict]:
    """Reuse the most recent prior day's suggestions as a fallback."""
    today = date.today()
    prior_date = (
        db.query(DailySuggestion.date)
        .filter(DailySuggestion.date < today)
        .order_by(DailySuggestion.date.desc())
        .limit(1)
        .scalar()
    )
    if not prior_date:
        return []
    prior = (
        db.query(DailySuggestion)
        .filter(DailySuggestion.date == prior_date)
        .order_by(DailySuggestion.slot_number)
        .all()
    )
    meals = []
    for s in prior:
        meal = meal_to_dict(s.meal)
        if s.veg_alternative:
            meal["veg_alternative"] = meal_to_dict(s.veg_alternative)
        meals.append(meal)
    return enforce_dietary_safety(validate_meals(meals), users)


def _resolve_meals(db: Session, raw: list[dict] | None, users) -> tuple[list[dict], str]:
    """Apply validation + dietary safety, then fall through to last-known-good
    and finally the built-in seed menu so we always have something to show."""
    meals = enforce_dietary_safety(validate_meals(raw), users)
    if meals:
        return meals[:3], "agent"

    meals = _last_known_good(db, users)
    if meals:
        return meals[:3], "last_known_good"

    meals = enforce_dietary_safety(seed_meals(), users)
    return meals[:3], "seed"


async def generate_and_save_suggestions(db: Session) -> list[DailySuggestion]:
    """Run the AI agent and save results, falling back so the page is never
    empty and never wiping today's suggestions unless we have a replacement."""
    from backend.agent.runner import generate_meal_suggestions

    today = date.today()
    users = db.query(User).all()

    try:
        raw = await generate_meal_suggestions()
    except Exception:
        logger.exception("Agent generation failed; falling back")
        raw = None

    meals_data, source = _resolve_meals(db, raw, users)

    if not meals_data:
        # Every source came up empty (e.g. allergies rule everything out).
        # Leave any existing suggestions in place rather than blanking the page.
        logger.error("No valid meals from any source; keeping existing suggestions")
        return (
            db.query(DailySuggestion)
            .filter(DailySuggestion.date == today)
            .order_by(DailySuggestion.slot_number)
            .all()
        )

    # We have a replacement set — now it's safe to swap.
    db.query(DailySuggestion).filter(DailySuggestion.date == today).delete()
    db.flush()

    suggestions = []
    for i, meal_data in enumerate(meals_data[:3], start=1):
        is_veg = meal_data.get("is_vegetarian", False)
        meal = _save_meal(db, meal_data, is_veg)

        veg_alt_id = None
        veg_alt_data = meal_data.get("veg_alternative")
        if veg_alt_data and not is_veg:
            veg_meal = _save_meal(db, veg_alt_data, True)
            veg_alt_id = veg_meal.id

        suggestion = DailySuggestion(
            date=today,
            meal_id=meal.id,
            veg_alternative_meal_id=veg_alt_id,
            slot_number=i,
        )
        db.add(suggestion)
        suggestions.append(suggestion)

    db.commit()
    logger.info(
        "Saved %d suggestions for %s (source=%s)", len(suggestions), today, source
    )
    return suggestions
