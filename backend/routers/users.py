from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.auth import require_auth
from backend.database import get_db
from backend.models import User
from backend.schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(dependencies=[Depends(require_auth)])


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.get("", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    user = User(
        name=req.name,
        is_vegetarian=req.is_vegetarian,
        dietary_restrictions=req.dietary_restrictions,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with that name already exists",
        )
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db)):
    user = _get_user_or_404(db, user_id)

    if req.name is not None:
        user.name = req.name
    if req.is_vegetarian is not None:
        user.is_vegetarian = req.is_vegetarian
    if req.dietary_restrictions is not None:
        user.dietary_restrictions = req.dietary_restrictions

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A member with that name already exists",
        )
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = _get_user_or_404(db, user_id)
    db.delete(user)
    db.commit()
