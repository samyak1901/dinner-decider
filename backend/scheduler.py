import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from backend.config import settings
from backend.database import SessionLocal
from backend.services.vote_service import finalize_votes

logger = logging.getLogger(__name__)


def _generate_suggestions_job():
    """Daily job to generate meal suggestions."""
    from backend.notifications import notify
    from backend.services.suggestion_service import generate_and_save_suggestions

    db = SessionLocal()
    try:
        suggestions = asyncio.run(generate_and_save_suggestions(db))
        logger.info("Daily suggestions generated successfully")
        if suggestions:
            names = ", ".join(s.meal.name for s in suggestions if s.meal)
            notify(f"Tonight's dinner options are ready: {names}. Cast your vote!")
    except Exception:
        logger.exception("Failed to generate daily suggestions")
    finally:
        db.close()


def _finalize_votes_job():
    """Daily job to finalize votes and record meal history."""
    db = SessionLocal()
    try:
        finalize_votes(db)
        logger.info("Votes finalized successfully")
    except Exception:
        logger.exception("Failed to finalize votes")
    finally:
        db.close()


def create_scheduler() -> BackgroundScheduler:
    # Run cron jobs in the configured household timezone, and tolerate a
    # restart near a trigger: coalesce collapses missed runs into one, and
    # misfire_grace_time lets a job that was due during downtime still fire.
    scheduler = BackgroundScheduler(
        timezone=settings.timezone,
        job_defaults={"coalesce": True, "misfire_grace_time": 3600},
    )

    # Generate suggestions at configured hour (default 5 PM)
    scheduler.add_job(
        _generate_suggestions_job,
        "cron",
        hour=settings.scheduler_hour,
        minute=0,
        id="generate_suggestions",
        replace_existing=True,
    )

    # Finalize votes at 11:59 PM
    scheduler.add_job(
        _finalize_votes_job,
        "cron",
        hour=23,
        minute=59,
        id="finalize_votes",
        replace_existing=True,
    )

    return scheduler
