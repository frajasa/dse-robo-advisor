"""DSE stock universe — loads real data from PostgreSQL when available,
falls back to static estimates when there is insufficient history.

The module exposes the same interface as before so the optimizer,
dividend calculator, and risk scorer continue to work unchanged.
"""

import logging
from typing import Any

import numpy as np
from sqlalchemy import text

from app.core.config import settings

logger = logging.getLogger("dse.data")

# ---------------------------------------------------------------------------
# Static fallback data (used when DB has < 30 days of price history)
# ---------------------------------------------------------------------------
_FALLBACK_STOCKS: dict[str, dict[str, Any]] = {
    "NMB":  {"name": "NMB Bank",              "expected_return": 0.10, "volatility": 0.08, "dividend_yield": 0.080, "sector": "Banking"},
    "CRDB": {"name": "CRDB Bank",             "expected_return": 0.12, "volatility": 0.09, "dividend_yield": 0.060, "sector": "Banking"},
    "TBL":  {"name": "Tanzania Breweries",     "expected_return": 0.09, "volatility": 0.06, "dividend_yield": 0.070, "sector": "Consumer"},
    "VODA": {"name": "Vodacom Tanzania",       "expected_return": 0.11, "volatility": 0.10, "dividend_yield": 0.065, "sector": "Telecom"},
    "SWIS": {"name": "Swissport Tanzania",     "expected_return": 0.13, "volatility": 0.12, "dividend_yield": 0.050, "sector": "Aviation"},
    "NICO": {"name": "NIC Insurance",          "expected_return": 0.08, "volatility": 0.07, "dividend_yield": 0.090, "sector": "Insurance"},
    "GOVB": {"name": "Government Bond ETF",    "expected_return": 0.11, "volatility": 0.02, "dividend_yield": 0.110, "sector": "FixedIncome"},
}

_FALLBACK_CORRELATION = np.array([
    [1.00, 0.72, 0.35, 0.28, 0.20, 0.25, 0.05],
    [0.72, 1.00, 0.38, 0.30, 0.22, 0.27, 0.05],
    [0.35, 0.38, 1.00, 0.40, 0.15, 0.30, 0.03],
    [0.28, 0.30, 0.40, 1.00, 0.25, 0.20, 0.04],
    [0.20, 0.22, 0.15, 0.25, 1.00, 0.18, 0.02],
    [0.25, 0.27, 0.30, 0.20, 0.18, 1.00, 0.03],
    [0.05, 0.05, 0.03, 0.04, 0.02, 0.03, 1.00],
])

MIN_DAYS_FOR_REAL_DATA = 30  # need at least 30 trading days to compute stats

# ---------------------------------------------------------------------------
# Module-level cache (refreshed by reload_from_db())
# ---------------------------------------------------------------------------
DSE_STOCKS: dict[str, dict[str, Any]] = dict(_FALLBACK_STOCKS)
STOCK_SYMBOLS: list[str] = list(DSE_STOCKS.keys())
CORRELATION_MATRIX: np.ndarray = _FALLBACK_CORRELATION.copy()

_using_real_data = False


# ---------------------------------------------------------------------------
# Database loading
# ---------------------------------------------------------------------------

def reload_from_db() -> bool:
    """Reload stock universe from PostgreSQL.

    Computes real volatility, returns, dividend yields, and correlations
    from the stock_prices and dividend_history tables when enough history
    exists. Returns True if real data was loaded.
    """
    global DSE_STOCKS, STOCK_SYMBOLS, CORRELATION_MATRIX, _using_real_data

    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
    except Exception:
        logger.warning("Cannot connect to database — using fallback data")
        return False

    try:
        # 1. Load stock metadata
        rows = db.execute(text(
            "SELECT symbol, company_name, sector, expected_return, volatility, dividend_yield "
            "FROM stocks WHERE is_active = TRUE ORDER BY symbol"
        )).fetchall()

        if not rows:
            logger.warning("No active stocks in DB — using fallback data")
            return False

        # 2. Check how many days of price history we have
        day_count = db.execute(text(
            "SELECT COUNT(DISTINCT price_date) FROM stock_prices"
        )).scalar() or 0

        logger.info("Found %d active stocks, %d days of price history", len(rows), day_count)

        # 3. Build the stock dict from DB metadata
        stocks: dict[str, dict[str, Any]] = {}
        for row in rows:
            sym, name, sector, exp_ret, vol, div_yield = row
            stocks[sym] = {
                "name": name,
                "expected_return": float(exp_ret) if exp_ret else 0.08,
                "volatility": float(vol) if vol else 0.10,
                "dividend_yield": float(div_yield) if div_yield else 0.0,
                "sector": sector or "Other",
            }

        # 4. If enough price history, compute real metrics
        if day_count >= MIN_DAYS_FOR_REAL_DATA:
            _compute_real_metrics(db, stocks)
            _using_real_data = True
            logger.info("Loaded REAL metrics from %d days of price data", day_count)
        else:
            # Still update dividend yields from actual dividend_history if available
            _update_dividend_yields_from_db(db, stocks)
            _using_real_data = False
            logger.info("Not enough history (%d days) for real volatility — using DB metadata + real dividends", day_count)

        # 5. Update module globals
        DSE_STOCKS = stocks
        STOCK_SYMBOLS = list(stocks.keys())

        if day_count >= MIN_DAYS_FOR_REAL_DATA:
            CORRELATION_MATRIX = _compute_correlation_matrix(db, STOCK_SYMBOLS)
        else:
            # Build identity-ish matrix sized for current universe
            n = len(STOCK_SYMBOLS)
            CORRELATION_MATRIX = np.eye(n) * 0.7 + np.ones((n, n)) * 0.3
            np.fill_diagonal(CORRELATION_MATRIX, 1.0)

        return True

    except Exception:
        logger.exception("Failed to load data from DB — using fallback")
        return False
    finally:
        db.close()


