from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration sourced entirely from environment variables.

    No credentials are hardcoded; every value below can be overridden via the
    environment (see .env.example at the repo root).
    """

    # Full SQLAlchemy database URL, e.g.
    #   postgresql+psycopg2://user:password@host:5432/dbname
    database_url: str = "postgresql+psycopg2://postgres:postgres@db:5432/inventory"

    # Comma-separated list of allowed CORS origins for the frontend.
    cors_origins: str = "*"

    # App metadata
    app_name: str = "Inventory & Order Management API"

    # ----- LLM analytics (OpenRouter, OpenAI-compatible) -----
    # API key for OpenRouter. Empty disables the analytics endpoint.
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "google/gemini-2.0-flash"
    # Safety limits for LLM-generated SQL.
    analytics_row_limit: int = 1000
    analytics_timeout_ms: int = 8000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
