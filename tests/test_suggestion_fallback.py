import asyncio
from datetime import date, timedelta

import backend.agent.postprocess as postprocess
import backend.agent.runner as runner_mod
from backend.models import DailySuggestion
from backend.services.suggestion_service import generate_and_save_suggestions
from tests.conftest import make_suggestion, make_user


def _run(db):
    return asyncio.run(generate_and_save_suggestions(db))


def _today_suggestions(db):
    return (
        db.query(DailySuggestion)
        .filter(DailySuggestion.date == date.today())
        .order_by(DailySuggestion.slot_number)
        .all()
    )


def test_agent_success_is_saved(db, monkeypatch):
    make_user(db, "O", is_vegetarian=False)

    async def fake_agent():
        return [
            {"name": "Tacos", "cuisine": "Mexican", "is_vegetarian": False, "ingredients": ["beef"]},
            {"name": "Pasta", "cuisine": "Italian", "is_vegetarian": True, "ingredients": ["pasta"]},
            {"name": "Curry", "cuisine": "Indian", "is_vegetarian": True, "ingredients": ["lentils"]},
        ]

    monkeypatch.setattr(runner_mod, "generate_meal_suggestions", fake_agent)
    _run(db)

    names = {s.meal.name for s in _today_suggestions(db)}
    assert names == {"Tacos", "Pasta", "Curry"}


def test_seed_fallback_when_agent_fails(db, monkeypatch):
    make_user(db, "O", is_vegetarian=False)

    async def boom():
        raise RuntimeError("gemini down")

    monkeypatch.setattr(runner_mod, "generate_meal_suggestions", boom)
    _run(db)

    # Seed menu has 3 meals; the page is never empty.
    assert len(_today_suggestions(db)) == 3


def test_last_known_good_used_before_seed(db, monkeypatch):
    make_user(db, "O", is_vegetarian=False)
    yesterday = date.today() - timedelta(days=1)
    make_suggestion(db, 1, cuisine="Korean", name="Bibimbap", on=yesterday)

    async def boom():
        raise RuntimeError("gemini down")

    monkeypatch.setattr(runner_mod, "generate_meal_suggestions", boom)
    # Force seed out of the picture so we prove last-known-good is preferred.
    monkeypatch.setattr(postprocess, "SEED_MEALS", [])
    _run(db)

    names = {s.meal.name for s in _today_suggestions(db)}
    assert names == {"Bibimbap"}


def test_existing_suggestions_not_wiped_when_all_sources_empty(db, monkeypatch):
    make_user(db, "O", is_vegetarian=False)
    existing = make_suggestion(db, 1, name="Keep Me")  # today

    async def boom():
        raise RuntimeError("gemini down")

    monkeypatch.setattr(runner_mod, "generate_meal_suggestions", boom)
    monkeypatch.setattr(postprocess, "SEED_MEALS", [])  # no seed, no prior day
    _run(db)

    today = _today_suggestions(db)
    assert len(today) == 1
    assert today[0].id == existing.id  # untouched, not blanked
