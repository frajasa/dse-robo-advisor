import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.sync_service import sync_dividends, sync_prices

logger = logging.getLogger("dse.scheduler")

scheduler = BackgroundScheduler()


def _run_sync(sync_func, sync_name: str):
    """Wrapper that creates a DB session, runs a sync function, and handles errors."""
    logger.info("Scheduler running: %s", sync_name)
    db = SessionLocal()
    try:
        sync_func(db, triggered_by="scheduler")
    except Exception:
        logger.exception("Scheduled %s failed", sync_name)
    finally:
        db.close()


def setup_scheduler():
    """Configure and start the APScheduler with cron jobs for DSE data sync."""

    if settings.SYNC_PRICES_ENABLED:
        # Price sync: weekdays at 14:00 UTC (17:00 EAT) — after DSE market close
        scheduler.add_job(
            _run_sync,
            trigger=CronTrigger(day_of_week="mon-fri", hour=14, minute=0),
            args=[sync_prices, "price_sync"],
            id="price_sync",
            name="Daily DSE price sync",
            replace_existing=True,
        )
        logger.info("Added job: price_sync (weekdays 17:00 EAT)")

    if settings.SYNC_DIVIDENDS_ENABLED:
        # Dividend sync: Monday & Thursday at 06:00 UTC (09:00 EAT)
        scheduler.add_job(
            _run_sync,
            trigger=CronTrigger(day_of_week="mon,thu", hour=6, minute=0),
            args=[sync_dividends, "dividend_sync"],
            id="dividend_sync",
            name="Dividend sync (Mon & Thu)",
            replace_existing=True,
        )
        logger.info("Added job: dividend_sync (Mon & Thu 09:00 EAT)")

    scheduler.start()
    logger.info("Scheduler started with %d jobs", len(scheduler.get_jobs()))


def shutdown_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down")
