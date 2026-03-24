import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.optimization import router as optimization_router
from app.api.v1.health import router as health_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.sync import router as sync_router
from app.api.v1.order_book import router as order_book_router
from app.core.config import settings
from app.scheduler import setup_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Load real DSE data from PostgreSQL into the analytics engine
    from app.core.dse_data import reload_from_db, is_using_real_data
    loaded = reload_from_db()
    if loaded:
        logging.getLogger("dse").info(
            "Stock universe loaded from DB (real_metrics=%s)", is_using_real_data()
        )

    setup_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Portfolio optimization engine for DSE (Dar es Salaam Stock Exchange) using Modern Portfolio Theory",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
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
app.include_router(analytics_router)
app.include_router(sync_router)
app.include_router(order_book_router, prefix="/api/v1", tags=["order-book"])
