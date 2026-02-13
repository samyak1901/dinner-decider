from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from backend.database import get_db
from backend.models import DailySuggestion, Vote
from backend.schemas import DailySuggestionOut, SuggestionsResponse

router = APIRouter()


def _build_suggestion_out(
    suggestion: DailySuggestion, db: Session
) -> DailySuggestionOut:
    votes = (
        db.query(Vote).filter(Vote.daily_suggestion_id == suggestion.id).all()
    )
    return DailySuggestionOut(
        id=suggestion.id,
        date=suggestion.date,
        slot_number=suggestion.slot_number,
        meal=suggestion.meal,
        veg_alternative=suggestion.veg_alternative,
        vote_count=len(votes),
        voters=[v.user.name for v in votes],
    )


@router.get("/today", response_model=SuggestionsResponse)
def get_today_suggestions(
    user_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    today = date.today()
    suggestions = (
        db.query(DailySuggestion)
        .options(
            joinedload(DailySuggestion.meal),
            joinedload(DailySuggestion.veg_alternative),
            joinedload(DailySuggestion.votes).joinedload(Vote.user),
        )
        .filter(DailySuggestion.date == today)
        .order_by(DailySuggestion.slot_number)
        .all()
    )

    user_vote_id = None
    if user_id:
        vote = (
            db.query(Vote)
            .filter(Vote.user_id == user_id, Vote.date == today)
            .first()
        )
        if vote:
            user_vote_id = vote.daily_suggestion_id

    return SuggestionsResponse(
        date=today,
        suggestions=[_build_suggestion_out(s, db) for s in suggestions],
        user_vote_id=user_vote_id,
    )


@router.post("/refresh", response_model=SuggestionsResponse)
async def refresh_suggestions(
    user_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    from backend.services.suggestion_service import generate_and_save_suggestions

    await generate_and_save_suggestions(db)

    return get_today_suggestions(user_id=user_id, db=db)
