from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "DSE Analytics Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RISK_FREE_RATE: float = 0.08
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
