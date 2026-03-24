from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core import dse_data
from app.services.sync_service import sync_prices, sync_dividends

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


@router.post("/prices")
def trigger_price_sync(db: Session = Depends(get_db)) -> dict:
    """Manually trigger a DSE price sync, then refresh analytics data."""
    result = sync_prices(db, triggered_by="manual")
    dse_data.reload_from_db()
    return result


@router.post("/dividends")
def trigger_dividend_sync(db: Session = Depends(get_db)) -> dict:
    """Manually trigger a DSE dividend sync, then refresh analytics data."""
    result = sync_dividends(db, triggered_by="manual")
    dse_data.reload_from_db()
    return result


@router.post("/all")
def trigger_full_sync(db: Session = Depends(get_db)) -> dict:
    """Trigger both price and dividend sync, then refresh analytics data."""
    prices = sync_prices(db, triggered_by="manual")
    dividends = sync_dividends(db, triggered_by="manual")
    dse_data.reload_from_db()
    return {"prices": prices, "dividends": dividends}


@router.get("/status")
def sync_status() -> dict:
    """Return current data status — real vs. fallback, stock count, etc."""
    return {
        "using_real_data": dse_data.is_using_real_data(),
        "stock_count": len(dse_data.STOCK_SYMBOLS),
        "symbols": dse_data.STOCK_SYMBOLS,
        "sample": {sym: dse_data.DSE_STOCKS[sym] for sym in dse_data.STOCK_SYMBOLS[:3]},
    }
