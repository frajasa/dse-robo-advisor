from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.optimization import router as optimization_router
from app.api.v1.health import router as health_router
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Portfolio optimization engine for DSE (Dar es Salaam Stock Exchange) using Modern Portfolio Theory",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

allowed_origins = [
    origin.strip()
    for origin in settings.ALLOWED_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(optimization_router)
app.include_router(health_router)
