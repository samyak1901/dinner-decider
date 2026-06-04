import json

from sqlalchemy.orm import Session

from backend.models import Meal, MealHistory
from backend.schemas import MealCreate


def create_meal(db: Session, payload: MealCreate) -> Meal:
    """Add a manually entered/imported recipe to the meal pool."""
    meal = Meal(
        name=payload.name,
        cuisine=payload.cuisine,
        is_vegetarian=payload.is_vegetarian,
        recipe_summary=payload.recipe_summary,
        ingredients=json.dumps(payload.ingredients),
        prep_steps=json.dumps(payload.prep_steps),
        estimated_time_minutes=payload.estimated_time_minutes,
        youtube_video_url=payload.youtube_video_url,
        source_url=payload.source_url,
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


def list_meals(db: Session, limit: int = 200) -> list[Meal]:
    """The meal pool, most recent first."""
    return db.query(Meal).order_by(Meal.id.desc()).limit(limit).all()


def get_favourites(db: Session, min_rating: float = 4.0) -> list[dict]:
    """Top-rated meals from history, one row per meal, best first."""
    rows = (
        db.query(MealHistory)
        .filter(MealHistory.rating.isnot(None), MealHistory.winning_meal_id.isnot(None))
        .all()
    )
    by_meal: dict[int, dict] = {}
    for h in rows:
        entry = by_meal.setdefault(
            h.winning_meal_id,
            {"meal": h.winning_meal, "ratings": [], "last_cooked": h.date},
        )
        entry["ratings"].append(h.rating)
        if h.date > entry["last_cooked"]:
            entry["last_cooked"] = h.date

    favourites = []
    for entry in by_meal.values():
        avg = sum(entry["ratings"]) / len(entry["ratings"])
        if avg < min_rating:
            continue
        favourites.append({
            "meal": entry["meal"],
            "avg_rating": round(avg, 2),
            "times_cooked": len(entry["ratings"]),
            "last_cooked": entry["last_cooked"],
        })
    favourites.sort(key=lambda f: (f["avg_rating"], f["last_cooked"]), reverse=True)
    return favourites
