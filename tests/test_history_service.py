from datetime import date

from backend.models import Preference, Vote
from backend.services.history_service import rate_meal
from backend.services.vote_service import finalize_votes
from tests.conftest import make_suggestion, make_user


def _setup_winner(db, cuisine="Mexican"):
    s1 = make_suggestion(db, 1, cuisine=cuisine)
    user = make_user(db, "A")
    db.add(Vote(date=date.today(), daily_suggestion_id=s1.id, user_id=user.id))
    db.commit()
    finalize_votes(db)  # creates history + nudges 0.5 -> 0.55
    return user, cuisine


def test_high_rating_increases_preference(db):
    user, cuisine = _setup_winner(db)
    rate_meal(db, date.today(), rating=5.0, notes="great")
    pref = (
        db.query(Preference)
        .filter(Preference.user_id == user.id, Preference.cuisine == cuisine)
        .first()
    )
    # 0.55 (from finalize) + 0.05 (rating >= 4) = 0.60
    assert abs(pref.preference_score - 0.60) < 1e-9


def test_low_rating_decreases_preference(db):
    user, cuisine = _setup_winner(db)
    rate_meal(db, date.today(), rating=1.0, notes="bad")
    pref = (
        db.query(Preference)
        .filter(Preference.user_id == user.id, Preference.cuisine == cuisine)
        .first()
    )
    # 0.55 - 0.05 (rating <= 2) = 0.50
    assert abs(pref.preference_score - 0.50) < 1e-9


def test_rate_unknown_date_returns_none(db):
    assert rate_meal(db, date(2000, 1, 1), rating=5.0, notes=None) is None
