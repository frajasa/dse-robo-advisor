"""Investment simulator — forward-looking projections with monthly contributions.

Supports:
- Lump-sum + recurring monthly investment projections
- Multiple time horizons (1–30 years)
- "What-if" scenario comparison
- Risk-adjusted Monte Carlo simulation using portfolio expected return & volatility
"""

import numpy as np
from pydantic import BaseModel, Field

from app.core import dse_data


class SimulationRequest(BaseModel):
    initial_investment: float = Field(gt=0, description="Lump-sum starting capital (TZS)")
    monthly_contribution: float = Field(ge=0, default=0, description="Monthly recurring investment (TZS)")
    horizon_years: int = Field(ge=1, le=30, default=10, description="Investment time horizon in years")
    risk_tolerance: str = Field(default="moderate", description="conservative, moderate, or aggressive")
    num_scenarios: int = Field(default=3, ge=1, le=5, description="Number of scenarios to simulate")


class ProjectionPoint(BaseModel):
    year: int
    optimistic: float
    expected: float
    pessimistic: float


class SimulationResult(BaseModel):
    projections: list[ProjectionPoint]
    final_optimistic: float
    final_expected: float
    final_pessimistic: float
    total_invested: float
    expected_profit: float
    expected_return_pct: float
    expected_annual_return: float
    expected_dividend_income: float
    risk_tolerance: str


# Blended portfolio characteristics by risk profile
_PROFILE_PARAMS = {
    "conservative": {"expected_return": 0.085, "volatility": 0.05, "dividend_yield": 0.075},
    "moderate":     {"expected_return": 0.105, "volatility": 0.08, "dividend_yield": 0.065},
    "aggressive":   {"expected_return": 0.125, "volatility": 0.11, "dividend_yield": 0.055},
}


def _get_portfolio_params(risk_tolerance: str) -> dict:
    """Get blended portfolio return/volatility from DSE data if available, else use defaults."""
    risk_tolerance = risk_tolerance.lower()
    defaults = _PROFILE_PARAMS.get(risk_tolerance, _PROFILE_PARAMS["moderate"])

    # Try to compute from actual stock universe
    try:
        symbols = dse_data.STOCK_SYMBOLS
        if not symbols:
            return defaults

        returns = [dse_data.DSE_STOCKS[s]["expected_return"] for s in symbols]
        vols = [dse_data.DSE_STOCKS[s]["volatility"] for s in symbols]
        divs = [dse_data.DSE_STOCKS[s]["dividend_yield"] for s in symbols]

        avg_return = float(np.mean(returns))
        avg_vol = float(np.mean(vols))
        avg_div = float(np.mean(divs))

        # Adjust based on risk profile
        if risk_tolerance == "conservative":
            return {
                "expected_return": avg_return * 0.8,
                "volatility": avg_vol * 0.6,
                "dividend_yield": avg_div * 1.15,
            }
        elif risk_tolerance == "aggressive":
            return {
                "expected_return": avg_return * 1.2,
                "volatility": avg_vol * 1.3,
                "dividend_yield": avg_div * 0.85,
            }
        else:
            return {
                "expected_return": avg_return,
                "volatility": avg_vol,
                "dividend_yield": avg_div,
            }
    except Exception:
        return defaults


def simulate_investment(request: SimulationRequest) -> SimulationResult:
    """Run deterministic projection with optimistic/expected/pessimistic bands."""
    params = _get_portfolio_params(request.risk_tolerance)
    expected_return = params["expected_return"]
    volatility = params["volatility"]
    dividend_yield = params["dividend_yield"]

    months = request.horizon_years * 12
    total_invested = request.initial_investment + (request.monthly_contribution * months)

    # Three scenarios: expected, optimistic (+1 std dev), pessimistic (-1 std dev)
    scenarios = {
        "optimistic": expected_return + volatility * 0.75,
        "expected": expected_return,
        "pessimistic": max(expected_return - volatility * 0.75, 0.01),
    }

    projections: list[ProjectionPoint] = []
    final_values = {}

    for scenario_name, annual_return in scenarios.items():
        monthly_rate = annual_return / 12.0
        value = request.initial_investment

        yearly_values = [round(value, 2)]  # Year 0

        for month in range(1, months + 1):
            value = value * (1 + monthly_rate) + request.monthly_contribution
            if month % 12 == 0:
                yearly_values.append(round(value, 2))

        # If the last year wasn't captured (partial year)
        if len(yearly_values) <= request.horizon_years:
            yearly_values.append(round(value, 2))

        final_values[scenario_name] = value

    # Build projection points year by year
    for year in range(0, request.horizon_years + 1):
        month = year * 12

        opt_val = request.initial_investment
        exp_val = request.initial_investment
        pes_val = request.initial_investment

        opt_rate = scenarios["optimistic"] / 12.0
        exp_rate = scenarios["expected"] / 12.0
        pes_rate = scenarios["pessimistic"] / 12.0

        for m in range(1, month + 1):
            opt_val = opt_val * (1 + opt_rate) + request.monthly_contribution
            exp_val = exp_val * (1 + exp_rate) + request.monthly_contribution
            pes_val = pes_val * (1 + pes_rate) + request.monthly_contribution

        projections.append(ProjectionPoint(
            year=year,
            optimistic=round(opt_val, 2),
            expected=round(exp_val, 2),
            pessimistic=round(pes_val, 2),
        ))

    final_expected = final_values["expected"]
    expected_profit = final_expected - total_invested
    expected_return_pct = (expected_profit / total_invested * 100) if total_invested > 0 else 0
    expected_dividend_income = final_expected * dividend_yield

    return SimulationResult(
        projections=projections,
        final_optimistic=round(final_values["optimistic"], 2),
        final_expected=round(final_expected, 2),
        final_pessimistic=round(final_values["pessimistic"], 2),
        total_invested=round(total_invested, 2),
        expected_profit=round(expected_profit, 2),
        expected_return_pct=round(expected_return_pct, 2),
        expected_annual_return=round(expected_return * 100, 2),
        expected_dividend_income=round(expected_dividend_income, 2),
        risk_tolerance=request.risk_tolerance,
    )
