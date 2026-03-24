"""Dividend forecast calculations — uses real DB data when available."""

import logging
from sqlalchemy import text

from app.core import dse_data

logger = logging.getLogger("dse.dividend")


def _get_real_dividend_yield(symbol: str) -> float | None:
    """Try to compute real yield from dividend_history + latest price."""
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            div_row = db.execute(text(
                "SELECT COALESCE(SUM(dividend_amount), 0) "
                "FROM dividend_history "
                "WHERE symbol = :sym AND ex_date >= CURRENT_DATE - INTERVAL '18 months'"
            ), {"sym": symbol}).fetchone()

            total_div = float(div_row[0]) if div_row and div_row[0] else 0.0
            if total_div <= 0:
                return None

            price_row = db.execute(text(
                "SELECT close_price FROM stock_prices "
                "WHERE symbol = :sym AND close_price IS NOT NULL "
                "ORDER BY price_date DESC LIMIT 1"
            ), {"sym": symbol}).fetchone()

            if price_row and float(price_row[0]) > 0:
                return total_div / float(price_row[0])
        finally:
            db.close()
    except Exception:
        pass
    return None


def calculate_dividend_forecast(
    symbol: str,
    investment_amount: float,
    holding_period_years: int = 1,
) -> dict:
    """Calculate projected dividend income for a specific stock holding."""
    if symbol not in dse_data.DSE_STOCKS:
        raise ValueError(f"Unknown stock symbol: {symbol}")

    stock = dse_data.DSE_STOCKS[symbol]

    # Prefer real dividend yield from DB, fall back to static
    real_yield = _get_real_dividend_yield(symbol)
    dividend_yield = real_yield if real_yield is not None else stock["dividend_yield"]

    annual_dividend = investment_amount * dividend_yield

    return {
        "symbol": symbol,
        "name": stock["name"],
        "dividend_yield": round(dividend_yield, 6),
        "annual_dividend": round(annual_dividend, 2),
        "monthly_dividend": round(annual_dividend / 12, 2),
        "total_over_period": round(annual_dividend * holding_period_years, 2),
        "holding_period_years": holding_period_years,
        "data_source": "real" if real_yield is not None else "estimate",
    }


def calculate_portfolio_dividend_forecast(
    holdings: list[dict],
    total_investment: float,
    holding_period_years: int = 1,
) -> dict:
    """Calculate projected dividend income for a portfolio.

    holdings: list of {"symbol": str, "allocation": float (percentage 0-100)}
    """
    total_annual_dividend = 0.0
    holding_forecasts = []

    for holding in holdings:
        symbol = holding["symbol"]
        allocation_pct = holding["allocation"]
        allocated_amount = total_investment * (allocation_pct / 100.0)

        forecast = calculate_dividend_forecast(
            symbol=symbol,
            investment_amount=allocated_amount,
            holding_period_years=holding_period_years,
        )
        holding_forecasts.append(forecast)
        total_annual_dividend += forecast["annual_dividend"]

    return {
        "total_annual_dividend": round(total_annual_dividend, 2),
        "total_monthly_dividend": round(total_annual_dividend / 12, 2),
        "total_over_period": round(total_annual_dividend * holding_period_years, 2),
        "portfolio_yield": round(total_annual_dividend / total_investment, 4) if total_investment > 0 else 0.0,
        "holding_period_years": holding_period_years,
        "holdings": holding_forecasts,
    }
