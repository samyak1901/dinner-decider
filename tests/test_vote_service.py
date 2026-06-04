from datetime import date

from backend.models import MealHistory, Preference, Vote
from backend.services.vote_service import finalize_votes, get_today_votes
from tests.conftest import make_suggestion, make_user


def _vote(db, user, suggestion):
    db.add(Vote(date=date.today(), daily_suggestion_id=suggestion.id, user_id=user.id))
    db.commit()


def test_winner_selected_by_majority(db):
    s1 = make_suggestion(db, 1, cuisine="Mexican")
    s2 = make_suggestion(db, 2, cuisine="Thai")
    a, b, c = make_user(db, "A"), make_user(db, "B"), make_user(db, "C")
    _vote(db, a, s1)
    _vote(db, b, s1)
    _vote(db, c, s2)

    result = get_today_votes(db)
    assert result["winner_id"] == s1.id
    assert result["is_tie"] is False


def test_tie_reported(db):
    s1 = make_suggestion(db, 1)
    s2 = make_suggestion(db, 2)
    _vote(db, make_user(db, "A"), s1)
    _vote(db, make_user(db, "B"), s2)

    result = get_today_votes(db)
    assert result["is_tie"] is True
    assert result["winner_id"] is None


def test_finalize_records_history_and_nudges_preference(db):
    s1 = make_suggestion(db, 1, cuisine="Mexican")
    make_suggestion(db, 2, cuisine="Thai")  # a losing option to vote against
    a, b = make_user(db, "A"), make_user(db, "B")
    _vote(db, a, s1)
    _vote(db, b, s1)

    finalize_votes(db)

    history = db.query(MealHistory).filter(MealHistory.date == date.today()).first()
    assert history is not None
    assert history.winning_meal_id == s1.meal_id
    assert history.total_votes == 2

    # Both winning voters get a +0.05 nudge on the winning cuisine (0.5 -> 0.55).
    prefs = db.query(Preference).filter(Preference.cuisine == "Mexican").all()
    assert len(prefs) == 2
    assert all(abs(p.preference_score - 0.55) < 1e-9 for p in prefs)


def test_finalize_is_idempotent(db):
    s1 = make_suggestion(db, 1, cuisine="Mexican")
    _vote(db, make_user(db, "A"), s1)
    finalize_votes(db)
    finalize_votes(db)  # second call must not double-count
    assert db.query(MealHistory).count() == 1


def test_finalize_noop_without_votes(db):
    make_suggestion(db, 1)
    finalize_votes(db)
    assert db.query(MealHistory).count() == 0
