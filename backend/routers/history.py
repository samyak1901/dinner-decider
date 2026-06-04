from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.auth import require_auth
from backend.database import get_db
from backend.schemas import HistoryResponse, MealHistoryOut, RateRequest
from backend.services.history_service import get_history, mark_leftovers, rate_meal

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("", response_model=HistoryResponse)
def list_history(page: int = Query(1, ge=1), db: Session = Depends(get_db)):
    return get_history(db, page)


@router.post("/{meal_date}/leftovers", response_model=MealHistoryOut)
def mark_day_leftovers(meal_date: date, db: Session = Depends(get_db)):
    return mark_leftovers(db, meal_date)


@router.post("/{meal_date}/rate", response_model=MealHistoryOut)
def rate_past_meal(meal_date: date, req: RateRequest, db: Session = Depends(get_db)):
    result = rate_meal(db, meal_date, req.rating, req.notes)
    if not result:
        raise HTTPException(status_code=404, detail="No meal history found for that date")
    return result
