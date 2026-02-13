from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_api_key: str = ""
    database_url: str = "sqlite:///./dinner_decider.db"
    gemini_model: str = "gemini-3-flash-preview"
    scheduler_hour: int = 17

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
