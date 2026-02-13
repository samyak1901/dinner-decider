import math
from datetime import date

from sqlalchemy.orm import Session, joinedload

from backend.models import MealHistory
from backend.schemas import HistoryResponse


PAGE_SIZE = 10


def get_history(db: Session, page: int = 1) -> HistoryResponse:
    total = db.query(MealHistory).count()
    total_pages = max(1, math.ceil(total / PAGE_SIZE))
    page = max(1, min(page, total_pages))

    items = (
        db.query(MealHistory)
        .options(joinedload(MealHistory.winning_meal))
        .order_by(MealHistory.date.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .all()
    )

    return HistoryResponse(
        items=items,
        page=page,
        total_pages=total_pages,
        total_items=total,
    )


def rate_meal(db: Session, meal_date: date, rating: float, notes: str | None):
    history = (
        db.query(MealHistory).filter(MealHistory.date == meal_date).first()
    )
    if not history:
        return None

    history.rating = rating
    history.notes = notes
    db.commit()
    db.refresh(history)

    # Update preferences based on rating
    from backend.services.vote_service import adjust_preference_for_rating
    adjust_preference_for_rating(db, history)

    return history
