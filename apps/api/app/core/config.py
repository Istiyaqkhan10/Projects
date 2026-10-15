from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "InteriorAI Studio API"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0"

    # PostgreSQL Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_password_placeholder"
    POSTGRES_DB: str = "interiorai_db"

    # Explicit Database URL override
    DATABASE_URL: str | None = None

    @property
    def async_database_uri(self) -> str:
        if self.DATABASE_URL and "placeholder" not in self.DATABASE_URL:
            return self.DATABASE_URL
        if self.ENVIRONMENT in ("development", "test"):
            return "sqlite+aiosqlite:///./interiorai.db"
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT / Security
    JWT_SECRET_KEY: str = "default_insecure_development_secret_key_change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # AI Provider
    AI_PROVIDER: str = "mock"
    AI_PROVIDER_API_KEY: str | None = None
    AI_PROVIDER_MODEL: str = "gemini-2.5-flash"
    AI_REQUEST_TIMEOUT_SECONDS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


def get_shared_fixtures_dir() -> Path:
    from pathlib import Path
    current = Path(__file__).resolve()
    for parent in [current] + list(current.parents):
        candidate = parent / "packages" / "shared-fixtures"
        if candidate.exists() and candidate.is_dir():
            return candidate
    return Path(__file__).resolve().parents[4] / "packages" / "shared-fixtures"

