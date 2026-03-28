"""Market regime detection — classifies DSE market conditions from recent price data.

Works with as little as 2 days of price history.
"""

import logging
from sqlalchemy import text
from app.core.database import SessionLocal

logger = logging.getLogger("dse.regime")

# Regime classifications
NORMAL = "NORMAL"
BULL_LOW_VOL = "BULL"
BEAR = "BEAR"
HIGH_VOLATILITY = "HIGH_VOLATILITY"
CRISIS = "CRISIS"


def detect_regime() -> dict:
    """Detect the current DSE market regime from recent price data.

    Returns dict with regime name, description, and constraint adjustments.
    """
    try:
        db = SessionLocal()
        try:
            return _analyze_market(db)
        finally:
            db.close()
    except Exception as e:
        logger.warning("Failed to detect market regime: %s", e)
        return _regime_result(NORMAL, "Unable to assess — defaulting to normal conditions", {})


def _analyze_market(db) -> dict:
    # Count available trading days
    day_count = db.execute(text(
        "SELECT COUNT(DISTINCT price_date) FROM stock_prices"
    )).scalar() or 0

    if day_count < 2:
        return _regime_result(NORMAL, "Insufficient price history for regime detection", {})

    # Compute market-wide average daily return over last 5, 10, 20 days
    # Using all stocks' close prices
    avg_returns = {}
    for window in [5, 10, 20]:
        row = db.execute(text("""
            WITH daily AS (
                SELECT price_date, AVG(close_price) as avg_price
                FROM stock_prices
                WHERE close_price IS NOT NULL
                GROUP BY price_date
                ORDER BY price_date DESC
                LIMIT :window
            ),
            returns AS (
                SELECT (avg_price - LAG(avg_price) OVER (ORDER BY price_date)) /
                       NULLIF(LAG(avg_price) OVER (ORDER BY price_date), 0) as ret
                FROM daily
            )
            SELECT AVG(ret), STDDEV(ret) FROM returns WHERE ret IS NOT NULL
        """), {"window": window}).fetchone()

        avg_ret = float(row[0]) if row and row[0] else 0.0
        std_ret = float(row[1]) if row and row[1] else 0.0
        avg_returns[window] = {"return": avg_ret, "volatility": std_ret}

    # Use the best available window
    best_window = min(20, max(day_count - 1, 2))
    key = 20 if best_window >= 20 else (10 if best_window >= 10 else 5)
    market_return = avg_returns.get(key, avg_returns.get(5, {"return": 0, "volatility": 0}))

    avg_ret = market_return["return"]
    avg_vol = market_return["volatility"]

    # Annualize (approx)
    annual_ret = avg_ret * 252
    annual_vol = avg_vol * (252 ** 0.5)

    # Classify regime
    if annual_ret < -0.20 and annual_vol > 0.30:
        regime = CRISIS
        desc = f"Market crisis detected: {annual_ret:.0%} annualized return with {annual_vol:.0%} volatility. Defensive positioning applied."
        adjustments = {"max_equity_mult": 0.60, "min_bonds_add": 0.15, "max_single_mult": 0.70}
    elif annual_ret < -0.10:
        regime = BEAR
        desc = f"Bear market: {annual_ret:.0%} annualized return. Reducing equity exposure."
        adjustments = {"max_equity_mult": 0.85, "min_bonds_add": 0.05, "max_single_mult": 0.85}
    elif annual_vol > 0.25:
        regime = HIGH_VOLATILITY
        desc = f"High volatility: {annual_vol:.0%} annualized. Reducing concentration risk."
        adjustments = {"max_equity_mult": 0.90, "min_bonds_add": 0.03, "max_single_mult": 0.75}
    elif annual_ret > 0.10 and annual_vol < 0.15:
        regime = BULL_LOW_VOL
        desc = f"Bull market with low volatility: {annual_ret:.0%} return, {annual_vol:.0%} volatility. Slightly increased equity allowance."
        adjustments = {"max_equity_mult": 1.05, "min_bonds_add": -0.03, "max_single_mult": 1.0}
    else:
        regime = NORMAL
        desc = "Normal market conditions. No adjustments applied."
        adjustments = {}

    logger.info("Market regime: %s (return=%.1f%%, vol=%.1f%%)", regime, annual_ret * 100, annual_vol * 100)
    return _regime_result(regime, desc, adjustments)


def _regime_result(regime: str, description: str, adjustments: dict) -> dict:
    return {
        "regime": regime,
        "description": description,
        "adjustments": adjustments,
    }


def apply_regime_adjustments(constraints: dict, regime_info: dict) -> dict:
    """Apply market regime adjustments to portfolio constraints."""
    adj = regime_info.get("adjustments", {})
    if not adj:
        return constraints

    adjusted = dict(constraints)
    if "max_equity_mult" in adj:
        adjusted["max_equity"] = min(1.0, adjusted["max_equity"] * adj["max_equity_mult"])
    if "min_bonds_add" in adj:
        adjusted["min_bonds"] = max(0.0, adjusted["min_bonds"] + adj["min_bonds_add"])
    if "max_single_mult" in adj:
        adjusted["max_single"] = adjusted["max_single"] * adj["max_single_mult"]

    return adjusted
