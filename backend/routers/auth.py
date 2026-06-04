from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.auth import is_authenticated, require_auth, verify_passcode
from backend.config import settings
from backend.database import get_db
from backend.models import User
from backend.schemas import (
    AuthStatus,
    LoginRequest,
    SelectUserRequest,
)

router = APIRouter()


def _status(request: Request, db: Session) -> AuthStatus:
    user_id = request.session.get("user_id")
    current = None
    if user_id is not None:
        current = db.query(User).filter(User.id == user_id).first()
    return AuthStatus(
        authenticated=is_authenticated(request),
        auth_required=settings.auth_enabled,
        current_user=current,
    )


@router.get("/me", response_model=AuthStatus)
def me(request: Request, db: Session = Depends(get_db)):
    return _status(request, db)


@router.post("/login", response_model=AuthStatus)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    if not verify_passcode(req.passcode):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect passcode",
        )
    request.session["authed"] = True
    return _status(request, db)


@router.post("/logout", response_model=AuthStatus)
def logout(request: Request, db: Session = Depends(get_db)):
    request.session.clear()
    return _status(request, db)


@router.post("/select-user", response_model=AuthStatus)
def select_user(
    req: SelectUserRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(require_auth),
):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    request.session["user_id"] = user.id
    return _status(request, db)
