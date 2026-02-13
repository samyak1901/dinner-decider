import json
from datetime import date, datetime, timedelta

from backend.database import SessionLocal
from backend.models import DailySuggestion, Meal, MealHistory, Preference, User


def get_meal_history(days: int = 14) -> str:
    """Get recent meal history to avoid repetition. Returns meals cooked in the last N days."""
    db = SessionLocal()
    try:
        cutoff = date.today() - timedelta(days=days)
        history = (
            db.query(MealHistory)
            .filter(MealHistory.date >= cutoff)
            .order_by(MealHistory.date.desc())
            .all()
        )
        results = []
        for h in history:
            meal = db.query(Meal).get(h.winning_meal_id)
            if meal:
                results.append({
                    "date": h.date.isoformat(),
                    "meal_name": meal.name,
                    "cuisine": meal.cuisine,
                    "is_vegetarian": meal.is_vegetarian,
                    "rating": h.rating,
                })

        # Also get today's and recent suggestions (even if not yet finalized)
        recent_cutoff = date.today() - timedelta(days=7)
        suggestions = (
            db.query(DailySuggestion)
            .filter(DailySuggestion.date >= recent_cutoff)
            .all()
        )
        recent_meals = []
        for s in suggestions:
            meal = db.query(Meal).get(s.meal_id)
            if meal:
                recent_meals.append({
                    "date": s.date.isoformat(),
                    "meal_name": meal.name,
                    "cuisine": meal.cuisine,
                })

        return json.dumps({
            "cooked_meals": results,
            "recently_suggested": recent_meals,
        }, indent=2)
    finally:
        db.close()


def get_user_preferences() -> str:
    """Get cuisine preference scores for all users. Scores range from 0.0 (dislike) to 1.0 (love), with 0.5 as neutral."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        result = {}
        for user in users:
            prefs = (
                db.query(Preference)
                .filter(Preference.user_id == user.id)
                .all()
            )
            result[user.name] = {
                "is_vegetarian": user.is_vegetarian,
                "preferences": {
                    p.cuisine: round(p.preference_score, 2) for p in prefs
                },
            }
        return json.dumps(result, indent=2)
    finally:
        db.close()


def get_current_season() -> str:
    """Get current month, season, and seasonal ingredient suggestions for meal planning."""
    now = datetime.now()
    month = now.strftime("%B")
    month_num = now.month

    if month_num in (12, 1, 2):
        season = "Winter"
        ingredients = [
            "root vegetables", "squash", "citrus fruits", "cabbage",
            "sweet potatoes", "cauliflower", "leeks", "turnips",
        ]
    elif month_num in (3, 4, 5):
        season = "Spring"
        ingredients = [
            "asparagus", "peas", "artichokes", "radishes",
            "spring onions", "new potatoes", "spinach", "herbs",
        ]
    elif month_num in (6, 7, 8):
        season = "Summer"
        ingredients = [
            "tomatoes", "corn", "zucchini", "bell peppers",
            "eggplant", "cucumbers", "berries", "fresh herbs",
        ]
    else:
        season = "Autumn"
        ingredients = [
            "pumpkin", "mushrooms", "apples", "Brussels sprouts",
            "butternut squash", "beets", "kale", "figs",
        ]

    return json.dumps({
        "month": month,
        "season": season,
        "seasonal_ingredients": ingredients,
    })
