"""Lightweight single-household auth.

A shared passcode gates the app; on success the server stores an ``authed``
flag in a signed session cookie (Starlette ``SessionMiddleware``). The active
household member is also kept in the session, so vote/rate endpoints take the
acting ``user_id`` from the session — never from the request body. This is
deliberately not multi-tenant: it's a trusted family, not adversaries.

When ``HOUSEHOLD_PASSCODE`` is unset the app runs in OPEN MODE — ``require_auth``
is a no-op — which keeps local development frictionless.
"""

import hmac

from fastapi import HTTPException, Request, status

from backend.config import settings


def is_authenticated(request: Request) -> bool:
    """True if the request carries a valid session (or auth is disabled)."""
    if not settings.auth_enabled:
        return True
    return bool(request.session.get("authed"))


def verify_passcode(passcode: str) -> bool:
    """Constant-time comparison against the configured household passcode.

    Compares as bytes — hmac.compare_digest raises on non-ASCII str inputs, so a
    passcode containing an emoji/accent would otherwise 500 the login endpoint.
    """
    if not settings.auth_enabled:
        return True
    return hmac.compare_digest(
        (passcode or "").encode("utf-8"),
        settings.household_passcode.encode("utf-8"),
    )


def require_auth(request: Request) -> None:
    """FastAPI dependency: reject unauthenticated requests (no-op in open mode)."""
    if not is_authenticated(request):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )


def get_current_user_id(request: Request) -> int:
    """Identity of the acting household member, taken from the session.

    Requires a valid session and a previously selected member. This is the
    only source of truth for who is voting/rating — request bodies are ignored.
    """
    require_auth(request)
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No active household member selected",
        )
    return int(user_id)
