from datetime import UTC, date, datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models import (
    DailySuggestion,
    Meal,
    MealHistory,
    Preference,
    Vote,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def cast_vote(
    db: Session, user_id: int, daily_suggestion_id: int
) -> Vote:
    today = date.today()

    # The suggestion must exist and belong to today — reject stale/forged ids
    # with a clear 404 instead of a foreign-key 500.
    suggestion = (
        db.query(DailySuggestion)
        .filter(
            DailySuggestion.id == daily_suggestion_id,
            DailySuggestion.date == today,
        )
        .first()
    )
    if not suggestion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suggestion with that id for today",
        )

    # Upsert: one vote per user per day
    existing = (
        db.query(Vote)
        .filter(Vote.user_id == user_id, Vote.date == today)
        .first()
    )
    if existing:
        existing.daily_suggestion_id = daily_suggestion_id
        existing.voted_at = _utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    vote = Vote(
        date=today,
        daily_suggestion_id=daily_suggestion_id,
        user_id=user_id,
        voted_at=_utcnow(),
    )
    db.add(vote)
    db.commit()
    db.refresh(vote)
    return vote


def get_today_votes(db: Session) -> dict:
    today = date.today()
    votes = db.query(Vote).filter(Vote.date == today).all()

    vote_counts: dict[int, int] = {}
    for v in votes:
        vote_counts[v.daily_suggestion_id] = (
            vote_counts.get(v.daily_suggestion_id, 0) + 1
        )

    # Determine winner
    winner_id = None
    is_tie = False
    if vote_counts:
        max_votes = max(vote_counts.values())
        leaders = [sid for sid, cnt in vote_counts.items() if cnt == max_votes]
        if len(leaders) == 1:
            winner_id = leaders[0]
        else:
            is_tie = True

    return {
        "date": today,
        "votes": votes,
        "vote_counts": vote_counts,
        "winner_id": winner_id,
        "is_tie": is_tie,
    }


def finalize_votes(db: Session):
    """Called at end of day to record the winning meal in history and update preferences."""
    today = date.today()

    # Skip if already finalized
    existing = db.query(MealHistory).filter(MealHistory.date == today).first()
    if existing:
        return

    result = get_today_votes(db)
    if not result["winner_id"]:
        return

    winning_suggestion = (
        db.query(DailySuggestion)
        .filter(DailySuggestion.id == result["winner_id"])
        .first()
    )
    if not winning_suggestion:
        return

    history = MealHistory(
        date=today,
        winning_meal_id=winning_suggestion.meal_id,
        total_votes=max(result["vote_counts"].values()) if result["vote_counts"] else 0,
    )
    db.add(history)

    # Update preferences for users who voted for the winner
    winning_meal = db.get(Meal, winning_suggestion.meal_id)
    if winning_meal and winning_meal.cuisine:
        votes = (
            db.query(Vote)
            .filter(
                Vote.date == today,
                Vote.daily_suggestion_id == result["winner_id"],
            )
            .all()
        )
        for vote in votes:
            _adjust_preference(db, vote.user_id, winning_meal.cuisine, 0.05)

    db.commit()


def _adjust_preference(
    db: Session, user_id: int, cuisine: str, delta: float
):
    pref = (
        db.query(Preference)
        .filter(Preference.user_id == user_id, Preference.cuisine == cuisine)
        .first()
    )
    if pref:
        pref.preference_score = max(0.0, min(1.0, pref.preference_score + delta))
    else:
        db.add(
            Preference(
                user_id=user_id,
                cuisine=cuisine,
                preference_score=max(0.0, min(1.0, 0.5 + delta)),
            )
        )


def adjust_preference_for_rating(db: Session, meal_history: MealHistory):
    """Adjust preferences based on meal rating."""
    if meal_history.rating is None:
        return

    meal = db.get(Meal, meal_history.winning_meal_id)
    if not meal or not meal.cuisine:
        return

    # Get all users who voted for this meal that day
    suggestions = (
        db.query(DailySuggestion)
        .filter(
            DailySuggestion.date == meal_history.date,
            DailySuggestion.meal_id == meal_history.winning_meal_id,
        )
        .all()
    )
    suggestion_ids = [s.id for s in suggestions]

    votes = (
        db.query(Vote)
        .filter(
            Vote.date == meal_history.date,
            Vote.daily_suggestion_id.in_(suggestion_ids),
        )
        .all()
    )

    delta = 0.0
    if meal_history.rating >= 4:
        delta = 0.05
    elif meal_history.rating <= 2:
        delta = -0.05

    if delta != 0:
        for vote in votes:
            _adjust_preference(db, vote.user_id, meal.cuisine, delta)
        db.commit()
