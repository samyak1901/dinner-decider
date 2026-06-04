import json
from datetime import date, timedelta

from backend.models import MealHistory, PlannedMeal, Vote
from backend.schemas import MealCreate
from backend.services.history_service import mark_leftovers
from backend.services.meal_service import create_meal, get_favourites, list_meals
from backend.services.plan_service import get_week, pin_meal, unpin
from backend.services.shopping_service import build_shopping_list
from backend.services.vote_service import finalize_votes
from tests.conftest import make_suggestion, make_user


# --- feature 6: recipe import / meal pool ---

def test_create_meal_serializes_lists(db):
    meal = create_meal(db, MealCreate(
        name="My Dal", cuisine="Indian", is_vegetarian=True,
        ingredients=["lentils", "onion"], prep_steps=["boil", "temper"],
        estimated_time_minutes=40,
    ))
    assert json.loads(meal.ingredients) == ["lentils", "onion"]
    assert json.loads(meal.prep_steps) == ["boil", "temper"]
    assert meal in list_meals(db)


# --- feature 1: weekly plan + pin ---

def test_pin_overrides_history_in_week(db):
    today = date.today()
    s = make_suggestion(db, 1, name="AI Pick")
    db.add(MealHistory(date=today, winning_meal_id=s.meal_id, total_votes=1, was_cooked=True))
    db.commit()
    pinned = create_meal(db, MealCreate(name="My Choice", ingredients=["x"]))

    pin_meal(db, today, pinned.id, note="craving this")
    week = get_week(db, today, days=1)
    assert week[0]["source"] == "planned"
    assert week[0]["meal"].name == "My Choice"
    assert week[0]["is_pinned"] is True


def test_week_falls_back_to_history_then_none(db):
    today = date.today()
    s = make_suggestion(db, 1, name="Cooked Thing", on=today)
    db.add(MealHistory(date=today, winning_meal_id=s.meal_id, total_votes=2, was_cooked=True))
    db.commit()
    week = get_week(db, today, days=2)
    assert week[0]["source"] == "history" and week[0]["meal"].name == "Cooked Thing"
    assert week[1]["source"] == "none" and week[1]["meal"] is None


def test_unpin_removes_plan(db):
    today = date.today()
    m = create_meal(db, MealCreate(name="Pinned", ingredients=[]))
    pin_meal(db, today, m.id, None)
    assert unpin(db, today) is True
    assert db.query(PlannedMeal).filter(PlannedMeal.date == today).count() == 0


# --- feature 2: shopping list ---

def test_shopping_list_aggregates_and_dedupes(db):
    today = date.today()
    m1 = create_meal(db, MealCreate(name="Pasta", ingredients=["Tomato", "garlic", "pasta"]))
    m2 = create_meal(db, MealCreate(name="Curry", ingredients=["tomato", "lentils"]))
    pin_meal(db, today, m1.id, None)
    pin_meal(db, today + timedelta(days=1), m2.id, None)

    items = build_shopping_list(db, today, days=2)
    by_item = {i["item"].lower(): i for i in items}
    # "Tomato"/"tomato" deduped case-insensitively, contributed by both meals
    assert sorted(by_item["tomato"]["meals"]) == ["Curry", "Pasta"]
    assert set(by_item) == {"tomato", "garlic", "pasta", "lentils"}


# --- feature 3: favourites ---

def test_favourites_ranked_and_filtered(db):
    today = date.today()
    great = make_suggestion(db, 1, name="Great Meal", on=today - timedelta(days=1))
    meh = make_suggestion(db, 2, name="Meh Meal", on=today - timedelta(days=2))
    db.add(MealHistory(date=today - timedelta(days=1), winning_meal_id=great.meal_id, rating=5.0, was_cooked=True))
    db.add(MealHistory(date=today - timedelta(days=2), winning_meal_id=meh.meal_id, rating=2.0, was_cooked=True))
    db.commit()

    favs = get_favourites(db)
    names = [f["meal"].name for f in favs]
    assert names == ["Great Meal"]  # meh (2.0) filtered out, great kept
    assert favs[0]["avg_rating"] == 5.0
    assert favs[0]["times_cooked"] == 1


# --- feature 5: leftovers ---

def test_mark_leftovers_creates_no_cook_record(db):
    today = date.today()
    h = mark_leftovers(db, today)
    assert h.winning_meal_id is None
    assert h.was_cooked is False


def test_leftovers_blocks_finalize_and_preference_nudge(db):
    today = date.today()
    s = make_suggestion(db, 1, cuisine="Thai")
    user = make_user(db, "A")
    db.add(Vote(date=today, daily_suggestion_id=s.id, user_id=user.id))
    db.commit()

    mark_leftovers(db, today)   # mark before finalize
    finalize_votes(db)          # must not override the leftovers record

    records = db.query(MealHistory).filter(MealHistory.date == today).all()
    assert len(records) == 1
    assert records[0].winning_meal_id is None  # still leftovers, no winner recorded
