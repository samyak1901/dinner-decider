import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_api_key: str = ""
    database_url: str = "sqlite:///./dinner_decider.db"
    gemini_model: str = "gemini-2.5-flash"
    scheduler_hour: int = 17

    # IANA timezone the scheduler's cron jobs run in (a household's "5 PM"
    # must be their local 5 PM, not the server's UTC).
    timezone: str = "UTC"

    # Comma-separated list of origins allowed by CORS. Defaults to the Vite
    # dev server; set this to your deployed frontend origin in production.
    cors_origins: str = "http://localhost:5173"

    # Shared household passcode that gates the app. When empty, the app runs
    # in OPEN MODE (no auth) — fine for local dev, but set this for any
    # deployment others can reach.
    household_passcode: str = ""

    # Secret used to sign session cookies. When empty, an ephemeral key is
    # generated at startup (sessions then reset on every restart).
    session_secret: str = ""

    # Optional webhook (e.g. ntfy.sh, Slack, Discord) notified when the daily
    # suggestions are generated. Empty disables notifications.
    notify_webhook_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def auth_enabled(self) -> bool:
        return bool(self.household_passcode)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

# Google ADK / google-genai read the key from the process environment, not from
# our pydantic settings (which only loaded it from .env). Export it so the agent
# can authenticate against the Gemini API.
if settings.google_api_key:
    os.environ.setdefault("GOOGLE_API_KEY", settings.google_api_key)
    os.environ.setdefault("GEMINI_API_KEY", settings.google_api_key)
    # Force the Gemini Developer API path (not Vertex AI).
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")
