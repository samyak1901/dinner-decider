import json
import logging
from datetime import date

from sqlalchemy.orm import Session

from backend.models import DailySuggestion, Meal

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


async def generate_and_save_suggestions(db: Session) -> list[DailySuggestion]:
    """Run the AI agent and save results to the database."""
    from backend.agent.runner import generate_meal_suggestions

    today = date.today()

    # Delete existing suggestions for today (refresh)
    db.query(DailySuggestion).filter(DailySuggestion.date == today).delete()
    db.flush()

    meals_data = await generate_meal_suggestions()

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
    logger.info("Saved %d suggestions for %s", len(suggestions), today)
    return suggestions
