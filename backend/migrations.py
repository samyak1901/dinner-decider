"""Apply Alembic migrations programmatically at app startup.

Replaces ``Base.metadata.create_all`` so that schema changes on an existing
self-hosted database are applied safely and idempotently (``upgrade head``).
"""

import logging
import os

from alembic import command
from alembic.config import Config

logger = logging.getLogger(__name__)

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_migrations() -> None:
    cfg = Config(os.path.join(_PROJECT_ROOT, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(_PROJECT_ROOT, "alembic"))
    logger.info("Applying database migrations (alembic upgrade head)")
    command.upgrade(cfg, "head")
