from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.auth import require_auth
from backend.database import get_db
from backend.schemas import FavouriteOut, MealCreate, MealOut
from backend.services.meal_service import create_meal, get_favourites, list_meals

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("", response_model=list[MealOut])
def get_meals(db: Session = Depends(get_db)):
    return list_meals(db)


@router.post("", response_model=MealOut, status_code=status.HTTP_201_CREATED)
def add_meal(payload: MealCreate, db: Session = Depends(get_db)):
    return create_meal(db, payload)


@router.get("/favourites", response_model=list[FavouriteOut])
def favourites(db: Session = Depends(get_db)):
    return get_favourites(db)
