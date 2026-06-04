import logging
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from backend.config import settings
from backend.database import SessionLocal
from backend.migrations import run_migrations
from backend.routers import auth, history, meals, plan, suggestions, users, votes
from backend.scheduler import create_scheduler

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bring the schema up to date (creates tables on first run).
    run_migrations()
    if not settings.auth_enabled:
        logger.warning(
            "HOUSEHOLD_PASSCODE is unset — running in OPEN MODE (no auth). "
            "Set it before exposing this app to anyone."
        )
    if not settings.session_secret:
        logger.warning(
            "SESSION_SECRET is unset — using an ephemeral key; sessions reset "
            "on restart. Set it for stable logins."
        )
    scheduler = create_scheduler()
    scheduler.start()
    for job in scheduler.get_jobs():
        logger.info("Scheduled job '%s' next run: %s", job.id, job.next_run_time)
    yield
    scheduler.shutdown()


app = FastAPI(title="Dinner Decider", lifespan=lifespan)

# Signed-cookie sessions. A stable SESSION_SECRET keeps logins across restarts;
# without one we fall back to a per-process random key.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret or secrets.token_hex(32),
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Never leak internals/stack traces to clients; log them instead."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500, content={"detail": "Internal server error"}
    )


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
app.include_router(votes.router, prefix="/api/votes", tags=["votes"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(meals.router, prefix="/api/meals", tags=["meals"])
app.include_router(plan.router, prefix="/api/plan", tags=["plan"])


@app.get("/api/health")
def health():
    """Liveness + DB readiness — runs a trivial query so a wedged database
    surfaces as an unhealthy container instead of a false 'ok'."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "ok"}
    except Exception:
        logger.exception("Health check DB query failed")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "unavailable"},
        )
    finally:
        db.close()
