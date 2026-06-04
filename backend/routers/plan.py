from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.auth import require_auth
from backend.database import get_db
from backend.schemas import (
    PinRequest,
    PlanDayOut,
    ShoppingListRequest,
    ShoppingListResponse,
    WeekResponse,
)
from backend.services.plan_service import get_week, pin_meal, unpin
from backend.services.shopping_service import build_shopping_list

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("/week", response_model=WeekResponse)
def week(start: date = Query(...), db: Session = Depends(get_db)):
    days = [PlanDayOut(**d) for d in get_week(db, start)]
    return WeekResponse(start=start, days=days)


@router.post("/shopping-list", response_model=ShoppingListResponse)
def shopping_list(req: ShoppingListRequest, db: Session = Depends(get_db)):
    items = build_shopping_list(db, req.start, req.days)
    return ShoppingListResponse(start=req.start, days=req.days, items=items)


@router.put("/{day}", response_model=PlanDayOut)
def pin(day: date, req: PinRequest, db: Session = Depends(get_db)):
    p = pin_meal(db, day, req.meal_id, req.note)
    return PlanDayOut(
        date=p.date, meal=p.meal, source="planned",
        is_pinned=True, was_cooked=True, note=p.note,
    )


@router.delete("/{day}", status_code=status.HTTP_204_NO_CONTENT)
def remove_pin(day: date, db: Session = Depends(get_db)):
    unpin(db, day)
