"""Best-effort outbound notifications.

Posts a plain-text message to NOTIFY_WEBHOOK_URL (an ntfy.sh topic URL is the
typical self-hosted choice; any endpoint that accepts a text body works). Always
best-effort: failures are logged and never propagate to suggestion generation.
"""

import logging

import httpx

from backend.config import settings

logger = logging.getLogger(__name__)


def notify(message: str) -> None:
    url = settings.notify_webhook_url
    if not url:
        return
    try:
        resp = httpx.post(url, content=message.encode("utf-8"), timeout=5.0)
        resp.raise_for_status()
        logger.info("Notification sent (%d)", resp.status_code)
    except Exception as exc:  # noqa: BLE001 — notifications must never break flow
        logger.warning("Notification failed: %s", exc)