def _compute_real_metrics(db, stocks: dict[str, dict[str, Any]]):
    """Compute annualized return, volatility, and dividend yield from real data."""
    for sym in list(stocks.keys()):
        # Daily returns from close prices
        prices = db.execute(text(
            "SELECT close_price FROM stock_prices "
            "WHERE symbol = :sym AND close_price IS NOT NULL "
            "ORDER BY price_date ASC"
        ), {"sym": sym}).fetchall()

        if len(prices) >= MIN_DAYS_FOR_REAL_DATA:
            closes = np.array([float(p[0]) for p in prices])
            daily_returns = np.diff(closes) / closes[:-1]

            # Annualize (approx 252 trading days)
            avg_daily = np.mean(daily_returns)
            std_daily = np.std(daily_returns, ddof=1)

            stocks[sym]["expected_return"] = round(float(avg_daily * 252), 6)
            stocks[sym]["volatility"] = round(float(std_daily * np.sqrt(252)), 6)

    # Dividend yields from actual history
    _update_dividend_yields_from_db(db, stocks)


def _update_dividend_yields_from_db(db, stocks: dict[str, dict[str, Any]]):
    """Compute dividend yield = (sum of last 12 months dividends) / latest price."""
    for sym in list(stocks.keys()):
        row = db.execute(text(
            "SELECT COALESCE(SUM(dividend_amount), 0) "
            "FROM dividend_history "
            "WHERE symbol = :sym AND ex_date >= CURRENT_DATE - INTERVAL '18 months'"
        ), {"sym": sym}).fetchone()

        total_div = float(row[0]) if row and row[0] else 0.0
        if total_div <= 0:
            continue

        price_row = db.execute(text(
            "SELECT close_price FROM stock_prices "
            "WHERE symbol = :sym AND close_price IS NOT NULL "
            "ORDER BY price_date DESC LIMIT 1"
        ), {"sym": sym}).fetchone()

        if price_row and float(price_row[0]) > 0:
            stocks[sym]["dividend_yield"] = round(total_div / float(price_row[0]), 6)


def _compute_correlation_matrix(db, symbols: list[str]) -> np.ndarray:
    """Compute pairwise correlation from daily close prices."""
    import pandas as pd

    n = len(symbols)
    # Default moderate correlation
    corr = np.eye(n) * 0.7 + np.ones((n, n)) * 0.3
    np.fill_diagonal(corr, 1.0)

    try:
        # Build a dataframe of daily returns per symbol
        all_returns = {}
        for sym in symbols:
            prices = db.execute(text(
                "SELECT price_date, close_price FROM stock_prices "
                "WHERE symbol = :sym AND close_price IS NOT NULL "
                "ORDER BY price_date ASC"
            ), {"sym": sym}).fetchall()

            if len(prices) < MIN_DAYS_FOR_REAL_DATA:
                continue

            series = pd.Series(
                [float(p[1]) for p in prices],
                index=[p[0] for p in prices],
            )
            all_returns[sym] = series.pct_change().dropna()

        if len(all_returns) >= 2:
            df = pd.DataFrame(all_returns).dropna()
            if len(df) >= MIN_DAYS_FOR_REAL_DATA:
                real_corr = df.corr().values
                # Map symbols to indices in our symbols list
                df_syms = list(df.columns)
                for i, si in enumerate(df_syms):
                    for j, sj in enumerate(df_syms):
                        ii = symbols.index(si)
                        jj = symbols.index(sj)
                        corr[ii][jj] = real_corr[i][j]

    except Exception:
        logger.exception("Failed to compute correlation matrix — using defaults")

    return corr


# ---------------------------------------------------------------------------
# Public API (unchanged interface)
# ---------------------------------------------------------------------------

def get_covariance_matrix() -> np.ndarray:
    """Build the covariance matrix from volatilities and correlations."""
    volatilities = np.array([
        DSE_STOCKS[symbol]["volatility"] for symbol in STOCK_SYMBOLS
    ])
    vol_outer = np.outer(volatilities, volatilities)
    return vol_outer * CORRELATION_MATRIX


def get_expected_returns() -> np.ndarray:
    """Return the expected returns vector for all assets."""
    return np.array([
        DSE_STOCKS[symbol]["expected_return"] for symbol in STOCK_SYMBOLS
    ])


def is_using_real_data() -> bool:
    """Return True if metrics are computed from real price history."""
    return _using_real_data
