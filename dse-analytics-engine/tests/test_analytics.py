import pytest

from app.services.dividend_calc import (
    calculate_dividend_forecast,
    calculate_portfolio_dividend_forecast,
)
from app.services.risk_scorer import score_risk_profile
from app.services.rebalancer import check_rebalancing


class TestDividendCalculator:
    """Test dividend forecast calculations."""

    def test_single_stock_forecast(self):
        result = calculate_dividend_forecast("NMB", 1_000_000.0)
        assert result["symbol"] == "NMB"
        assert result["annual_dividend"] > 0
        assert result["monthly_dividend"] > 0
        assert result["annual_dividend"] == pytest.approx(80_000.0, rel=0.01)

    def test_unknown_symbol_raises(self):
        with pytest.raises(ValueError):
            calculate_dividend_forecast("INVALID", 1_000_000.0)

    def test_multi_year_forecast(self):
        result = calculate_dividend_forecast("NMB", 1_000_000.0, holding_period_years=5)
        assert result["total_over_period"] == pytest.approx(
            result["annual_dividend"] * 5, rel=0.01
        )

    def test_portfolio_dividend_forecast(self):
        holdings = [
            {"symbol": "NMB", "allocation": 50.0},
            {"symbol": "CRDB", "allocation": 30.0},
            {"symbol": "GOVB", "allocation": 20.0},
        ]
        result = calculate_portfolio_dividend_forecast(
            holdings=holdings,
            total_investment=10_000_000.0,
        )
        assert result["total_annual_dividend"] > 0
        assert result["portfolio_yield"] > 0
        assert len(result["holdings"]) == 3


class TestRiskScorer:
    """Test risk scoring logic."""

    def test_conservative_profile(self):
        result = score_risk_profile(
            monthly_income=500_000.0,
            capital_available=1_000_000.0,
            investment_horizon=2,
            primary_goal="retirement",
        )
        assert result["recommended_tolerance"] == "conservative"

    def test_aggressive_profile(self):
        result = score_risk_profile(
            monthly_income=2_000_000.0,
            capital_available=50_000_000.0,
            investment_horizon=20,
            primary_goal="wealth",
            age=25,
        )
        assert result["recommended_tolerance"] == "aggressive"

    def test_moderate_profile(self):
        result = score_risk_profile(
            monthly_income=1_000_000.0,
            capital_available=5_000_000.0,
            investment_horizon=10,
            primary_goal="education",
        )
        assert result["recommended_tolerance"] == "moderate"

    def test_score_in_range(self):
        result = score_risk_profile(
            monthly_income=1_000_000.0,
            capital_available=5_000_000.0,
            investment_horizon=10,
            primary_goal="wealth",
        )
        assert 0 <= result["risk_score"] <= 100


class TestRebalancer:
    """Test rebalancing drift detection."""

    def test_no_rebalancing_needed(self):
        holdings = [
            {"symbol": "NMB", "target_allocation": 30.0, "current_allocation": 30.5},
            {"symbol": "CRDB", "target_allocation": 30.0, "current_allocation": 29.5},
            {"symbol": "GOVB", "target_allocation": 40.0, "current_allocation": 40.0},
        ]
        result = check_rebalancing(holdings)
        assert not result["needs_rebalancing"]
        assert len(result["alerts"]) == 0

    def test_rebalancing_needed(self):
        holdings = [
            {"symbol": "NMB", "target_allocation": 30.0, "current_allocation": 38.0},
            {"symbol": "CRDB", "target_allocation": 30.0, "current_allocation": 22.0},
            {"symbol": "GOVB", "target_allocation": 40.0, "current_allocation": 40.0},
        ]
        result = check_rebalancing(holdings)
        assert result["needs_rebalancing"]
        assert len(result["alerts"]) == 2

    def test_sell_action_for_overweight(self):
        holdings = [
            {"symbol": "NMB", "target_allocation": 30.0, "current_allocation": 40.0},
        ]
        result = check_rebalancing(holdings)
        assert result["alerts"][0]["action"] == "SELL"

    def test_buy_action_for_underweight(self):
        holdings = [
            {"symbol": "NMB", "target_allocation": 30.0, "current_allocation": 20.0},
        ]
        result = check_rebalancing(holdings)
        assert result["alerts"][0]["action"] == "BUY"

    def test_high_severity_for_large_drift(self):
        holdings = [
            {"symbol": "NMB", "target_allocation": 30.0, "current_allocation": 45.0},
        ]
        result = check_rebalancing(holdings)
        assert result["alerts"][0]["severity"] == "HIGH"
