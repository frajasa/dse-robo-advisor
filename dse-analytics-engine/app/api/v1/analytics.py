from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.dividend_calc import (
    calculate_dividend_forecast,
    calculate_portfolio_dividend_forecast,
)
from app.services.risk_scorer import score_risk_profile
from app.services.rebalancer import check_rebalancing
from app.services.simulator import SimulationRequest, simulate_investment
from app.services.ai_advisor import get_ai_response

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


class DividendForecastRequest(BaseModel):
    symbol: str
    investment_amount: float = Field(gt=0)
    holding_period_years: int = Field(default=1, ge=1, le=30)


class PortfolioDividendRequest(BaseModel):
    holdings: list[dict] = Field(..., description="List of {symbol, allocation}")
    total_investment: float = Field(gt=0)
    holding_period_years: int = Field(default=1, ge=1, le=30)


class RiskProfileRequest(BaseModel):
    monthly_income: float = Field(ge=0)
    capital_available: float = Field(gt=0)
    investment_horizon: int = Field(ge=1, le=30)
    primary_goal: str
    age: int | None = None


class RebalancingRequest(BaseModel):
    holdings: list[dict] = Field(..., description="List of {symbol, target_allocation, current_allocation}")
    drift_threshold: float = Field(default=5.0, ge=1.0, le=20.0)


@router.post("/dividend/forecast")
async def forecast_dividend(request: DividendForecastRequest) -> dict:
    """Forecast dividend income for a single stock holding."""
    try:
        return calculate_dividend_forecast(
            symbol=request.symbol,
            investment_amount=request.investment_amount,
            holding_period_years=request.holding_period_years,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/dividend/portfolio")
async def forecast_portfolio_dividends(request: PortfolioDividendRequest) -> dict:
    """Forecast total dividend income for an entire portfolio."""
    try:
        return calculate_portfolio_dividend_forecast(
            holdings=request.holdings,
            total_investment=request.total_investment,
            holding_period_years=request.holding_period_years,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/risk/score")
async def score_risk(request: RiskProfileRequest) -> dict:
    """Score an investor's risk profile and recommend tolerance level."""
    return score_risk_profile(
        monthly_income=request.monthly_income,
        capital_available=request.capital_available,
        investment_horizon=request.investment_horizon,
        primary_goal=request.primary_goal,
        age=request.age,
    )


@router.post("/rebalance/check")
async def check_portfolio_rebalancing(request: RebalancingRequest) -> dict:
    """Check if a portfolio needs rebalancing based on allocation drift."""
    return check_rebalancing(
        holdings=request.holdings,
        drift_threshold=request.drift_threshold,
    )


@router.post("/simulate")
async def simulate(request: SimulationRequest) -> dict:
    """Simulate investment returns over a given time horizon."""
    try:
        result = simulate_investment(request)
        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class AiQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    portfolio_context: dict | None = None


@router.post("/ai/ask")
async def ask_ai_advisor(request: AiQuestionRequest) -> dict:
    """Ask the AI advisor a question about investments."""
    return get_ai_response(
        question=request.question,
        portfolio_context=request.portfolio_context,
    )
