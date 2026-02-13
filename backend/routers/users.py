from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.schemas import UserOut, UserCreate, UserUpdate

router = APIRouter()


@router.get("", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id).all()


@router.post("", response_model=UserOut)
def create_user(req: UserCreate, db: Session = Depends(get_db)):
    user = User(
        name=req.name,
        is_vegetarian=req.is_vegetarian,
        dietary_restrictions=req.dietary_restrictions,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, req: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    
    if req.name is not None:
        user.name = req.name
    if req.is_vegetarian is not None:
        user.is_vegetarian = req.is_vegetarian
    if req.dietary_restrictions is not None:
        user.dietary_restrictions = req.dietary_restrictions
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"status": "ok"}


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return {"status": "ok"}
