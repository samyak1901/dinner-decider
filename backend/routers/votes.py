from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.auth import get_current_user_id, require_auth
from backend.database import get_db
from backend.schemas import VoteOut, VoteRequest, VoteTodayResponse
from backend.services.vote_service import cast_vote, get_today_votes

router = APIRouter()


@router.post("", response_model=VoteOut)
def post_vote(
    req: VoteRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Identity comes from the session, not the request body.
    return cast_vote(db, user_id, req.daily_suggestion_id)


@router.get(
    "/today",
    response_model=VoteTodayResponse,
    dependencies=[Depends(require_auth)],
)
def get_votes_today(db: Session = Depends(get_db)):
    return get_today_votes(db)
