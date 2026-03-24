from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "DSE Analytics Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RISK_FREE_RATE: float = 0.08
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # PostgreSQL — shared with the Spring backend
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "dse_advisor"
    POSTGRES_USER: str = "dse_admin"
    POSTGRES_PASSWORD: str = ""

    # DSE scraper settings
    SCRAPER_TIMEOUT: float = 30.0
    SCRAPER_MAX_RETRIES: int = 3
    SCRAPER_USER_AGENT: str = "DSE-RoboAdvisor/1.0"
    SYNC_PRICES_ENABLED: bool = True
    SYNC_DIVIDENDS_ENABLED: bool = True

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
