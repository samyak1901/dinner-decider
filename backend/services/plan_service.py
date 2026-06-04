from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models import Meal, MealHistory, PlannedMeal


def get_week(db: Session, start: date, days: int = 7) -> list[dict]:
    """Assemble the plan for each day: a manual pin wins, else the finalized
    history result (including a 'leftovers' day with no meal), else nothing."""
    dates = [start + timedelta(days=i) for i in range(days)]

    pins = {
        p.date: p
        for p in db.query(PlannedMeal).filter(PlannedMeal.date.in_(dates)).all()
    }
    history = {
        h.date: h
        for h in db.query(MealHistory).filter(MealHistory.date.in_(dates)).all()
    }

    out = []
    for d in dates:
        if d in pins:
            pin = pins[d]
            out.append({
                "date": d, "meal": pin.meal, "source": "planned",
                "is_pinned": True, "was_cooked": True, "note": pin.note,
            })
        elif d in history:
            h = history[d]
            out.append({
                "date": d, "meal": h.winning_meal, "source": "history",
                "is_pinned": False, "was_cooked": h.was_cooked,
                "note": None if h.winning_meal else "Leftovers / no cook",
            })
        else:
            out.append({
                "date": d, "meal": None, "source": "none",
                "is_pinned": False, "was_cooked": True, "note": None,
            })
    return out


def pin_meal(db: Session, day: date, meal_id: int, note: str | None) -> PlannedMeal:
    if not db.get(Meal, meal_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found"
        )
    pin = db.query(PlannedMeal).filter(PlannedMeal.date == day).first()
    if pin:
        pin.meal_id = meal_id
        pin.note = note
    else:
        pin = PlannedMeal(date=day, meal_id=meal_id, note=note)
        db.add(pin)
    db.commit()
    db.refresh(pin)
    return pin


def unpin(db: Session, day: date) -> bool:
    pin = db.query(PlannedMeal).filter(PlannedMeal.date == day).first()
    if not pin:
        return False
    db.delete(pin)
    db.commit()
    return True
